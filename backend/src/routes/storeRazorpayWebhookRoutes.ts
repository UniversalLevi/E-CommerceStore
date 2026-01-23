import express from 'express';
import { razorpayConnectService } from '../services/RazorpayConnectService';
import { createError } from '../middleware/errorHandler';

const router = express.Router();

/**
 * Razorpay Connect webhook handler
 * POST /api/store-dashboard/razorpay/webhook
 */
router.post('/webhook', async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    if (!signature) {
      throw createError('Missing signature', 400);
    }

    // Verify webhook signature
    const isValid = razorpayConnectService.verifyWebhookSignature(req.body, signature);
    if (!isValid) {
      throw createError('Invalid webhook signature', 401);
    }

    const event = JSON.parse(req.body.toString());
    console.log('Razorpay Connect webhook event:', event.event, event.payload);

    // Handle account status updates
    if (event.event === 'account.activated' || event.event === 'account.updated') {
      const accountData = event.payload.account;
      await razorpayConnectService.handleAccountStatusUpdate({
        account_id: accountData.id,
        status: accountData.status,
        email: accountData.email,
      });
    }

    // Always return 200 to Razorpay
    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Razorpay webhook error:', error);
    // Still return 200 to prevent Razorpay from retrying
    res.status(200).json({ success: false, error: error.message });
  }
});

export default router;
