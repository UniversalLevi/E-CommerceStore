import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ServiceOrder, ServiceType, PlanType } from '../models/ServiceOrder';
import { User } from '../models/User';
import { razorpayService } from '../services/RazorpayService';
import { services, getService, getPlan, isValidServiceCode, ServiceCode, PlanCode } from '../config/services';
import { createError } from '../middleware/errorHandler';
import { createNotification } from '../utils/notifications';
import { createServiceOrderSchema } from '../validators/serviceValidator';

/**
 * Create service order
 * POST /api/services/orders
 */
export const createServiceOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { error, value } = createServiceOrderSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ');
      throw createError(`Validation error: ${errorMessage}`, 400);
    }

    const { serviceType, planType, targetGoal } = value;

    if (!isValidServiceCode(serviceType)) {
      throw createError('Invalid service type', 400);
    }

    const service = getService(serviceType);
    if (!service) {
      throw createError('Service not found', 404);
    }

    const plan = getPlan(serviceType, planType as PlanCode);
    if (!plan) {
      throw createError(`Plan ${planType} not available for ${serviceType}`, 400);
    }

    // Calculate amount based on service type
    let amount = 0;
    let commissionRate: number | undefined;
    let finalTargetGoal: number | undefined;

    if (serviceType === 'ads_management') {
      amount = (plan as any).basePrice;
      commissionRate = (plan as any).commissionRate;
    } else if (serviceType === 'connect_experts') {
      amount = (plan as any).price;
      finalTargetGoal = (plan as any).targetGoal || targetGoal;
    }

    if (amount === 0) {
      throw createError('Invalid plan configuration', 500);
    }

    const userId = (req.user as any)._id;

    // Create service order
    const serviceOrder = await ServiceOrder.create({
      userId,
      serviceType: serviceType as ServiceType,
      planType: planType as PlanType,
      amount,
      commissionRate,
      targetGoal: finalTargetGoal,
      paymentStatus: 'pending',
      status: 'active',
      startDate: new Date(),
    });

    res.status(201).json({
      success: true,
      data: {
        orderId: serviceOrder._id,
        serviceType: serviceOrder.serviceType,
        planType: serviceOrder.planType,
        amount: serviceOrder.amount,
        commissionRate: serviceOrder.commissionRate,
        targetGoal: serviceOrder.targetGoal,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Create Razorpay order for service payment
 * POST /api/services/orders/:id/payment
 */
export const createServicePaymentOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { id } = req.params;
    const userId = (req.user as any)._id;

    const serviceOrder = await ServiceOrder.findOne({
      _id: id,
      userId,
    });

    if (!serviceOrder) {
      throw createError('Service order not found', 404);
    }

    if (serviceOrder.paymentStatus !== 'pending') {
      throw createError('Payment already processed for this order', 400);
    }

    // Create Razorpay order
    // Receipt must be max 40 characters for Razorpay
    const orderIdStr = String(serviceOrder._id);
    const shortOrderId = orderIdStr.substring(orderIdStr.length - 12); // Last 12 chars
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits
    const receipt = `svc_${shortOrderId}_${timestamp}`; // Total: 4 + 12 + 1 + 8 = 25 chars
    
    const razorpayOrder = await razorpayService.createOrder(
      serviceOrder.amount,
      'INR',
      receipt
    );

    // Update service order with Razorpay order ID
    serviceOrder.razorpayOrderId = razorpayOrder.id;
    await serviceOrder.save();

    res.status(200).json({
      success: true,
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: serviceOrder.amount,
        currency: 'INR',
        keyId: razorpayService.getKeyId(),
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Verify service payment
 * POST /api/services/orders/:id/verify
 */
export const verifyServicePayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { id } = req.params;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw createError('Missing payment verification data', 400);
    }

    const userId = (req.user as any)._id;

    const serviceOrder = await ServiceOrder.findOne({
      _id: id,
      userId,
    });

    if (!serviceOrder) {
      throw createError('Service order not found', 404);
    }

    // Verify signature
    const isValid = razorpayService.verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      throw createError('Invalid payment signature', 400);
    }

    // Verify order ID matches
    if (serviceOrder.razorpayOrderId !== razorpay_order_id) {
      throw createError('Order ID mismatch', 400);
    }

    // Update service order payment status
    serviceOrder.paymentStatus = 'paid';
    serviceOrder.razorpayPaymentId = razorpay_payment_id;
    serviceOrder.status = 'active';
    await serviceOrder.save();

    // Get service details for notification
    const service = getService(serviceOrder.serviceType);
    const plan = getPlan(serviceOrder.serviceType, serviceOrder.planType);

      // Create notification
      await createNotification({
        userId,
        type: 'system_update',
        title: 'Service Activated',
        message: `Your ${service?.name || serviceOrder.serviceType} service (${plan?.name || serviceOrder.planType}) has been activated!`,
        link: '/dashboard/services',
        metadata: {
          serviceType: serviceOrder.serviceType,
          planType: serviceOrder.planType,
          orderId: String(serviceOrder._id),
        },
      });

    res.status(200).json({
      success: true,
      data: {
        orderId: serviceOrder._id,
        paymentStatus: 'paid',
        serviceType: serviceOrder.serviceType,
        planType: serviceOrder.planType,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Get user's service orders
 * GET /api/services/orders
 */
export const getServiceOrders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const userId = (req.user as any)._id;
    const { serviceType, status, paymentStatus } = req.query;

    const query: any = { userId };
    if (serviceType) {
      query.serviceType = serviceType;
    }
    if (status) {
      query.status = status;
    }
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    const orders = await ServiceOrder.find(query)
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        orders,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Get specific service order
 * GET /api/services/orders/:id
 */
export const getServiceOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { id } = req.params;
    const userId = (req.user as any)._id;

    const order = await ServiceOrder.findOne({
      _id: id,
      userId,
    });

    if (!order) {
      throw createError('Service order not found', 404);
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Admin: Get all service orders
 * GET /api/services/orders/admin
 */
export const getAdminServiceOrders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user || (req.user as any).role !== 'admin') {
      throw createError('Admin access required', 403);
    }

    const { serviceType, status, paymentStatus, planType, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);

    const query: any = {};
    if (serviceType) {
      query.serviceType = serviceType;
    }
    if (status) {
      query.status = status;
    }
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }
    if (planType) {
      query.planType = planType;
    }

    const orders = await ServiceOrder.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string, 10))
      .lean();

    const total = await ServiceOrder.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page as string, 10),
          limit: parseInt(limit as string, 10),
          total,
          pages: Math.ceil(total / parseInt(limit as string, 10)),
        },
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Admin: Update service order status
 * PUT /api/services/orders/:id/admin
 */
export const updateServiceOrderStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user || (req.user as any).role !== 'admin') {
      throw createError('Admin access required', 403);
    }

    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    const order = await ServiceOrder.findById(id);
    if (!order) {
      throw createError('Service order not found', 404);
    }

    if (status) {
      order.status = status as any;
    }
    if (paymentStatus) {
      order.paymentStatus = paymentStatus as any;
    }

    await order.save();

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    next(error);
  }
};
