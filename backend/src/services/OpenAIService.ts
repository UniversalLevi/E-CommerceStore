import OpenAI from 'openai';
import { config } from '../config/env';
import { IProduct } from '../models/Product';
import { INiche } from '../models/Niche';
import { UserPreferences } from './ProductScoringService';
import crypto from 'crypto';

interface CacheEntry {
  data: any;
  expiresAt: number;
}

// In-memory cache (cleared on deployment)
const aiCache = new Map<string, CacheEntry>();
const CACHE_TTL = parseInt(process.env.AI_CACHE_TTL || '3600', 10) * 1000; // Default 1 hour in ms

// Initialize OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured. AI features will use fallback responses.');
    return null;
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return openaiClient;
}

/**
 * Sanitize LLM output to remove unsafe content
 */
function sanitizeLLMOutput(text: string): string {
  if (!text) return '';

  return text
    // Remove script tags
    .replace(/<script.*?>.*?<\/script>/gi, '')
    // Remove HTML tags
    .replace(/<[^>]+>/g, '')
    // Remove exaggerated claims
    .replace(/\b(100%|guaranteed|FDA-approved|cure|heal|magic|viral|guaranteed to go viral)\b/gi, '')
    // Remove medical/health claims
    .replace(/\b(FDA|cure|heal|treat|medical|prescription|diagnosis)\b/gi, '')
    // Remove unverifiable claims
    .replace(/\b(100% waterproof|100% safe|proven|scientifically proven)\b/gi, '')
    // Trim whitespace
    .trim();
}

/**
 * Hash product ID for logging (don't log full product data)
 */
function hashProductId(productId: string): string {
  return crypto.createHash('sha256').update(productId).digest('hex').substring(0, 16);
}

/**
 * Get cache key for rationale
 */
function getRationaleCacheKey(productId: string, nicheId?: string): string {
  return `rationale:${productId}:${nicheId || 'none'}`;
}

/**
 * Get cache key for description
 */
function getDescriptionCacheKey(productId: string, tone: string, length: string): string {
  return `description:${productId}:${tone}:${length}`;
}

/**
 * Check and get from cache
 */
function getFromCache(key: string): any | null {
  const entry = aiCache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    aiCache.delete(key);
    return null;
  }

  return entry.data;
}

/**
 * Set cache entry
 */
function setCache(key: string, data: any): void {
  aiCache.set(key, {
    data,
    expiresAt: Date.now() + CACHE_TTL,
  });
}

/**
 * Generate product rationale using OpenAI
 */
export async function generateProductRationale(
  product: IProduct,
  userPref: UserPreferences,
  score: number,
  niche?: INiche | null
): Promise<string[]> {
  const startTime = Date.now();
  const productIdHash = hashProductId((product._id as any).toString());
  const cacheKey = getRationaleCacheKey((product._id as any).toString(), userPref.nicheId?.toString());

  // Check cache first
  const cached = getFromCache(cacheKey);
  if (cached) {
    console.log(`[AI Cache Hit] Rationale for product ${productIdHash}`);
    return cached;
  }

  const client = getOpenAIClient();
  if (!client) {
    // Fallback rationale
    const fallback = [
      `Good fit for ${niche?.name || 'your niche'} with a score of ${score}/100.`,
      `Price point of ₹${product.price} is beginner-friendly.`,
      score > 70 ? 'High quality product with good potential.' : 'Decent product to start with.',
    ];
    setCache(cacheKey, fallback);
    return fallback;
  }

  try {
    const systemPrompt = `You are an assistant helping beginner ecommerce store owners pick a single best product from a catalog. 
The user has selected a niche and a goal. Use these inputs and the product attributes to explain why this product was chosen.

Rules:
- Output only 2-3 factual bullet points
- No marketing fluff or exaggerated claims
- No HTML formatting
- Mention margin is estimated if costPrice is missing
- Be concise and factual
- No invented specifications`;

    const userPrompt = `User goal: ${userPref.goal || 'not specified'}
Niche: ${niche?.name || 'not specified'}
Product: ${product.title}
Price: ₹${product.price}
Cost Price: ${product.costPrice ? `₹${product.costPrice}` : 'Not provided (estimated margin 45%)'}
Images: ${product.images?.length || 0}
Tags: ${product.tags?.join(', ') || 'none'}
Score: ${score}/100

Explain in 2-3 bullets why this product is recommended for a beginner.`;

    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content || '';
    const latency = Date.now() - startTime;

    // Log request (hashed, no full product data)
    console.log(`[AI Request] Rationale for product ${productIdHash}, model: ${process.env.OPENAI_MODEL || 'gpt-3.5-turbo'}, latency: ${latency}ms`);

    // Parse bullets from response
    const bullets = content
      .split('\n')
      .filter((line: string) => line.trim().startsWith('-') || line.trim().startsWith('•'))
      .map((line: string) => sanitizeLLMOutput(line.replace(/^[-•]\s*/, '')))
      .filter((line: string) => line.length > 0);

    // Fallback if parsing failed
    const rationale = bullets.length > 0 ? bullets : [
      `Good fit for ${niche?.name || 'your niche'} with a score of ${score}/100.`,
      `Price point of ₹${product.price} is beginner-friendly.`,
    ];

    setCache(cacheKey, rationale);
    return rationale;
  } catch (error: any) {
    console.error(`[AI Error] Failed to generate rationale for product ${productIdHash}:`, error.message);
    
    // Fallback rationale
    const fallback = [
      `Good fit for ${niche?.name || 'your niche'} with a score of ${score}/100.`,
      `Price point of ₹${product.price} is beginner-friendly.`,
      product.costPrice ? `Estimated margin: ${Math.round(((product.price - product.costPrice) / product.price) * 100)}%` : 'Estimated margin: 45% (cost price not provided)',
    ];
    
    setCache(cacheKey, fallback);
    return fallback;
  }
}

