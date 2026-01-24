import { Response, NextFunction } from 'express';
import { Request } from 'express';
import { Store } from '../models/Store';
import { StoreProduct } from '../models/StoreProduct';
import { StoreOrder } from '../models/StoreOrder';
import { RazorpayAccount } from '../models/RazorpayAccount';
import { User } from '../models/User';
import { storefrontService } from '../services/StorefrontService';
import { razorpayConnectService } from '../services/RazorpayConnectService';
import { razorpayService } from '../services/RazorpayService';
import { createError } from '../middleware/errorHandler';
import { createOrderSchema } from '../validators/storeDashboardValidator';
import {
  sendOrderConfirmationEmail,
  sendNewOrderNotificationEmail,
  sendPaymentStatusEmail,
} from '../services/StoreEmailService';

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
    const { search, minPrice, maxPrice, variantDimension, sort } = req.query;

    // Get store (payment connection not required for viewing products)
    const store = await Store.findOne({ slug: slug.toLowerCase(), status: 'active' });
    if (!store) {
      throw createError('Store not found or not active', 404);
    }

    // Parse price filters (convert from currency units to paise if needed)
    let minPricePaise: number | undefined;
    let maxPricePaise: number | undefined;
    if (minPrice) {
      const min = parseFloat(minPrice as string);
      minPricePaise = min > 100 ? min : Math.round(min * 100); // Assume if > 100, already in paise
    }
    if (maxPrice) {
      const max = parseFloat(maxPrice as string);
      maxPricePaise = max > 100 ? max : Math.round(max * 100); // Assume if > 100, already in paise
    }

    const result = await storefrontService.getActiveProducts((store._id as any).toString(), page, limit, {
      search: search as string,
      minPrice: minPricePaise,
      maxPrice: maxPricePaise,
      variantDimension: variantDimension as string,
      sort: sort as 'price_asc' | 'price_desc' | 'newest' | 'oldest',
    });

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
    const { error, value } = createOrderSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ');
      throw createError(`Validation error: ${errorMessage}`, 400);
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

    // Convert shipping to paise if needed (assume it's already in paise, but handle if it's in currency units)
    let shipping = value.shipping || 0;
    // If shipping is less than 100, assume it's in currency units and convert to paise
    if (shipping > 0 && shipping < 100) {
      shipping = Math.round(shipping * 100);
    }
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

    try {
      await order.save();
    } catch (saveError: any) {
      // Handle unique constraint violations (orderId collision)
      if (saveError.code === 11000) {
        // Retry once with a new orderId - delete the property to let it regenerate
        delete (order as any).orderId;
        await order.save();
      } else {
        throw saveError;
      }
    }

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

    // Note: Emails will be sent after payment verification, not when order is created

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    console.error('Error creating storefront order:', error);
    // Log more details for debugging
    if (error.message) {
      console.error('Error message:', error.message);
    }
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }
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

    // Check if test mode is enabled
    const testMode = store.settings?.testMode === true;

    if (testMode) {
      // Test mode: Skip Razorpay, return test payment data
      order.razorpayOrderId = `test_order_${order.orderId}`;
      await order.save();

      res.status(200).json({
        success: true,
        data: {
          razorpayOrderId: order.razorpayOrderId,
          amount: order.total,
          currency: order.currency,
          keyId: 'test_key', // Test key for test mode
          testMode: true,
        },
      });
      return;
    }

    // Production mode: Require Razorpay account
    const razorpayAccount = await RazorpayAccount.findOne({ storeId: store._id });
    if (!razorpayAccount || razorpayAccount.status !== 'active') {
      throw createError('Payment account is not connected. Please connect your Razorpay account in store settings to accept payments, or enable test mode for testing.', 400);
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
        testMode: false,
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

    // Check if test mode is enabled
    const testMode = store.settings?.testMode === true;

    if (testMode) {
      // Test mode: Auto-approve payment
      if (order.razorpayOrderId && order.razorpayOrderId.startsWith('test_order_')) {
        order.paymentStatus = 'paid';
        order.razorpayPaymentId = `test_payment_${razorpay_payment_id || Date.now()}`;
        await order.save();

        // Send all emails after payment verification in test mode (non-blocking)
        try {
          const emailSettings = store.settings?.emailNotifications || {};
          
          // Send order confirmation to customer
          const sendCustomerEmails = emailSettings.orderConfirmation !== false; // Default to true
          if (sendCustomerEmails) {
            sendOrderConfirmationEmail(order, store.name).catch((err) => {
              console.error('Failed to send order confirmation email:', err);
            });
          }

          // Send new order notification to store owner
          const sendOwnerEmails = emailSettings.newOrderNotification !== false; // Default to true
          if (sendOwnerEmails) {
            const owner = await User.findById(store.owner);
            if (owner && owner.email) {
              sendNewOrderNotificationEmail(order, store.name, owner.email).catch((err) => {
                console.error('Failed to send new order notification email:', err);
              });
            }
          }

          // Send payment status email
          const sendPaymentEmails = emailSettings.paymentStatus !== false; // Default to true
          if (sendPaymentEmails) {
            sendPaymentStatusEmail(order, store.name, 'paid').catch((err) => {
              console.error('Failed to send payment confirmation email:', err);
            });
          }
        } catch (emailError) {
          console.error('Error sending payment email:', emailError);
        }

        res.status(200).json({
          success: true,
          data: {
            orderId: order.orderId,
            paymentStatus: 'paid',
            testMode: true,
          },
        });
        return;
      }
    }

    // Production mode: Verify signature
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

    // Send all emails after payment verification (non-blocking)
    try {
      const store = await Store.findById(order.storeId);
      if (store) {
        const emailSettings = store.settings?.emailNotifications || {};
        
        // Send order confirmation to customer (only after payment is verified)
        const sendCustomerEmails = emailSettings.orderConfirmation !== false; // Default to true
        if (sendCustomerEmails) {
          sendOrderConfirmationEmail(order, store.name).catch((err) => {
            console.error('Failed to send order confirmation email:', err);
          });
        }

        // Send new order notification to store owner (only after payment is verified)
        const sendOwnerEmails = emailSettings.newOrderNotification !== false; // Default to true
        if (sendOwnerEmails) {
          const owner = await User.findById(store.owner);
          if (owner && owner.email) {
            sendNewOrderNotificationEmail(order, store.name, owner.email).catch((err) => {
              console.error('Failed to send new order notification email:', err);
            });
          }
        }

        // Send payment status email
        const sendPaymentEmails = emailSettings.paymentStatus !== false; // Default to true
        if (sendPaymentEmails) {
          sendPaymentStatusEmail(order, store.name, 'paid').catch((err) => {
            console.error('Failed to send payment confirmation email:', err);
          });
        }
      }
    } catch (emailError) {
      console.error('Error sending order emails:', emailError);
    }

    res.status(200).json({
      success: true,
      data: {
        orderId: order.orderId,
        paymentStatus: 'paid',
        testMode: false,
      },
    });
  } catch (error: any) {
    next(error);
  }
};
