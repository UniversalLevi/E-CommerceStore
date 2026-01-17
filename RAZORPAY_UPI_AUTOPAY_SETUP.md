# Razorpay UPI AutoPay Setup Guide

## Important: UPI AutoPay Account Configuration

For UPI AutoPay to work with Razorpay subscriptions, you **MUST** enable it in your Razorpay Dashboard:

### Steps to Enable UPI AutoPay:

1. **Login to Razorpay Dashboard**: https://dashboard.razorpay.com
2. **Navigate to**: **Subscriptions → Settings → Payment Methods**
3. **Enable UPI**: Toggle "UPI" to ON (this is separate from general payment methods)
4. **Also check**: Dashboard → Settings → Payment Methods → UPI (general UPI should also be enabled)
5. **Contact Razorpay Support** (if needed): If you don't see UPI option in Subscriptions settings, contact Razorpay support

### Critical Requirements:

1. **Amount Limit**: UPI AutoPay only works for amounts **≤ ₹5,000 per transaction**
   - ✅ Monthly Plan (₹999): Works with UPI AutoPay
   - ❌ Pro Plan (₹4,999): Works (just under limit)
   - ❌ Lifetime Plan (₹9,999): **Won't work with UPI AutoPay** (exceeds ₹5,000 limit)
   
2. **Currency**: Must be INR (Indian Rupees)

3. **Account KYC**: Your Razorpay merchant account must have completed KYC

### Current Implementation:

The code is now configured to:
- ✅ Create subscriptions with trial periods
- ✅ Pass `subscription_id` to checkout (enables autopay)
- ✅ Configure `options.checkout.method.upi: 1` to enable UPI
- ✅ Prefill method to 'upi' to show UPI first
- ✅ Keep card as fallback for plans exceeding ₹5,000

### Testing:

1. **Test Mode**: UPI payments are auto-approved in test mode, but UPI options may not show
2. **Live Mode**: Switch to live mode to see actual UPI payment options
3. **Verify Account**: Check Razorpay dashboard → Subscriptions → Settings → Payment Methods

### Important Notes:

- **Pro & Lifetime Plans**: These plans exceed ₹5,000, so UPI AutoPay won't work for the full amount. Users will need to use card for these plans after trial.
- **Monthly Plan**: Fully supports UPI AutoPay (₹999 < ₹5,000)

### Contact Razorpay Support:

If UPI options still don't appear after enabling in dashboard:
- Email: support@razorpay.com
- Request: "Enable UPI AutoPay for Subscriptions in my account"
- Provide: Your Razorpay account details and mention you need UPI recurring enabled
