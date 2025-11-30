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

/**
 * Fetch orders from Shopify API
 * @param shopDomain - e.g., "mystore.myshopify.com"
 * @param accessToken - Shopify access token
 * @param apiVersion - Shopify API version (default: '2024-01')
 * @param startDate - Optional start date filter
 * @param endDate - Optional end date filter
 * @returns Array of orders with revenue data
 */
export async function fetchShopifyOrders(
  shopDomain: string,
  accessToken: string,
  apiVersion: string = '2024-01',
  startDate?: Date,
  endDate?: Date
): Promise<Array<{
  id: number;
  orderNumber: number;
  totalPrice: string;
  subtotalPrice: string;
  totalTax: string;
  currency: string;
  financialStatus: string;
  fulfillmentStatus: string;
  createdAt: string;
  updatedAt: string;
}>> {
  try {
    let url = `https://${shopDomain}/admin/api/${apiVersion}/orders.json?status=any&limit=250`;
    
    // Add date filters if provided
    if (startDate) {
      const startDateStr = startDate.toISOString();
      url += `&created_at_min=${startDateStr}`;
    }
    if (endDate) {
      const endDateStr = endDate.toISOString();
      url += `&created_at_max=${endDateStr}`;
    }

    const allOrders: any[] = [];
    let hasNextPage = true;
    let pageInfo: string | null = null;

    // Handle pagination (Shopify uses cursor-based pagination)
    while (hasNextPage) {
      let currentUrl = url;
      if (pageInfo) {
        currentUrl += `&page_info=${pageInfo}`;
      }

      const response = await axios.get(currentUrl, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      if (response.data?.orders) {
        allOrders.push(...response.data.orders);
      }

      // Check for next page
      const linkHeader = response.headers['link'];
      if (linkHeader && linkHeader.includes('rel="next"')) {
        // Extract page_info from Link header
        const nextMatch = linkHeader.match(/page_info=([^&>]+)/);
        if (nextMatch) {
          pageInfo = nextMatch[1];
        } else {
          hasNextPage = false;
        }
      } else {
        hasNextPage = false;
      }

      // Small delay to avoid rate limiting
      if (hasNextPage) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return allOrders.map((order) => {
      // Calculate fulfillment status from fulfillments array
      let fulfillmentStatus = 'unfulfilled';
      if (order.fulfillments && Array.isArray(order.fulfillments) && order.fulfillments.length > 0) {
        // Check if all line items are fulfilled
        const totalQuantity = order.line_items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;
        const fulfilledQuantity = order.fulfillments.reduce((sum: number, fulfillment: any) => {
          return sum + (fulfillment.line_items?.reduce((itemSum: number, item: any) => itemSum + (item.quantity || 0), 0) || 0);
        }, 0);
        
        if (fulfilledQuantity === 0) {
          fulfillmentStatus = 'unfulfilled';
        } else if (fulfilledQuantity >= totalQuantity) {
          fulfillmentStatus = 'fulfilled';
        } else {
          fulfillmentStatus = 'partial';
        }
      }

      return {
        id: order.id,
        orderNumber: order.order_number || order.number,
        totalPrice: order.total_price || '0',
        subtotalPrice: order.subtotal_price || '0',
        totalTax: order.total_tax || '0',
        currency: order.currency || 'USD',
        financialStatus: order.financial_status || 'pending',
        fulfillmentStatus,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
      };
    });
  } catch (error: any) {
    if (error.response) {
      const status = error.response.status;
      if (status === 401 || status === 403) {
        throw new Error('Invalid access token or unauthorized');
      }
      if (status === 404) {
        throw new Error('Store not found');
      }
      if (status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      throw new Error(`Shopify API error (${status}): ${error.response.data?.errors || error.message}`);
    }
    throw new Error(`Failed to fetch orders: ${error.message}`);
  }
}



