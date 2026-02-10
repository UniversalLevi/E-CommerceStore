import { sendEmail } from '../utils/email';
import { IStoreOrder } from '../models/StoreOrder';
import { Store } from '../models/Store';
import { User } from '../models/User';

/**
 * Format price in currency
 */
function formatPrice(amount: number, currency: string = 'INR'): string {
  const currencySymbols: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };
  const symbol = currencySymbols[currency] || currency;
  return `${symbol}${(amount / 100).toFixed(2)}`;
}

/**
 * Send order confirmation email to customer
 */
export async function sendOrderConfirmationEmail(
  order: IStoreOrder,
  storeName: string
): Promise<boolean> {
  const itemsHtml = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${item.title}${
        item.variant ? ` (${item.variant})` : ''
      }</td>
      <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center;">${
        item.quantity
      }</td>
      <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: right;">${formatPrice(
        item.price * item.quantity,
        order.currency
      )}</td>
    </tr>
  `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Order Confirmation</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
        <p>Hello ${order.customer.name},</p>
        <p>Thank you for your order! We've received your order and will process it shortly.</p>
        
        <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h2 style="margin-top: 0; color: #667eea;">Order Details</h2>
          <p><strong>Order ID:</strong> ${order.orderId}</p>
          <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
          <p><strong>Store:</strong> ${storeName}</p>
        </div>

        <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #667eea;">Items Ordered</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f5f5f5;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e0e0e0;">Item</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e0e0e0;">Quantity</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e0e0e0;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold; border-top: 2px solid #e0e0e0;">Subtotal:</td>
                <td style="padding: 10px; text-align: right; font-weight: bold; border-top: 2px solid #e0e0e0;">${formatPrice(
                  order.subtotal,
                  order.currency
                )}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Shipping:</td>
                <td style="padding: 10px; text-align: right; font-weight: bold;">${formatPrice(
                  order.shipping,
                  order.currency
                )}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold; font-size: 18px; color: #667eea;">Total:</td>
                <td style="padding: 10px; text-align: right; font-weight: bold; font-size: 18px; color: #667eea;">${formatPrice(
                  order.total,
                  order.currency
                )}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #667eea;">Shipping Address</h3>
          <p>
            ${order.shippingAddress.name}<br>
            ${order.shippingAddress.address1}<br>
            ${order.shippingAddress.address2 ? order.shippingAddress.address2 + '<br>' : ''}
            ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}<br>
            ${order.shippingAddress.country}<br>
            Phone: ${order.shippingAddress.phone}
          </p>
        </div>

        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 20px 0;">
          <p style="margin: 0;"><strong>Payment Status:</strong> ${order.paymentStatus.toUpperCase()}</p>
          <p style="margin: 5px 0 0 0;"><strong>Fulfillment Status:</strong> ${order.fulfillmentStatus.toUpperCase()}</p>
        </div>

        <p style="margin-top: 30px;">We'll send you another email once your order has been shipped.</p>
        <p>If you have any questions, please contact us.</p>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>© ${new Date().getFullYear()} ${storeName}. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: order.customer.email,
    subject: `Order Confirmation - ${order.orderId} - ${storeName}`,
    html,
  });
}

/**
 * Send new order notification email to store owner
 */
export async function sendNewOrderNotificationEmail(
  order: IStoreOrder,
  storeName: string,
  ownerEmail: string
): Promise<boolean> {
  const itemsHtml = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${item.title}${
        item.variant ? ` (${item.variant})` : ''
      }</td>
      <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center;">${
        item.quantity
      }</td>
      <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: right;">${formatPrice(
        item.price * item.quantity,
        order.currency
      )}</td>
    </tr>
  `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Order Received</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">New Order Received!</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
        <p>Hello,</p>
        <p>You have received a new order for your store <strong>${storeName}</strong>.</p>
        
        <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h2 style="margin-top: 0; color: #10b981;">Order Details</h2>
          <p><strong>Order ID:</strong> ${order.orderId}</p>
          <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
          <p><strong>Customer:</strong> ${order.customer.name} (${order.customer.email})</p>
          <p><strong>Customer Phone:</strong> ${order.customer.phone}</p>
        </div>

        <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #10b981;">Items Ordered</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f5f5f5;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e0e0e0;">Item</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e0e0e0;">Quantity</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e0e0e0;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold; border-top: 2px solid #e0e0e0;">Subtotal:</td>
                <td style="padding: 10px; text-align: right; font-weight: bold; border-top: 2px solid #e0e0e0;">${formatPrice(
                  order.subtotal,
                  order.currency
                )}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Shipping:</td>
                <td style="padding: 10px; text-align: right; font-weight: bold;">${formatPrice(
                  order.shipping,
                  order.currency
                )}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold; font-size: 18px; color: #10b981;">Total:</td>
                <td style="padding: 10px; text-align: right; font-weight: bold; font-size: 18px; color: #10b981;">${formatPrice(
                  order.total,
                  order.currency
                )}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #10b981;">Shipping Address</h3>
          <p>
            ${order.shippingAddress.name}<br>
            ${order.shippingAddress.address1}<br>
            ${order.shippingAddress.address2 ? order.shippingAddress.address2 + '<br>' : ''}
            ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}<br>
            ${order.shippingAddress.country}<br>
            Phone: ${order.shippingAddress.phone}
          </p>
        </div>

        <div style="background: #d1fae5; padding: 15px; border-radius: 5px; border-left: 4px solid #10b981; margin: 20px 0;">
          <p style="margin: 0;"><strong>Payment Status:</strong> ${order.paymentStatus.toUpperCase()}</p>
          <p style="margin: 5px 0 0 0;"><strong>Fulfillment Status:</strong> ${order.fulfillmentStatus.toUpperCase()}</p>
        </div>

        <p style="margin-top: 30px;">Please process this order as soon as possible.</p>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>© ${new Date().getFullYear()} EazyDS. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: ownerEmail,
    subject: `New Order Received - ${order.orderId} - ${storeName}`,
    html,
  });
}

