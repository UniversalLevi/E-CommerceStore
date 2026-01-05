import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { config } from '../config/env';

/**
 * Parsed product data from WhatsApp message
 */
export interface ParsedProductData {
  productName: string;
  costPrice: number;
}

/**
 * WhatsApp message structure from Meta Cloud API
 */
export interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: 'text' | 'image';
  text?: {
    body: string;
  };
  image?: {
    id: string;
    mime_type: string;
    sha256: string;
    caption?: string;
  };
}

/**
 * WhatsApp webhook payload structure
 */
export interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: { name: string };
          wa_id: string;
        }>;
        messages?: WhatsAppMessage[];
      };
      field: string;
    }>;
  }>;
}

/**
 * Combined product intake data
 */
export interface ProductIntakeData {
  messageId: string;
  imageUrl: string;
  productName: string;
  costPrice: number;
}

/**
 * Check if WhatsApp feature is enabled
 */
export function isWhatsAppEnabled(): boolean {
  return config.whatsapp.enabled;
}

/**
 * Parse product text message to extract name and cost price
 * First tries structured format, then falls back to AI extraction for natural language
 */
export async function parseProductText(text: string): Promise<ParsedProductData | null> {
  // First, try structured format (fast path)
  const structuredResult = parseStructuredFormat(text);
  if (structuredResult) {
    return structuredResult;
  }

  // If structured format fails, try AI extraction
  return await parseWithAI(text);
}

/**
 * Parse structured format: "Product Name: ..." and "Cost Price: ..."
 */
function parseStructuredFormat(text: string): ParsedProductData | null {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  
  let productName: string | null = null;
  let costPrice: number | null = null;

  for (const line of lines) {
    // Match "Product Name: <value>" (case insensitive)
    const nameMatch = line.match(/^product\s*name\s*:\s*(.+)$/i);
    if (nameMatch) {
      productName = nameMatch[1].trim();
      continue;
    }

    // Match "Cost Price: <value>" (case insensitive, handle currency symbols)
    const priceMatch = line.match(/^cost\s*price\s*:\s*[₹$Rs.]?\s*([\d,.]+)$/i);
    if (priceMatch) {
      // Remove commas and parse
      const priceStr = priceMatch[1].replace(/,/g, '');
      costPrice = parseFloat(priceStr);
      continue;
    }
  }

  if (!productName || productName.length === 0) {
    return null;
  }

  if (costPrice === null || isNaN(costPrice) || costPrice < 0) {
    return null;
  }

  return { productName, costPrice };
}

/**
 * Use AI to extract product name and cost price from natural language
 */
