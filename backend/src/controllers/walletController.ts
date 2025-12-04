import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { Wallet } from '../models/Wallet';
import { WalletTransaction } from '../models/WalletTransaction';
import { PayoutMethod } from '../models/PayoutMethod';
import { WithdrawalRequest } from '../models/WithdrawalRequest';
import { razorpayService } from '../services/RazorpayService';
import { createError } from '../middleware/errorHandler';
import { createNotification } from '../utils/notifications';

// Minimum and maximum topup amounts in paise
const MIN_TOPUP_AMOUNT = 10000; // ₹100
const MAX_TOPUP_AMOUNT = 10000000; // ₹1,00,000

// Withdrawal rules
const MIN_WITHDRAW_AMOUNT = 100000; // ₹1,000 in paise
const WITHDRAW_FEE_PERCENT = 8; // 8%

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

/**
 * Get payout methods for the authenticated user
 * GET /api/wallet/payout-methods
 */
export const getPayoutMethods = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const userId = (req.user as any)._id;
    const methods = await PayoutMethod.find({ userId })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: methods,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create or update a payout method
 * POST /api/wallet/payout-methods
 */
export const upsertPayoutMethod = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const userId = (req.user as any)._id;
    const { id, type, label, bankAccount, upi, crypto, isDefault } = req.body;

    if (!type || !['bank', 'upi', 'crypto'].includes(type)) {
      throw createError('Invalid payout method type', 400);
    }

    if (!label || typeof label !== 'string') {
      throw createError('Label is required', 400);
    }

    // Basic validation per type
    if (type === 'bank') {
      if (
        !bankAccount ||
        !bankAccount.bankName ||
        !bankAccount.accountHolderName ||
        !bankAccount.accountNumber ||
        !bankAccount.ifsc
      ) {
        throw createError('Complete bank account details are required', 400);
      }
    }

    if (type === 'upi') {
      if (!upi || !upi.upiId) {
        throw createError('UPI ID is required', 400);
      }
    }

    if (type === 'crypto') {
      if (!crypto || !crypto.network || !crypto.address) {
        throw createError('Crypto network and address are required', 400);
      }
    }

    let method;

    if (id) {
      method = await PayoutMethod.findOne({ _id: id, userId });
      if (!method) {
        throw createError('Payout method not found', 404);
      }

      method.type = type;
      method.label = label;
      method.bankAccount = type === 'bank' ? bankAccount : undefined;
      method.upi = type === 'upi' ? upi : undefined;
      method.crypto = type === 'crypto' ? crypto : undefined;
      method.isDefault = !!isDefault;
      await method.save();
    } else {
      method = await PayoutMethod.create({
        userId,
        type,
        label,
        bankAccount: type === 'bank' ? bankAccount : undefined,
        upi: type === 'upi' ? upi : undefined,
        crypto: type === 'crypto' ? crypto : undefined,
        isDefault: !!isDefault,
      });
    }

    // If this is default, unset others
    if (method.isDefault) {
      await PayoutMethod.updateMany(
        { userId, _id: { $ne: method._id } },
        { $set: { isDefault: false } }
      );
    }

    res.json({
      success: true,
      data: method,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete payout method
 * DELETE /api/wallet/payout-methods/:id
 */
export const deletePayoutMethod = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const userId = (req.user as any)._id;
    const { id } = req.params;

    const method = await PayoutMethod.findOneAndDelete({ _id: id, userId });
    if (!method) {
      throw createError('Payout method not found', 404);
    }

    res.json({
      success: true,
      message: 'Payout method deleted',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request withdrawal (user)
 * POST /api/wallet/withdraw
 */
export const requestWithdrawal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const userId = (req.user as any)._id;
    const { amount, payoutMethodId, userNote } = req.body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      throw createError('Amount must be a positive number (in paise)', 400);
    }

    if (amount < MIN_WITHDRAW_AMOUNT) {
      throw createError(
        `Minimum withdrawal amount is ₹${MIN_WITHDRAW_AMOUNT / 100}`,
        400
      );
    }

    // Get wallet
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      throw createError('Wallet not found', 404);
    }

    // Get payout method (default if not provided)
    let method;
    if (payoutMethodId) {
      method = await PayoutMethod.findOne({ _id: payoutMethodId, userId });
    } else {
      method = await PayoutMethod.findOne({ userId, isDefault: true });
    }

    if (!method) {
      throw createError('No payout method found. Please add one before withdrawing.', 400);
    }

    // Calculate fee (deducted from requested amount)
    const feeAmount = Math.round((amount * WITHDRAW_FEE_PERCENT) / 100);
    // Amount debited from wallet is the full requested amount
    const debitedAmount = amount;

    if (wallet.balance < debitedAmount) {
      throw createError(
        `Insufficient balance. You need at least ₹${(debitedAmount / 100).toLocaleString(
          'en-IN',
          { minimumFractionDigits: 2 }
        )} for this withdrawal.`,
        400
      );
    }

    // Atomically deduct from wallet with balance check
    const updatedWallet = await Wallet.findOneAndUpdate(
      { _id: wallet._id, balance: { $gte: debitedAmount } },
      { $inc: { balance: -debitedAmount } },
      { new: true }
    );

    if (!updatedWallet) {
      throw createError('Insufficient balance for withdrawal', 400);
    }

    const balanceAfter = updatedWallet.balance;
    const balanceBefore = balanceAfter + debitedAmount;

    // grossAmount is what user receives (amount - fee)
    const grossAmount = amount - feeAmount;

    // Create withdrawal request
    const withdrawalDoc = await WithdrawalRequest.create({
      userId,
      walletId: wallet._id,
      payoutMethodId: method._id,
      amount, // amount debited from wallet
      feeAmount,
      grossAmount,
      currency: wallet.currency,
      status: 'pending',
      userNote: userNote || '',
    });

    // Create wallet transaction (debit, locked)
    await WalletTransaction.create({
      walletId: wallet._id,
      userId,
      orderId: null,
      zenOrderId: null,
      amount: debitedAmount,
      type: 'debit',
      reason: 'Withdrawal request',
      referenceId: String((withdrawalDoc as any)._id),
      balanceBefore,
      balanceAfter,
      metadata: {
        withdrawalId: withdrawalDoc._id,
        payoutMethodType: method.type,
      },
    });

    res.json({
      success: true,
      message: 'Withdrawal request created successfully',
      data: {
        id: withdrawalDoc._id,
        amount,
        feeAmount,
        grossAmount,
        amountFormatted: `₹${(amount / 100).toLocaleString('en-IN', {
          minimumFractionDigits: 2,
        })}`,
        feeFormatted: `₹${(feeAmount / 100).toLocaleString('en-IN', {
          minimumFractionDigits: 2,
        })}`,
        grossFormatted: `₹${(grossAmount / 100).toLocaleString('en-IN', {
          minimumFractionDigits: 2,
        })}`,
        status: withdrawalDoc.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's withdrawal requests
 * GET /api/wallet/withdrawals
 */
export const getUserWithdrawals = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const userId = (req.user as any)._id;
    const { limit = '20', offset = '0' } = req.query;

    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const offsetNum = parseInt(offset as string) || 0;

    const [withdrawals, total] = await Promise.all([
      WithdrawalRequest.find({ userId })
        .sort({ createdAt: -1 })
        .skip(offsetNum)
        .limit(limitNum)
        .populate('payoutMethodId')
        .lean(),
      WithdrawalRequest.countDocuments({ userId }),
    ]);

    res.json({
      success: true,
      data: withdrawals.map((w) => ({
        id: w._id,
        amount: w.amount,
        feeAmount: w.feeAmount,
        grossAmount: w.grossAmount,
        amountFormatted: `₹${(w.amount / 100).toLocaleString('en-IN', {
          minimumFractionDigits: 2,
        })}`,
        feeFormatted: `₹${(w.feeAmount / 100).toLocaleString('en-IN', {
          minimumFractionDigits: 2,
        })}`,
        grossFormatted: `₹${(w.grossAmount / 100).toLocaleString('en-IN', {
          minimumFractionDigits: 2,
        })}`,
        status: w.status,
        currency: w.currency,
        payoutMethod: w.payoutMethodId,
        createdAt: w.createdAt,
        processedAt: w.processedAt,
        txRef: w.txRef,
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

/**
 * Admin: List withdrawal requests
 * GET /api/wallet/admin/withdrawals
 */
export const adminListWithdrawals = async (
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

    const { status, userId, limit = '50', offset = '0' } = req.query;

    const limitNum = Math.min(parseInt(limit as string) || 50, 100);
    const offsetNum = parseInt(offset as string) || 0;

    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (userId) {
      query.userId = new mongoose.Types.ObjectId(userId as string);
    }

    const [withdrawals, total] = await Promise.all([
      WithdrawalRequest.find(query)
        .sort({ createdAt: -1 })
        .skip(offsetNum)
        .limit(limitNum)
        .populate('userId', 'name email')
        .populate('payoutMethodId')
        .lean(),
      WithdrawalRequest.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: withdrawals,
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
 * Admin: Update withdrawal status
 * POST /api/wallet/admin/withdrawals/:id/status
 */
export const adminUpdateWithdrawalStatus = async (
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

    const { id } = req.params;
    const { status, adminNote, txRef } = req.body;

    if (!status || !['pending', 'processing', 'approved', 'rejected', 'paid', 'failed'].includes(status)) {
      throw createError('Invalid status', 400);
    }

    const withdrawal = await WithdrawalRequest.findById(id);
    if (!withdrawal) {
      throw createError('Withdrawal request not found', 404);
    }

    // Prevent modification of rejected or paid withdrawals
    if (withdrawal.status === 'rejected') {
      throw createError('Cannot modify a rejected withdrawal request', 400);
    }
    if (withdrawal.status === 'paid') {
      throw createError('Cannot modify a paid withdrawal request', 400);
    }

    // If moving to rejected/failed from pending/processing/approved, optionally refund wallet
    const shouldRefundWallet =
      ['rejected', 'failed'].includes(status) &&
      ['pending', 'processing', 'approved'].includes(withdrawal.status);

    if (shouldRefundWallet) {
      const wallet = await Wallet.findById(withdrawal.walletId);
      if (!wallet) {
        throw createError('Wallet not found for withdrawal', 500);
      }

      // Refund the full amount that was debited (not grossAmount which is amount - fee)
      const refundAmount = withdrawal.amount;

      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore + refundAmount;

      // Credit wallet back
      await WalletTransaction.create({
        walletId: wallet._id,
        userId: withdrawal.userId,
        orderId: null,
        zenOrderId: null,
        amount: refundAmount,
        type: 'credit',
        reason: 'Withdrawal reversed',
        referenceId: `withdrawal_refund_${String((withdrawal as any)._id)}`,
        balanceBefore,
        balanceAfter,
        metadata: {
          withdrawalId: withdrawal._id,
          previousStatus: withdrawal.status,
        },
      });

      wallet.balance = balanceAfter;
      await wallet.save();
    }

    const previousStatus = withdrawal.status;
    withdrawal.status = status;
    if (adminNote !== undefined) {
      withdrawal.adminNote = adminNote;
    }
    if (txRef !== undefined) {
      withdrawal.txRef = txRef;
    }
    if (['approved', 'paid', 'rejected', 'failed'].includes(status)) {
      withdrawal.processedAt = new Date();
    }

    await withdrawal.save();

    // Send notification to user about status change
    const statusMessages: Record<string, { title: string; message: string }> = {
      pending: {
        title: 'Withdrawal Request Received',
        message: 'Your withdrawal request has been received and is under review.',
      },
      processing: {
        title: 'Withdrawal Being Processed',
        message: 'Your withdrawal request is being processed. You will receive the funds shortly.',
      },
      approved: {
        title: 'Withdrawal Approved',
        message: 'Your withdrawal request has been approved and will be processed soon.',
      },
      paid: {
        title: 'Withdrawal Completed',
        message: `Your withdrawal of ₹${((withdrawal.amount - withdrawal.feeAmount) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })} has been successfully processed.`,
      },
      rejected: {
        title: 'Withdrawal Request Rejected',
        message: `Your withdrawal request has been rejected. ₹${(withdrawal.amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })} has been refunded to your wallet.`,
      },
      failed: {
        title: 'Withdrawal Failed',
        message: `Your withdrawal request failed. ₹${(withdrawal.amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })} has been refunded to your wallet.`,
      },
    };

    const statusInfo = statusMessages[status];
    if (statusInfo) {
      await createNotification({
        userId: withdrawal.userId,
        type: 'withdrawal_status',
        title: statusInfo.title,
        message: statusInfo.message + (adminNote ? ` Note: ${adminNote}` : ''),
        link: '/dashboard/wallet',
        metadata: {
          withdrawalId: String((withdrawal as any)._id),
          status,
          previousStatus,
          amount: withdrawal.amount,
          feeAmount: withdrawal.feeAmount,
          grossAmount: withdrawal.amount - withdrawal.feeAmount,
        },
      });
    }

    res.json({
      success: true,
      message: 'Withdrawal status updated',
      data: withdrawal,
    });
  } catch (error) {
    next(error);
  }
};

