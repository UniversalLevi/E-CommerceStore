import { Response, NextFunction } from 'express';
import { Request } from 'express';
import { Store } from '../models/Store';
import { StoreProduct } from '../models/StoreProduct';
import { StoreOrder } from '../models/StoreOrder';
import { RazorpayAccount } from '../models/RazorpayAccount';
import { storefrontService } from '../services/StorefrontService';
import { razorpayConnectService } from '../services/RazorpayConnectService';
import { razorpayService } from '../services/RazorpayService';
import { createError } from '../middleware/errorHandler';
import { createOrderSchema } from '../validators/storeDashboardValidator';

/**
 * Get store public info
 * GET /api/storefront/:slug
 */
export const getStorePublicInfo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const storeInfo = await storefrontService.getStorePublicInfo(slug);

    res.status(200).json({
      success: true,
      data: storeInfo,
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * List active products for storefront
 * GET /api/storefront/:slug/products
 */
export const listStorefrontProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { slug } = req.params;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;

    // Get store (payment connection not required for viewing products)
    const store = await Store.findOne({ slug: slug.toLowerCase(), status: 'active' });
    if (!store) {
      throw createError('Store not found or not active', 404);
    }

    const result = await storefrontService.getActiveProducts((store._id as any).toString(), page, limit);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Get product details for storefront
 * GET /api/storefront/:slug/products/:productId
 */
export const getStorefrontProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug, productId } = req.params;

    // Get store (payment connection not required for viewing products)
    const store = await Store.findOne({ slug: slug.toLowerCase(), status: 'active' });
    if (!store) {
      throw createError('Store not found or not active', 404);
    }

    const product = await storefrontService.getProductDetails(
      (store._id as any).toString(),
      productId
    );

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Create order (checkout)
 * POST /api/storefront/:slug/orders
 */
export const createStorefrontOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;

    // Get store (payment connection not required for creating orders, but will be checked during payment)
    const store = await Store.findOne({ slug: slug.toLowerCase(), status: 'active' });
    if (!store) {
      throw createError('Store not found or not active', 404);
    }

    // Check rate limit
    const rateLimit = await storefrontService.checkOrderRateLimit((store._id as any).toString());
    if (!rateLimit.allowed) {
      throw createError('Daily order limit reached. Please try again tomorrow.', 429);
    }

    // Validate order data
    const { error, value } = createOrderSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    // Fetch products and calculate totals
    let subtotal = 0;
    const orderItems: any[] = [];

    for (const item of value.items) {
      const product = await StoreProduct.findOne({
        _id: item.productId,
        storeId: store._id,
        status: 'active',
      });

      if (!product) {
        throw createError(`Product ${item.productId} not found`, 404);
      }

        // Check inventory if tracking is enabled
        if (product.inventoryTracking) {
          if (item.variant) {
            const variant = product.variants.find((v) => v.name === item.variant);
            if (!variant) {
              throw createError(`Variant ${item.variant} not found for product`, 400);
            }
            if (variant.inventory !== null && variant.inventory !== undefined && variant.inventory < item.quantity) {
              throw createError(`Insufficient inventory for variant ${item.variant}`, 400);
            }
          } else if (product.variants.length > 0) {
            throw createError('Variant is required for this product', 400);
          }
        }

      // Calculate price (use variant price if available, else base price)
      let itemPrice = product.basePrice;
      if (item.variant) {
        const variant = product.variants.find((v) => v.name === item.variant);
        if (variant && variant.price) {
          itemPrice = variant.price;
        }
      }

      const itemTotal = itemPrice * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: product._id,
        title: product.title,
        variant: item.variant || undefined,
        quantity: item.quantity,
        price: itemPrice,
      });
    }

    const shipping = value.shipping || 0;
    const total = subtotal + shipping;

    // Create order (orderId will be auto-generated)
    const order = new StoreOrder({
      storeId: store._id,
      customer: value.customer,
      shippingAddress: value.shippingAddress,
      items: orderItems,
      subtotal,
      shipping,
      total,
      currency: store.currency,
      paymentStatus: 'pending',
      fulfillmentStatus: 'pending',
    });

    await order.save();

    // Update inventory if tracking is enabled
    for (const item of value.items) {
      const product = await StoreProduct.findById(item.productId);
      if (product && product.inventoryTracking && item.variant) {
        const variant = product.variants.find((v) => v.name === item.variant);
        if (variant && variant.inventory !== null && variant.inventory !== undefined) {
          variant.inventory -= item.quantity;
          await product.save();
        }
      }
    }

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Create Razorpay order for payment
 * POST /api/storefront/:slug/orders/:orderId/payment
 */
export const createPaymentOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug, orderId } = req.params;

    // Validate store
    const validation = await storefrontService.validateStore(slug);
    if (!validation.valid || !validation.store) {
      throw createError(validation.error || 'Store not found', 404);
    }

    const store = validation.store;

    // Get order (orderId can be either _id or orderId field)
    const order = await StoreOrder.findOne({
      $or: [{ _id: orderId }, { orderId: orderId }],
      storeId: store._id,
    });

    if (!order) {
      throw createError('Order not found', 404);
    }

    if (order.paymentStatus !== 'pending') {
      throw createError('Order payment already processed', 400);
    }

    // Get Razorpay account (optional - only required for payment processing)
    const razorpayAccount = await RazorpayAccount.findOne({ storeId: store._id });
    if (!razorpayAccount || razorpayAccount.status !== 'active') {
      throw createError('Payment account is not connected. Please connect your Razorpay account in store settings to accept payments.', 400);
    }

    // Create Razorpay order
    // Note: For MVP, we'll use regular Razorpay orders
    // For production with Connect, use razorpayConnectService.createOrderForSeller
    const razorpayOrder = await razorpayService.createOrder(
      order.total,
      order.currency,
      order.orderId
    );

    // Update order with Razorpay order ID
    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    res.status(200).json({
      success: true,
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: order.total,
        currency: order.currency,
        keyId: razorpayService.getKeyId(),
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Verify payment
 * POST /api/storefront/:slug/orders/:orderId/verify
 */
export const verifyPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug, orderId } = req.params;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw createError('Missing payment verification data', 400);
    }

    // Validate store
    const validation = await storefrontService.validateStore(slug);
    if (!validation.valid || !validation.store) {
      throw createError(validation.error || 'Store not found', 404);
    }

    const store = validation.store;

    // Get order (orderId can be either _id or orderId field)
    const order = await StoreOrder.findOne({
      $or: [{ _id: orderId }, { orderId: orderId }],
      storeId: store._id,
    });

    if (!order) {
      throw createError('Order not found', 404);
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
    if (order.razorpayOrderId !== razorpay_order_id) {
      throw createError('Order ID mismatch', 400);
    }

    // Update order payment status
    order.paymentStatus = 'paid';
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save();

    res.status(200).json({
      success: true,
      data: {
        orderId: order.orderId,
        paymentStatus: 'paid',
      },
    });
  } catch (error: any) {
    next(error);
  }
};