async function parseWithAI(text: string): Promise<ParsedProductData | null> {
  // Try simple regex patterns first (faster, no API call)
  const simpleResult = parseSimplePatterns(text);
  if (simpleResult) {
    return simpleResult;
  }

  // If simple patterns fail and OpenAI is available, use AI
  if (!process.env.OPENAI_API_KEY) {
    console.warn('[WhatsApp Intake] OpenAI not available, cannot parse unstructured text');
    return null;
  }

  try {
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a product information extractor. Extract the product name and cost price from the user's message. 
Return ONLY a valid JSON object with this exact format:
{"productName": "extracted product name", "costPrice": number}

Rules:
- Extract the product name even if it's mentioned casually (e.g., "wireless headphones", "bluetooth speaker")
- Extract the cost price in any currency (convert to number, ignore currency symbols)
- If price is not found, use null for costPrice
- If product name cannot be determined, return null for productName
- Be lenient - extract any product description as the name if no clear name exists`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return null;
    }

    const parsed = JSON.parse(content);
    const productName = parsed.productName?.trim();
    const costPrice = parsed.costPrice;

    if (!productName || productName === 'null' || productName.length === 0) {
      return null;
    }

    if (costPrice === null || costPrice === undefined || isNaN(costPrice) || costPrice < 0) {
      return null;
    }

    return {
      productName,
      costPrice: parseFloat(costPrice),
    };
  } catch (error: any) {
    console.error('[WhatsApp Intake] AI parsing failed:', error.message);
    return null;
  }
}

/**
 * Try simple regex patterns to extract product info without AI
 */
function parseSimplePatterns(text: string): ParsedProductData | null {
  // Patterns to match common formats:
  // "Product: name, Price: 500"
  // "name - 500"
  // "name ₹500"
  // "name Rs 500"
  // "name $50"
  
  let productName: string | null = null;
  let costPrice: number | null = null;

  // Pattern 1: "Product: <name>, Price: <amount>" or "Product: <name> Price: <amount>"
  const pattern1 = /(?:product|item|name)\s*:?\s*([^,\n]+?)(?:\s*,\s*|\s+)(?:price|cost|amount)\s*:?\s*[₹$Rs.]?\s*([\d,.]+)/i;
  const match1 = text.match(pattern1);
  if (match1) {
    productName = match1[1].trim();
    costPrice = parseFloat(match1[2].replace(/,/g, ''));
    if (productName && costPrice && !isNaN(costPrice) && costPrice > 0) {
      return { productName, costPrice };
    }
  }

  // Pattern 2: "<name> - <price>" or "<name> ₹<price>" or "<name> Rs <price>"
  const pattern2 = /^(.+?)\s*[-–—]\s*[₹$Rs.]?\s*([\d,.]+)$/i;
  const match2 = text.match(pattern2);
  if (match2) {
    productName = match2[1].trim();
    costPrice = parseFloat(match2[2].replace(/,/g, ''));
    if (productName && costPrice && !isNaN(costPrice) && costPrice > 0) {
      return { productName, costPrice };
    }
  }

  // Pattern 3: Find price anywhere and product name before it
  const pricePattern = /[₹$Rs.]?\s*([\d,.]+)\s*(?:rupees?|rs|inr|usd|dollars?)?/i;
  const priceMatch = text.match(pricePattern);
  if (priceMatch) {
    costPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
    if (costPrice && !isNaN(costPrice) && costPrice > 0) {
      // Try to find product name before the price
      const beforePrice = text.substring(0, priceMatch.index || 0).trim();
      // Remove common words and extract meaningful product name
      const cleaned = beforePrice
        .replace(/^(this|is|a|an|the|product|item)\s+/i, '')
        .replace(/\s+(cost|price|is|for|at)\s*$/i, '')
        .trim();
      
      if (cleaned.length > 3) {
        productName = cleaned;
        return { productName, costPrice };
      }
    }
  }

  return null;
}

/**
 * Download media from WhatsApp using Media ID
 * In test mode (when access token is missing or media ID starts with 'test_'), uses placeholder
 */
export async function downloadWhatsAppMedia(mediaId: string): Promise<string> {
  // Test mode: Use placeholder image if media ID contains 'test' or no access token
  const isTestMode = mediaId.toLowerCase().includes('test') || !config.whatsapp.accessToken;
  
  if (isTestMode) {
    console.log(`[WhatsApp Intake] Test mode: Using placeholder image for media ID: ${mediaId}`);
    
    // Use a realistic placeholder service for test images
    // Using picsum.photos for random realistic product-like images
    const placeholderUrl = `https://picsum.photos/800/800?random=${Date.now()}`;
    
    // Download the placeholder image
    try {
      const response = await axios.get(placeholderUrl, {
        responseType: 'arraybuffer',
        timeout: 10000, // 10 second timeout
      });

      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'whatsapp');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filename = `wa-test-${Date.now()}.jpg`;
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, response.data);

      return `/uploads/whatsapp/${filename}`;
    } catch (error: any) {
      console.warn(`[WhatsApp Intake] Failed to download placeholder from picsum, trying alternative: ${error.message}`);
      
      // Try alternative placeholder service
      try {
        const altResponse = await axios.get(`https://via.placeholder.com/800x800/E2E8F0/64748B.png?text=Product+Image`, {
          responseType: 'arraybuffer',
          timeout: 5000,
        });

        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'whatsapp');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const filename = `wa-test-${Date.now()}.png`;
        const filePath = path.join(uploadsDir, filename);
        fs.writeFileSync(filePath, altResponse.data);

        return `/uploads/whatsapp/${filename}`;
      } catch (altError: any) {
        console.warn(`[WhatsApp Intake] All placeholder services failed, using minimal placeholder`);
        
        // Final fallback: minimal placeholder
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'whatsapp');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Use a larger base64 encoded gray image (100x100, but will be scaled)
        const placeholderPng = Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          'base64'
        );

        const filename = `wa-test-${Date.now()}.png`;
        const filePath = path.join(uploadsDir, filename);
        fs.writeFileSync(filePath, placeholderPng);

        return `/uploads/whatsapp/${filename}`;
      }
    }
  }

  if (!config.whatsapp.accessToken) {
    throw new Error('WhatsApp access token not configured');
  }

  try {
    // Step 1: Get media URL from Meta API
    const mediaInfoUrl = `https://graph.facebook.com/v18.0/${mediaId}`;
    const mediaInfoResponse = await axios.get(mediaInfoUrl, {
      headers: {
        Authorization: `Bearer ${config.whatsapp.accessToken}`,
      },
    });

    const mediaUrl = mediaInfoResponse.data.url;
    if (!mediaUrl) {
      throw new Error('Failed to get media URL from WhatsApp');
    }

    // Step 2: Download the media file
    const mediaResponse = await axios.get(mediaUrl, {
      headers: {
        Authorization: `Bearer ${config.whatsapp.accessToken}`,
      },
      responseType: 'arraybuffer',
    });

    // Step 3: Save to local uploads directory
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'whatsapp');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `wa-${mediaId}-${Date.now()}.jpg`;
    const filePath = path.join(uploadsDir, filename);
    
    fs.writeFileSync(filePath, mediaResponse.data);

    // Return the public URL path
    return `/uploads/whatsapp/${filename}`;
  } catch (error: any) {
    // If download fails and it's not a test, throw the error
    // Otherwise, fall back to placeholder
    if (error.response?.status === 400 || error.response?.status === 404) {
      console.warn(`[WhatsApp Intake] Failed to download media ${mediaId}, using placeholder: ${error.message}`);
      return downloadWhatsAppMedia(`test_${mediaId}`); // Recursively call with test prefix
    }
    throw error;
  }
}