/**
 * Generate product description using OpenAI
 */
export async function generateProductDescription(
  product: IProduct,
  tone: 'persuasive' | 'informative' | 'seo',
  length: 'short' | 'long',
  niche?: INiche | null
): Promise<{
  title: string;
  shortDescription: string;
  longDescription: string;
  bullets: string[];
  seoMeta: { title: string; description: string };
  fallback?: boolean;
}> {
  const startTime = Date.now();
  const productIdHash = hashProductId((product._id as any).toString());
  const cacheKey = getDescriptionCacheKey((product._id as any).toString(), tone, length);

  // Check cache first
  const cached = getFromCache(cacheKey);
  if (cached) {
    console.log(`[AI Cache Hit] Description for product ${productIdHash}`);
    return cached;
  }

  const client = getOpenAIClient();
  if (!client) {
    // Fallback description
    const fallback = {
      title: product.title,
      shortDescription: `A simple, beginner-friendly ${niche?.name || 'product'} product.`,
      longDescription: `This product is ideal for new e-commerce sellers looking to start their store. It offers good value and is easy to list and sell. Perfect for beginners who want to test the market with a reliable product.`,
      bullets: [
        'Beginner-friendly',
        'Easy to list and sell',
        'Affordable price point',
        'Good quality product',
        'Suitable for dropshipping',
      ],
      seoMeta: {
        title: product.title,
        description: `Affordable ${product.title} for ${niche?.name || 'your store'}.`,
      },
      fallback: true,
    };
    setCache(cacheKey, fallback);
    return fallback;
  }

  try {
    const systemPrompt = `You are a product copywriter specialized in ecommerce. Given product data and target audience, produce SEO-friendly product copy.

Rules:
- No unverifiable claims (no "100%", "guaranteed", "FDA-approved" unless specified)
- No compliance or health statements
- No made-up details or invented specifications
- No HTML formatting
- Always output valid JSON
- Keep tone ${tone}
- Length should be ${length === 'short' ? 'concise' : 'detailed (3-4 paragraphs)'}
- Always include final safety note: "Review product specifications before publishing."`;

    const userPrompt = `Product: ${product.title}
Existing Description: ${product.description}
Price: ₹${product.price}
Images: ${product.images?.length || 0}
Tags: ${product.tags?.join(', ') || 'none'}
Supplier Link: ${product.supplierLink || 'Not provided'}
Target audience: Beginner e-commerce store owner
Niche: ${niche?.name || 'General'}
Tone: ${tone}
Length: ${length}

Generate product copy as JSON:
{
  "title": "SEO-friendly product title",
  "shortDescription": "One-line description",
  "longDescription": "3-4 short paragraphs for product page",
  "bullets": ["benefit 1", "benefit 2", "benefit 3", "benefit 4", "benefit 5"],
  "seoMeta": {
    "title": "SEO meta title (60 chars max)",
    "description": "SEO meta description (150 chars max)"
  }
}`;

    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{}';
    const latency = Date.now() - startTime;

    // Log request
    console.log(`[AI Request] Description for product ${productIdHash}, model: ${process.env.OPENAI_MODEL || 'gpt-3.5-turbo'}, latency: ${latency}ms`);

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      console.error(`[AI Error] Failed to parse JSON for product ${productIdHash}`);
      throw new Error('Invalid JSON response from AI');
    }

    // Sanitize all text fields
    const result = {
      title: sanitizeLLMOutput(parsed.title || product.title),
      shortDescription: sanitizeLLMOutput(parsed.shortDescription || 'A useful and affordable product.'),
      longDescription: sanitizeLLMOutput(parsed.longDescription || 'This product is great for beginners looking to start their store.'),
      bullets: (parsed.bullets || []).map((b: string) => sanitizeLLMOutput(b)).slice(0, 5),
      seoMeta: {
        title: sanitizeLLMOutput(parsed.seoMeta?.title || product.title).substring(0, 60),
        description: sanitizeLLMOutput(parsed.seoMeta?.description || `Affordable ${product.title}.`).substring(0, 150),
      },
      fallback: false,
    };

    // Ensure we have 5 bullets
    while (result.bullets.length < 5) {
      result.bullets.push(`Benefit ${result.bullets.length + 1}`);
    }

    setCache(cacheKey, result);
    return result;
  } catch (error: any) {
    console.error(`[AI Error] Failed to generate description for product ${productIdHash}:`, error.message);
    
    // Fallback description
    const fallback = {
      title: product.title,
      shortDescription: `A simple, beginner-friendly ${niche?.name || 'product'} product.`,
      longDescription: `This product is ideal for new e-commerce sellers looking to start their store. It offers good value and is easy to list and sell. Perfect for beginners who want to test the market with a reliable product. Review product specifications before publishing.`,
      bullets: [
        'Beginner-friendly',
        'Easy to list and sell',
        'Affordable price point',
        'Good quality product',
        'Suitable for dropshipping',
      ],
      seoMeta: {
        title: product.title,
        description: `Affordable ${product.title} for ${niche?.name || 'your store'}.`,
      },
      fallback: true,
    };
    
    setCache(cacheKey, fallback);
    return fallback;
  }
}

/**
 * Clear cache (useful for testing or cache invalidation)
 */
export function clearAICache(): void {
  aiCache.clear();
  console.log('[AI Cache] Cleared all cached entries');
}

