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
  amount?: number; // Optional - not required when subscription_id is present
  currency?: string;
  name?: string;
  description?: string;
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
    if (!options.key) {
      throw new Error('Missing required Razorpay option: key');
    }
    
    // Either order_id or subscription_id must be present
    if (!options.order_id && !options.subscription_id) {
      throw new Error('Missing required Razorpay options: either order_id or subscription_id must be provided');
    }
    
    // For regular orders (not subscriptions), amount is required
    if (options.order_id && !options.amount) {
      throw new Error('Missing required Razorpay option: amount (required for order_id)');
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
      // DO NOT include amount - Razorpay will use the subscription's plan/addon amount
      // The amount parameter conflicts with subscription_id and causes 400 errors
      // Razorpay will automatically use the subscription's authorization amount (from addons or plan)
      
      // Explicitly ensure amount is NOT in the options (even if undefined)
      if ('amount' in razorpayOptions) {
        delete razorpayOptions.amount;
      }
      if ('order_id' in razorpayOptions) {
        delete razorpayOptions.order_id;
      }
      
      console.log('Razorpay subscription checkout config (UPI autopay):', {
        subscription_id: options.subscription_id,
        currency: options.currency || 'INR',
        has_amount: 'amount' in razorpayOptions,
        has_order_id: 'order_id' in razorpayOptions,
        note: 'ONLY subscription_id passed - Razorpay will use subscription plan/addon amount automatically'
      });
    } else if (options.order_id) {
      // For regular payments (non-subscription), use order_id and amount
      razorpayOptions.order_id = options.order_id;
      razorpayOptions.amount = options.amount;
      
      // Explicitly ensure subscription_id is NOT in the options
      if ('subscription_id' in razorpayOptions) {
        delete razorpayOptions.subscription_id;
      }
    }

    // Add prefill if provided
    if (options.prefill) {
      razorpayOptions.prefill = options.prefill;
    }

    // Final validation: Ensure no conflicting parameters
    if (razorpayOptions.subscription_id) {
      // For subscriptions, ensure amount and order_id are completely absent
      delete razorpayOptions.amount;
      delete razorpayOptions.order_id;
    }

    // Log final configuration for debugging
    console.log('Final Razorpay options:', {
      has_key: !!razorpayOptions.key,
      has_subscription_id: !!razorpayOptions.subscription_id,
      has_order_id: !!razorpayOptions.order_id,
      has_amount: !!razorpayOptions.amount,
      currency: razorpayOptions.currency,
      description: razorpayOptions.description,
    });

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