/**
 * Validate incoming WhatsApp message has required fields
 */
export function validateMessagePayload(message: WhatsAppMessage): {
  valid: boolean;
  error?: string;
} {
  if (!message.id) {
    return { valid: false, error: 'Missing message ID' };
  }

  if (message.type !== 'image' && message.type !== 'text') {
    return { valid: false, error: 'Unsupported message type' };
  }

  if (message.type === 'image') {
    if (!message.image?.id) {
      return { valid: false, error: 'Image message missing media ID' };
    }
  }

  if (message.type === 'text') {
    if (!message.text?.body) {
      return { valid: false, error: 'Text message missing body' };
    }
  }

  return { valid: true };
}

/**
 * Extract messages from webhook payload
 */
export function extractMessages(payload: WhatsAppWebhookPayload): WhatsAppMessage[] {
  const messages: WhatsAppMessage[] = [];

  if (payload.object !== 'whatsapp_business_account') {
    return messages;
  }

  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      if (change.field === 'messages' && change.value.messages) {
        messages.push(...change.value.messages);
      }
    }
  }

  return messages;
}

/**
 * Generate a random profit margin between 400-500 INR
 */
export function generateProfitMargin(): number {
  return Math.floor(Math.random() * 101) + 400; // 400-500
}

/**
 * Calculate final price from components
 */
export function calculateFinalPrice(costPrice: number, profitMargin: number, shippingFee: number = 80): number {
  return costPrice + profitMargin + shippingFee;
}

/**
 * Build absolute URL for uploaded images
 */
export function buildImageUrl(relativePath: string, baseUrl: string): string {
  if (relativePath.startsWith('http')) {
    return relativePath;
  }
  
  // Remove leading slash if present
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  
  return `${cleanBase}/${cleanPath}`;
}

