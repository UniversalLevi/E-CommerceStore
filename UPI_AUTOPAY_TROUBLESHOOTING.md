# UPI AutoPay Troubleshooting Guide

## Critical: Two Separate Settings Locations

Razorpay has **TWO separate places** to enable UPI:

### 1. General Payment Methods (You've done this ✅)
- **Location**: Dashboard → Settings → Payment Methods → UPI/QR
- **Status**: UPI = ACTIVATED, UPI Autopay = ACTIVATED ✅

### 2. Subscriptions-Specific Settings (CRITICAL - Check This!)
- **Location**: Dashboard → **Subscriptions** → **Settings** → **Payment Methods**
- **This is separate from general payment methods!**
- You need to enable UPI here specifically for subscriptions
- Cards are enabled by default, but UPI must be toggled ON separately

## Steps to Fix:

1. **Go to**: Razorpay Dashboard → **Subscriptions** (left sidebar)
2. **Click**: **Settings** (usually at the top or in a settings icon)
3. **Find**: **Payment Methods** section
4. **Enable**: Toggle **UPI** to ON (separate from Cards and eMandate)
5. **Save** the settings

## Why This Matters:

- General UPI settings control one-time payments
- **Subscriptions → Settings → Payment Methods** controls recurring/subscription payments
- Even if UPI is enabled globally, it might be disabled for subscriptions specifically
- This is the most common reason UPI doesn't show in subscription checkout

## Additional Checks:

1. **Amount Limit**: UPI AutoPay only works for amounts ≤ ₹5,000
   - Token charge (₹20): ✅ Works
   - Monthly Plan (₹999): ✅ Works
   - Pro Plan (₹4,999): ✅ Works
   - Lifetime Plan (₹9,999): ❌ Won't work (exceeds limit)

2. **Currency**: Must be INR

3. **Checkout Type**: Using Standard Checkout (not Subscription Buttons)

4. **Account Status**: KYC completed, account fully activated

## If Still Not Working:

1. **Clear browser cache** and try again
2. **Test in incognito mode** to rule out browser extensions
3. **Check browser console** for any Razorpay errors
4. **Contact Razorpay Support** with:
   - Screenshot of Subscriptions → Settings → Payment Methods
   - Your subscription plan amounts
   - Request: "Enable UPI AutoPay for subscriptions in my account"
