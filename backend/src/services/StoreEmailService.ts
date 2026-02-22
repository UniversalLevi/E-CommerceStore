import { sendEmail } from '../utils/email';
import { IStoreOrder } from '../models/StoreOrder';
import { Store } from '../models/Store';
import { User } from '../models/User';

function formatPrice(amount: number, currency: string = 'INR'): string {
  const currencySymbols: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
  const symbol = currencySymbols[currency] || currency;
  return `${symbol}${(amount / 100).toFixed(2)}`;
}

function buildItemsTable(order: IStoreOrder): string {
  const rows = order.items.map((item) => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #eee;font-size:14px;color:#333;">${item.title}${item.variant ? ` <span style="color:#888;">(${item.variant})</span>` : ''}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #eee;text-align:center;font-size:14px;color:#333;">${item.quantity}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #eee;text-align:right;font-size:14px;font-weight:600;color:#333;">${formatPrice(item.price * item.quantity, order.currency)}</td>
    </tr>`).join('');

  const discountRow = (order as any).discountAmount > 0 ? `
    <tr><td colspan="2" style="padding:8px 16px;text-align:right;font-size:13px;color:#059669;">Discount:</td>
    <td style="padding:8px 16px;text-align:right;font-size:13px;color:#059669;">-${formatPrice((order as any).discountAmount, order.currency)}</td></tr>` : '';

  const giftCardRow = (order as any).giftCardAmount > 0 ? `
    <tr><td colspan="2" style="padding:8px 16px;text-align:right;font-size:13px;color:#7c3aed;">Gift Card:</td>
    <td style="padding:8px 16px;text-align:right;font-size:13px;color:#7c3aed;">-${formatPrice((order as any).giftCardAmount, order.currency)}</td></tr>` : '';

  return `
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <thead><tr style="background:#f8f9fa;">
        <th style="padding:12px 16px;text-align:left;font-size:12px;text-transform:uppercase;color:#666;border-bottom:2px solid #e5e7eb;">Item</th>
        <th style="padding:12px 16px;text-align:center;font-size:12px;text-transform:uppercase;color:#666;border-bottom:2px solid #e5e7eb;">Qty</th>
        <th style="padding:12px 16px;text-align:right;font-size:12px;text-transform:uppercase;color:#666;border-bottom:2px solid #e5e7eb;">Price</th>
      </tr></thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr><td colspan="2" style="padding:8px 16px;text-align:right;font-size:13px;color:#666;">Subtotal:</td>
        <td style="padding:8px 16px;text-align:right;font-size:13px;color:#333;">${formatPrice(order.subtotal, order.currency)}</td></tr>
        <tr><td colspan="2" style="padding:8px 16px;text-align:right;font-size:13px;color:#666;">Shipping:</td>
        <td style="padding:8px 16px;text-align:right;font-size:13px;color:#333;">${formatPrice(order.shipping, order.currency)}</td></tr>
        ${discountRow}${giftCardRow}
        <tr><td colspan="2" style="padding:12px 16px;text-align:right;font-size:18px;font-weight:700;color:#111;border-top:2px solid #e5e7eb;">Total:</td>
        <td style="padding:12px 16px;text-align:right;font-size:18px;font-weight:700;color:#111;border-top:2px solid #e5e7eb;">${formatPrice(order.total, order.currency)}</td></tr>
      </tfoot>
    </table>`;
}

function buildAddress(addr: IStoreOrder['shippingAddress']): string {
  return `<p style="margin:0;line-height:1.8;font-size:14px;color:#333;">
    ${addr.name}<br>${addr.address1}<br>
    ${addr.address2 ? addr.address2 + '<br>' : ''}
    ${addr.city}, ${addr.state} ${addr.zip}<br>${addr.country}<br>
    <span style="color:#666;">Phone: ${addr.phone}</span></p>`;
}

function emailWrapper(brandColor: string, headerTitle: string, bodyHtml: string, footerName: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:600px;margin:0 auto;padding:24px;">
      <div style="background:linear-gradient(135deg,${brandColor} 0%,${brandColor}dd 100%);padding:32px;text-align:center;border-radius:16px 16px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">${headerTitle}</h1>
      </div>
      <div style="background:#fff;padding:32px;border-radius:0 0 16px 16px;border:1px solid #e5e7eb;border-top:0;">
        ${bodyHtml}
      </div>
      <div style="text-align:center;margin-top:24px;color:#9ca3af;font-size:12px;">
        <p>&copy; ${new Date().getFullYear()} ${footerName}. All rights reserved.</p>
      </div>
    </div>
  </body></html>`;
}

export async function sendOrderConfirmationEmail(order: IStoreOrder, storeName: string): Promise<boolean> {
  const body = `
    <p style="font-size:15px;color:#333;">Hello <strong>${order.customer.name}</strong>,</p>
    <p style="font-size:14px;color:#555;">Thank you for your order! We've received it and will process it shortly.</p>
    <div style="background:#f8f9fa;padding:20px;border-radius:12px;margin:20px 0;">
      <p style="margin:0 0 6px;font-size:13px;color:#666;"><strong>Order ID:</strong> <span style="color:#111;">${order.orderId}</span></p>
      <p style="margin:0 0 6px;font-size:13px;color:#666;"><strong>Date:</strong> <span style="color:#111;">${new Date(order.createdAt).toLocaleDateString()}</span></p>
      <p style="margin:0;font-size:13px;color:#666;"><strong>Payment:</strong> <span style="color:#111;text-transform:uppercase;">${order.paymentMethod} — ${order.paymentStatus}</span></p>
    </div>
    ${buildItemsTable(order)}
    <div style="background:#f8f9fa;padding:20px;border-radius:12px;margin:20px 0;">
      <h3 style="margin:0 0 8px;font-size:14px;color:#333;">Shipping Address</h3>
      ${buildAddress(order.shippingAddress)}
    </div>
    <p style="font-size:14px;color:#555;">We'll send you another email once your order has been shipped.</p>`;

  return sendEmail({
    to: order.customer.email,
    subject: `Order Confirmation - ${order.orderId} - ${storeName}`,
    html: emailWrapper('#667eea', 'Order Confirmation', body, storeName),
  });
}

export async function sendNewOrderNotificationEmail(order: IStoreOrder, storeName: string, ownerEmail: string): Promise<boolean> {
  const body = `
    <p style="font-size:15px;color:#333;">Hello,</p>
    <p style="font-size:14px;color:#555;">You have received a <strong>new order</strong> for your store <strong>${storeName}</strong>.</p>
    <div style="background:#ecfdf5;padding:20px;border-radius:12px;margin:20px 0;border-left:4px solid #10b981;">
      <p style="margin:0 0 6px;font-size:13px;color:#065f46;"><strong>Order ID:</strong> ${order.orderId}</p>
      <p style="margin:0 0 6px;font-size:13px;color:#065f46;"><strong>Customer:</strong> ${order.customer.name} (${order.customer.email})</p>
      <p style="margin:0 0 6px;font-size:13px;color:#065f46;"><strong>Phone:</strong> ${order.customer.phone}</p>
      <p style="margin:0;font-size:13px;color:#065f46;"><strong>Payment:</strong> ${order.paymentMethod.toUpperCase()} — ${order.paymentStatus.toUpperCase()}</p>
    </div>
    ${buildItemsTable(order)}
    <div style="background:#f8f9fa;padding:20px;border-radius:12px;margin:20px 0;">
      <h3 style="margin:0 0 8px;font-size:14px;color:#333;">Shipping Address</h3>
      ${buildAddress(order.shippingAddress)}
    </div>
    <p style="font-size:14px;color:#555;">Please process this order as soon as possible.</p>`;

  return sendEmail({
    to: ownerEmail,
    subject: `🛒 New Order - ${order.orderId} - ${storeName}`,
    html: emailWrapper('#10b981', 'New Order Received!', body, 'EazyDS'),
  });
}

export async function sendPaymentStatusEmail(
  order: IStoreOrder,
  storeName: string,
  status: 'paid' | 'failed' | 'refunded'
): Promise<boolean> {
  const configs: Record<string, { title: string; msg: string; color: string }> = {
    paid: { title: 'Payment Successful', msg: 'Your payment has been successfully processed.', color: '#10b981' },
    failed: { title: 'Payment Failed', msg: 'Unfortunately, your payment could not be processed. Please try again.', color: '#ef4444' },
    refunded: { title: 'Payment Refunded', msg: 'Your payment has been refunded. Please allow 5-7 business days.', color: '#f59e0b' },
  };
  const cfg = configs[status] || configs.paid;

  const body = `
    <p style="font-size:15px;color:#333;">Hello <strong>${order.customer.name}</strong>,</p>
    <p style="font-size:14px;color:#555;">${cfg.msg}</p>
    <div style="background:#f8f9fa;padding:20px;border-radius:12px;margin:20px 0;">
      <p style="margin:0 0 6px;font-size:13px;color:#666;"><strong>Order ID:</strong> ${order.orderId}</p>
      <p style="margin:0 0 6px;font-size:13px;color:#666;"><strong>Store:</strong> ${storeName}</p>
      <p style="margin:0 0 6px;font-size:13px;color:#666;"><strong>Amount:</strong> ${formatPrice(order.total, order.currency)}</p>
      <p style="margin:0;font-size:13px;color:#666;"><strong>Status:</strong> <span style="font-weight:700;text-transform:uppercase;">${status}</span></p>
    </div>`;

  return sendEmail({
    to: order.customer.email,
    subject: `${cfg.title} - Order ${order.orderId} - ${storeName}`,
    html: emailWrapper(cfg.color, cfg.title, body, storeName),
  });
}

export async function sendFulfillmentStatusEmail(
  order: IStoreOrder,
  storeName: string,
  status: 'pending' | 'fulfilled' | 'cancelled' | 'shipped'
): Promise<boolean> {
  const configs: Record<string, { title: string; msg: string; color: string; extra: string }> = {
    pending: { title: 'Order Pending', msg: 'Your order is being prepared.', color: '#f59e0b', extra: '' },
    fulfilled: { title: 'Order Fulfilled', msg: 'Your order has been fulfilled and is ready for shipment.', color: '#10b981', extra: '' },
    shipped: { title: 'Order Shipped', msg: 'Great news! Your order has been shipped.', color: '#3b82f6', extra: '<p style="font-size:14px;color:#555;">You should receive your order soon. We will send you tracking information if available.</p>' },
    cancelled: { title: 'Order Cancelled', msg: 'Your order has been cancelled.', color: '#ef4444', extra: '<p style="font-size:14px;color:#555;">If you have any questions about this cancellation, please contact us.</p>' },
  };
  const cfg = configs[status] || configs.pending;

  const body = `
    <p style="font-size:15px;color:#333;">Hello <strong>${order.customer.name}</strong>,</p>
    <p style="font-size:14px;color:#555;">${cfg.msg}</p>
    <div style="background:#f8f9fa;padding:20px;border-radius:12px;margin:20px 0;">
      <p style="margin:0 0 6px;font-size:13px;color:#666;"><strong>Order ID:</strong> ${order.orderId}</p>
      <p style="margin:0 0 6px;font-size:13px;color:#666;"><strong>Store:</strong> ${storeName}</p>
      <p style="margin:0;font-size:13px;color:#666;"><strong>Status:</strong> <span style="font-weight:700;text-transform:uppercase;">${status}</span></p>
    </div>
    ${cfg.extra}`;

  return sendEmail({
    to: order.customer.email,
    subject: `${cfg.title} - ${order.orderId} - ${storeName}`,
    html: emailWrapper(cfg.color, cfg.title, body, storeName),
  });
}
