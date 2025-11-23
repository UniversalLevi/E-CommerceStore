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
  order_id: string;
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

    const razorpay = new window.Razorpay({
      ...options,
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
    });

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

