/**
 * Razorpay Checkout Integration
 * Lazy loads Razorpay script only when needed
 */

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id?: string; // Optional - not required when subscription_id is present
  subscription_id?: string; // For UPI autopay mandate
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

let razorpayScriptLoaded = false;
let razorpayScriptLoading = false;

/**
 * Load Razorpay script dynamically
 */
function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }

    if (razorpayScriptLoaded) {
      resolve();
      return;
    }

    if (razorpayScriptLoading) {
      // Wait for existing load to complete
      const checkInterval = setInterval(() => {
        if (window.Razorpay) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      return;
    }

    razorpayScriptLoading = true;

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      razorpayScriptLoaded = true;
      razorpayScriptLoading = false;
      resolve();
    };
    script.onerror = () => {
      razorpayScriptLoading = false;
      reject(new Error('Failed to load Razorpay script'));
    };
    document.body.appendChild(script);
  });
}

/**
 * Initialize Razorpay checkout
 */
export async function openRazorpayCheckout(
  options: Omit<RazorpayOptions, 'handler'>,
  onSuccess: (response: RazorpayResponse) => void,
  onError?: (error: any) => void
): Promise<void> {
  try {
    // Load Razorpay script if not already loaded
    await loadRazorpayScript();

    if (!window.Razorpay) {
      throw new Error('Razorpay SDK not available');
    }

    // Validate required options
    // For subscriptions, order_id is optional (subscription_id is used instead)
    if (!options.key || !options.amount) {
      throw new Error('Missing required Razorpay options: key or amount');
    }
    
    // Either order_id or subscription_id must be present
    if (!options.order_id && !options.subscription_id) {
      throw new Error('Missing required Razorpay options: either order_id or subscription_id must be provided');
    }

    // Build Razorpay options - configure for UPI autopay subscriptions
    const razorpayOptions: any = {
      key: options.key,
      currency: options.currency || 'INR',
      name: options.name || 'EAZY DROPSHIPPING',
      description: options.description || 'Subscription payment',
      handler: (response: RazorpayResponse) => {
        onSuccess(response);
      },
      modal: {
        ...options.modal,
        ondismiss: () => {
          if (onError) {
            onError(new Error('Payment cancelled by user'));
          }
        },
      },
      theme: options.theme || {
        color: '#ffffff',
      },
    };

    // CRITICAL: For UPI autopay subscriptions, we MUST use ONLY subscription_id
    // When both order_id and subscription_id are present, Razorpay treats it as a regular order
    // This prevents UPI from showing. We need to use ONLY subscription_id for subscription payments.
    if (options.subscription_id) {
      razorpayOptions.subscription_id = options.subscription_id;
      // DO NOT include order_id - it prevents UPI from showing
      // Razorpay will use the subscription's plan amount for authorization
      // The amount parameter is ignored when subscription_id is present
      // The subscription's plan amount (₹20) should be used automatically
      
      // Note: Razorpay subscriptions use the plan's amount, not the amount parameter
      // So we don't set amount here - it comes from the subscription's plan
      // If the amount shown is ₹5 instead of ₹20, it means the token plan in Razorpay
      // is configured with ₹5 (500 paise) instead of ₹20 (2000 paise)
      // Solution: Recreate the token plan with amount: 2000 paise using npm run create-razorpay-plans
      
      // Validate expected amount
      const expectedAmount = 2000; // ₹20 in paise
      const requestedAmount = options.amount;
      
      if (requestedAmount !== expectedAmount) {
        console.warn('⚠️ Amount mismatch: Server requested ₹' + (requestedAmount / 100) + ' but expected ₹20.');
        console.warn('   Razorpay will use the subscription plan amount, not the requested amount.');
        console.warn('   If checkout shows wrong amount, the token plan in Razorpay needs to be recreated.');
      }
      
      console.log('Razorpay subscription checkout config (UPI autopay):', {
        subscription_id: options.subscription_id,
        requested_amount: requestedAmount,
        requested_amount_rupees: `₹${requestedAmount / 100}`,
        expected_amount: expectedAmount,
        expected_amount_rupees: `₹${expectedAmount / 100}`,
        currency: options.currency,
        note: 'ONLY subscription_id passed - Razorpay will use subscription plan amount (should be ₹20)',
        warning: requestedAmount !== expectedAmount ? 'Amount mismatch detected! Token plan may be incorrectly configured.' : null
      });
    } else if (options.order_id) {
      // For regular payments (non-subscription), use order_id and amount
      razorpayOptions.order_id = options.order_id;
      razorpayOptions.amount = options.amount;
    }

    // Add prefill if provided
    if (options.prefill) {
      razorpayOptions.prefill = options.prefill;
    }

    const razorpay = new window.Razorpay(razorpayOptions);

    razorpay.on('payment.failed', (response: any) => {
      if (onError) {
        onError(new Error(response.error.description || 'Payment failed'));
      }
    });

    razorpay.open();
  } catch (error) {
    if (onError) {
      onError(error);
    } else {
      throw error;
    }
  }
}

/**
 * Format amount from paise to rupees
 */
export function formatAmount(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

