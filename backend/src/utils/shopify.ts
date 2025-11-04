import axios from 'axios';

export interface ShopifyValidationResult {
  ok: boolean;
  shop?: {
    id: number;
    name: string;
    email: string;
    domain: string;
    myshopify_domain: string;
    plan_name: string;
  };
  error?: string;
  statusCode?: number;
}

/**
 * Validate Shopify credentials by making a test API call
 * @param shopDomain - e.g., "mystore.myshopify.com"
 * @param accessToken - Shopify access token
 * @param apiVersion - Shopify API version (default: '2024-01')
 * @returns Validation result with shop info or error
 */
export async function validateShopifyCredentials(
  shopDomain: string,
  accessToken: string,
  apiVersion: string = '2024-01'
): Promise<ShopifyValidationResult> {
  try {
    const url = `https://${shopDomain}/admin/api/${apiVersion}/shop.json`;

    const response = await axios.get(url, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      timeout: 5000, // Reduced to 5 second timeout for faster failures
    });

    if (response.status === 200 && response.data?.shop) {
      return {
        ok: true,
        shop: response.data.shop,
      };
    }

    return {
      ok: false,
      error: 'Invalid response from Shopify',
      statusCode: response.status,
    };
  } catch (error: any) {
    // Handle specific error cases
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      if (status === 401) {
        return {
          ok: false,
          error: 'Invalid access token or unauthorized',
          statusCode: 401,
        };
      }

      if (status === 403) {
        return {
          ok: false,
          error: 'Access forbidden. Check your app permissions and scopes.',
          statusCode: 403,
        };
      }

      if (status === 404) {
        return {
          ok: false,
          error: 'Store not found. Check the shop domain.',
          statusCode: 404,
        };
      }

      if (status === 429) {
        return {
          ok: false,
          error: 'Rate limit exceeded. Please try again later.',
          statusCode: 429,
        };
      }

      return {
        ok: false,
        error: data?.errors || `Shopify API error (${status})`,
        statusCode: status,
      };
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return {
        ok: false,
        error: 'Could not connect to Shopify. Check the shop domain.',
      };
    }

    if (error.code === 'ETIMEDOUT') {
      return {
        ok: false,
        error: 'Connection timeout. Please try again.',
      };
    }

    return {
      ok: false,
      error: error.message || 'Unknown error occurred',
    };
  }
}

/**
 * Validate shop domain format
 * @param domain - Shop domain to validate
 * @returns true if valid
 */
export function isValidShopDomain(domain: string): boolean {
  if (!domain) return false;

  // Must end with .myshopify.com
  const regex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
  return regex.test(domain);
}

/**
 * Normalize shop domain (add .myshopify.com if missing)
 * @param input - User input (e.g., "mystore" or "mystore.myshopify.com")
 * @returns Normalized domain (e.g., "mystore.myshopify.com")
 */
export function normalizeShopDomain(input: string): string {
  if (!input) return '';

  const trimmed = input.trim().toLowerCase();

  // Already has .myshopify.com
  if (trimmed.endsWith('.myshopify.com')) {
    return trimmed;
  }

  // Add .myshopify.com
  return `${trimmed}.myshopify.com`;
}