/**
 * Send payment status update email to customer
 */
export async function sendPaymentStatusEmail(
  order: IStoreOrder,
  storeName: string,
  status: 'paid' | 'failed' | 'refunded'
): Promise<boolean> {
  const statusMessages: Record<string, { title: string; message: string; color: string }> = {
    paid: {
      title: 'Payment Successful',
      message: 'Your payment has been successfully processed.',
      color: '#10b981',
    },
    failed: {
      title: 'Payment Failed',
      message: 'Unfortunately, your payment could not be processed. Please try again.',
      color: '#ef4444',
    },
    refunded: {
      title: 'Payment Refunded',
      message: 'Your payment has been refunded.',
      color: '#f59e0b',
    },
  };

  const statusInfo = statusMessages[status] || statusMessages.paid;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment ${statusInfo.title}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, ${statusInfo.color} 0%, ${statusInfo.color}dd 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">${statusInfo.title}</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
        <p>Hello ${order.customer.name},</p>
        <p>${statusInfo.message}</p>
        
        <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h2 style="margin-top: 0; color: ${statusInfo.color};">Order Information</h2>
          <p><strong>Order ID:</strong> ${order.orderId}</p>
          <p><strong>Store:</strong> ${storeName}</p>
          <p><strong>Amount:</strong> ${formatPrice(order.total, order.currency)}</p>
          <p><strong>Payment Status:</strong> ${status.toUpperCase()}</p>
        </div>

        ${status === 'paid' ? '<p>Your order will be processed and shipped soon.</p>' : ''}
        ${status === 'failed' ? '<p>Please try placing your order again or contact support if the issue persists.</p>' : ''}
        ${status === 'refunded' ? '<p>The refund will be processed to your original payment method. Please allow 5-7 business days for the refund to appear.</p>' : ''}
      </div>
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>© ${new Date().getFullYear()} ${storeName}. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: order.customer.email,
    subject: `Payment ${statusInfo.title} - Order ${order.orderId} - ${storeName}`,
    html,
  });
}

/**
 * Send fulfillment status update email to customer
 */
export async function sendFulfillmentStatusEmail(
  order: IStoreOrder,
  storeName: string,
  status: 'pending' | 'fulfilled' | 'cancelled' | 'shipped'
): Promise<boolean> {
  const statusMessages: Record<string, { title: string; message: string; color: string }> = {
    pending: {
      title: 'Order Pending',
      message: 'Your order is being prepared.',
      color: '#f59e0b',
    },
    fulfilled: {
      title: 'Order Fulfilled',
      message: 'Your order has been fulfilled and is ready for shipment.',
      color: '#10b981',
    },
    shipped: {
      title: 'Order Shipped',
      message: 'Great news! Your order has been shipped.',
      color: '#3b82f6',
    },
    cancelled: {
      title: 'Order Cancelled',
      message: 'Your order has been cancelled.',
      color: '#ef4444',
    },
  };

  const statusInfo = statusMessages[status] || statusMessages.pending;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order ${statusInfo.title}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, ${statusInfo.color} 0%, ${statusInfo.color}dd 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">${statusInfo.title}</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
        <p>Hello ${order.customer.name},</p>
        <p>${statusInfo.message}</p>
        
        <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h2 style="margin-top: 0; color: ${statusInfo.color};">Order Information</h2>
          <p><strong>Order ID:</strong> ${order.orderId}</p>
          <p><strong>Store:</strong> ${storeName}</p>
          <p><strong>Fulfillment Status:</strong> ${status.toUpperCase()}</p>
        </div>

        ${status === 'shipped' ? '<p>You should receive your order soon. We will send you tracking information if available.</p>' : ''}
        ${status === 'cancelled' ? '<p>If you have any questions about this cancellation, please contact us.</p>' : ''}
      </div>
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>© ${new Date().getFullYear()} ${storeName}. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: order.customer.email,
    subject: `Order ${statusInfo.title} - ${order.orderId} - ${storeName}`,
    html,
  });
}
