import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { Wallet } from '../models/Wallet';
import { WalletTransaction } from '../models/WalletTransaction';
import { razorpayService } from '../services/RazorpayService';
import { createError } from '../middleware/errorHandler';
import { createNotification } from '../utils/notifications';

// Minimum and maximum topup amounts in paise
const MIN_TOPUP_AMOUNT = 10000; // ₹100
const MAX_TOPUP_AMOUNT = 10000000; // ₹1,00,000

/**
 * Get wallet balance and settings
 * GET /api/wallet
 */
export const getWallet = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const userId = (req.user as any)._id;

    // Get or create wallet
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = await Wallet.create({ userId });
    }

    res.json({
      success: true,
      data: {
        balance: wallet.balance,
        balanceFormatted: `₹${(wallet.balance / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        currency: wallet.currency,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get wallet transactions with pagination
 * GET /api/wallet/transactions
 */
export const getTransactions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const userId = (req.user as any)._id;
    const {
      limit = '20',
      offset = '0',
      type,
      startDate,
      endDate,
    } = req.query;

    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const offsetNum = parseInt(offset as string) || 0;

    // Build query
    const query: any = { userId };

    if (type && (type === 'credit' || type === 'debit')) {
      query.type = type;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate as string);
      }
    }

    const [transactions, total] = await Promise.all([
      WalletTransaction.find(query)
        .sort({ createdAt: -1 })
        .skip(offsetNum)
        .limit(limitNum)
        .populate('orderId', 'shopifyOrderName')
        .lean(),
      WalletTransaction.countDocuments(query),
    ]);

    // Format transactions
    const formattedTransactions = transactions.map((tx) => ({
      id: tx._id,
      amount: tx.amount,
      amountFormatted: `₹${(tx.amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      type: tx.type,
      reason: tx.reason,
      referenceId: tx.referenceId,
      orderId: tx.orderId,
      balanceBefore: tx.balanceBefore,
      balanceAfter: tx.balanceAfter,
      createdAt: tx.createdAt,
    }));

    res.json({
      success: true,
      data: formattedTransactions,
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < total,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create Razorpay order for wallet topup
 * POST /api/wallet/topup
 */
export const createTopupOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { amount } = req.body;

    // Validate amount (in paise)
    if (!amount || typeof amount !== 'number') {
      throw createError('Amount is required and must be a number', 400);
    }

    if (amount < MIN_TOPUP_AMOUNT) {
      throw createError(`Minimum topup amount is ₹${MIN_TOPUP_AMOUNT / 100}`, 400);
    }

    if (amount > MAX_TOPUP_AMOUNT) {
      throw createError(`Maximum topup amount is ₹${MAX_TOPUP_AMOUNT / 100}`, 400);
    }

    const userId = (req.user as any)._id;

    // Ensure wallet exists
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = await Wallet.create({ userId });
    }

    // Create receipt ID
    const userIdStr = userId.toString();
    const userIdShort = userIdStr.slice(-12);
    const timestamp = Date.now().toString().slice(-8);
    const receipt = `wtp_${userIdShort}_${timestamp}`;

    // Create Razorpay order
    const order = await razorpayService.createOrder(amount, 'INR', receipt);

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: razorpayService.getKeyId(),
        walletId: wallet._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify payment and credit wallet
 * POST /api/wallet/topup/verify
 */
export const verifyTopup = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw createError('Missing required payment fields', 400);
    }

    const userId = (req.user as any)._id;

    // Check idempotency - if this payment was already processed
    const existingTx = await WalletTransaction.findOne({
      referenceId: razorpay_payment_id,
    });
    if (existingTx) {
      // Already processed, return success (idempotent)
      const wallet = await Wallet.findOne({ userId });
      return res.json({
        success: true,
        message: 'Payment already verified',
        data: {
          balance: wallet?.balance || 0,
          balanceFormatted: `₹${((wallet?.balance || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          transactionId: existingTx._id,
        },
      });
    }

    // Verify signature
    const isValidSignature = razorpayService.verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValidSignature) {
      throw createError('Invalid payment signature', 400);
    }

    // Fetch order from Razorpay to get amount
    const razorpayOrder = await razorpayService.getOrder(razorpay_order_id);
    const amount = razorpayOrder.amount;

    // Get wallet
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = await Wallet.create({ userId });
    }

    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore + amount;

    // Create transaction record first (for idempotency check)
    // Using findOneAndUpdate with upsert=false ensures we don't create duplicates
    const transaction = await WalletTransaction.create({
      walletId: wallet._id,
      userId,
      amount,
      type: 'credit',
      reason: 'Topup - Razorpay',
      referenceId: razorpay_payment_id,
      balanceBefore,
      balanceAfter,
      metadata: {
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      },
    });

    // Update wallet balance atomically
    await Wallet.findByIdAndUpdate(
      wallet._id,
      { $inc: { balance: amount } },
      { new: true }
    );

    // Create notification
    await createNotification({
      userId,
      type: 'system_update',
      title: 'Wallet Topped Up',
      message: `₹${(amount / 100).toLocaleString('en-IN')} has been added to your wallet.`,
      link: '/dashboard/wallet',
      metadata: {
        amount,
        transactionId: transaction._id,
      },
    });

    res.json({
      success: true,
      message: 'Wallet topped up successfully',
      data: {
        balance: balanceAfter,
        balanceFormatted: `₹${(balanceAfter / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        transactionId: transaction._id,
        amount,
        amountFormatted: `₹${(amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Get all wallets (paginated)
 * GET /api/admin/wallets
 */
export const adminGetWallets = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    if (req.user.role !== 'admin') {
      throw createError('Admin access required', 403);
    }

    const {
      limit = '20',
      offset = '0',
      search,
      sortBy = 'balance',
      sortOrder = 'desc',
      minBalance,
      maxBalance,
    } = req.query;

    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const offsetNum = parseInt(offset as string) || 0;

    // Build query
    const query: any = {};

    if (minBalance) {
      query.balance = { ...query.balance, $gte: parseInt(minBalance as string) };
    }
    if (maxBalance) {
      query.balance = { ...query.balance, $lte: parseInt(maxBalance as string) };
    }

    // Build sort
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const [wallets, total] = await Promise.all([
      Wallet.find(query)
        .sort(sort)
        .skip(offsetNum)
        .limit(limitNum)
        .populate('userId', 'name email mobile')
        .lean(),
      Wallet.countDocuments(query),
    ]);

    // Calculate total liability
    const totalLiability = await Wallet.aggregate([
      { $group: { _id: null, total: { $sum: '$balance' } } },
    ]);

    res.json({
      success: true,
      data: wallets.map((w) => ({
        id: w._id,
        user: w.userId,
        balance: w.balance,
        balanceFormatted: `₹${(w.balance / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        currency: w.currency,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
      })),
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < total,
      },
      stats: {
        totalLiability: totalLiability[0]?.total || 0,
        totalLiabilityFormatted: `₹${((totalLiability[0]?.total || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Manually adjust wallet balance
 * POST /api/admin/wallets/:userId/adjust
 */
export const adminAdjustWallet = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    if (req.user.role !== 'admin') {
      throw createError('Admin access required', 403);
    }

    const { userId } = req.params;
    const { amount, type, reason, reference } = req.body;

    // Validate input
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      throw createError('Amount must be a positive number', 400);
    }

    if (!type || !['credit', 'debit'].includes(type)) {
      throw createError('Type must be either credit or debit', 400);
    }

    if (!reason || typeof reason !== 'string') {
      throw createError('Reason is required', 400);
    }

    // Get wallet
    const wallet = await Wallet.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (!wallet) {
      throw createError('Wallet not found', 404);
    }

    const balanceBefore = wallet.balance;
    const balanceAfter = type === 'credit' ? balanceBefore + amount : balanceBefore - amount;

    // Check if debit would result in negative balance
    if (type === 'debit' && wallet.balance < amount) {
      throw createError('Insufficient balance for debit', 400);
    }

    // For debit, use atomic update with balance check
    if (type === 'debit') {
      const updateResult = await Wallet.findOneAndUpdate(
        { _id: wallet._id, balance: { $gte: amount } },
        { $inc: { balance: -amount } },
        { new: true }
      );

      if (!updateResult) {
        throw createError('Insufficient balance for debit', 400);
      }
    } else {
      // For credit, just add the amount
      await Wallet.findByIdAndUpdate(
        wallet._id,
        { $inc: { balance: amount } },
        { new: true }
      );
    }

    // Create transaction record
    const transaction = await WalletTransaction.create({
      walletId: wallet._id,
      userId: new mongoose.Types.ObjectId(userId),
      amount,
      type,
      reason: `Manual adjustment: ${reason}`,
      referenceId: reference || `admin_${Date.now()}`,
      balanceBefore,
      balanceAfter,
      metadata: {
        adjustedBy: (req.user as any)._id,
        adminEmail: req.user.email,
        originalReason: reason,
      },
    });

    // Create notification for user
    await createNotification({
      userId: new mongoose.Types.ObjectId(userId),
      type: 'system_update',
      title: type === 'credit' ? 'Wallet Credit' : 'Wallet Debit',
      message: `${type === 'credit' ? 'Added' : 'Deducted'} ₹${(amount / 100).toLocaleString('en-IN')} ${type === 'credit' ? 'to' : 'from'} your wallet. Reason: ${reason}`,
      link: '/dashboard/wallet',
    });

    res.json({
      success: true,
      message: `Wallet ${type}ed successfully`,
      data: {
        transactionId: transaction._id,
        balanceBefore,
        balanceAfter,
        balanceAfterFormatted: `₹${(balanceAfter / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Get wallet transactions for a specific user
 * GET /api/admin/wallets/:userId/transactions
 */
export const adminGetUserTransactions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    if (req.user.role !== 'admin') {
      throw createError('Admin access required', 403);
    }

    const { userId } = req.params;
    const { limit = '50', offset = '0' } = req.query;

    const limitNum = Math.min(parseInt(limit as string) || 50, 100);
    const offsetNum = parseInt(offset as string) || 0;

    const [transactions, total] = await Promise.all([
      WalletTransaction.find({ userId: new mongoose.Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip(offsetNum)
        .limit(limitNum)
        .lean(),
      WalletTransaction.countDocuments({ userId: new mongoose.Types.ObjectId(userId) }),
    ]);

    res.json({
      success: true,
      data: transactions.map((tx) => ({
        id: tx._id,
        amount: tx.amount,
        amountFormatted: `₹${(tx.amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        type: tx.type,
        reason: tx.reason,
        referenceId: tx.referenceId,
        balanceBefore: tx.balanceBefore,
        balanceAfter: tx.balanceAfter,
        createdAt: tx.createdAt,
        metadata: tx.metadata,
      })),
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < total,
      },
    });
  } catch (error) {
    next(error);
  }
};

