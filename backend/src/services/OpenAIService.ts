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
 * Generate template code using OpenAI
 */
export async function generateTemplateCode(
  prompt: string,
  codeType: 'liquid' | 'json' | 'css' | 'js',
  context?: {
    templateName?: string;
    existingCode?: string;
    filePath?: string;
  }
): Promise<string> {
  const startTime = Date.now();
  const client = getOpenAIClient();
  
  if (!client) {
    // Fallback code based on type
    return getFallbackCode(codeType, prompt);
  }

  try {
    const systemPrompt = getSystemPromptForCodeType(codeType);
    const userPrompt = buildUserPrompt(prompt, codeType, context);

    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: codeType === 'json' ? 2000 : 4000,
    });

    const content = response.choices[0]?.message?.content || '';
    const latency = Date.now() - startTime;

    console.log(`[AI Request] Template code generation (${codeType}), latency: ${latency}ms`);

    // Clean up the response
    let cleanedCode = content.trim();
    
    // Remove markdown code blocks if present
    cleanedCode = cleanedCode.replace(/^```[\w]*\n?/gm, '').replace(/\n?```$/gm, '');
    
    // For JSON, try to parse and reformat
    if (codeType === 'json') {
      try {
        const parsed = JSON.parse(cleanedCode);
        cleanedCode = JSON.stringify(parsed, null, 2);
      } catch {
        // If parsing fails, return as-is
      }
    }

    return cleanedCode;
  } catch (error: any) {
    console.error(`[AI Error] Failed to generate template code:`, error.message);
    return getFallbackCode(codeType, prompt);
  }
}

/**
 * Get system prompt based on code type
 */
function getSystemPromptForCodeType(codeType: 'liquid' | 'json' | 'css' | 'js'): string {
  const basePrompt = `You are an expert Shopify theme developer. Generate clean, production-ready code following best practices.`;

  switch (codeType) {
    case 'liquid':
      return `${basePrompt}
- Generate Shopify Liquid template code
- Include proper schema blocks for theme editor customization
- Use Shopify Liquid filters and objects correctly
- Include proper comments
- Ensure mobile responsiveness
- Follow Shopify theme development best practices
- Output ONLY the code, no explanations or markdown`;
    
    case 'json':
      return `${basePrompt}
- Generate valid JSON for Shopify theme templates
- Follow Shopify theme JSON structure
- Include proper section configurations
- Use correct Shopify schema format
- Output ONLY valid JSON, no markdown or explanations`;
    
    case 'css':
      return `${basePrompt}
- Generate modern, clean CSS
- Use CSS variables for theming
- Ensure mobile responsiveness with media queries
- Follow BEM naming conventions
- Include smooth transitions and animations
- Output ONLY CSS code, no markdown or explanations`;
    
    case 'js':
      return `${basePrompt}
- Generate vanilla JavaScript (no frameworks)
- Include proper error handling
- Use modern ES6+ syntax
- Add JSDoc comments for functions
- Ensure browser compatibility
- Output ONLY JavaScript code, no markdown or explanations`;
    
    default:
      return basePrompt;
  }
}

/**
 * Build user prompt with context
 */
function buildUserPrompt(
  prompt: string,
  codeType: 'liquid' | 'json' | 'css' | 'js',
  context?: {
    templateName?: string;
    existingCode?: string;
    filePath?: string;
  }
): string {
  let userPrompt = `Generate ${codeType.toUpperCase()} code for: ${prompt}`;

  if (context?.templateName) {
    userPrompt += `\n\nTemplate name: ${context.templateName}`;
  }

  if (context?.filePath) {
    userPrompt += `\n\nFile path: ${context.filePath}`;
    
    // Add context based on file path
    if (context.filePath.includes('sections/')) {
      userPrompt += `\n\nThis is a Shopify section file. Sections are reusable components that can be added to templates through the theme editor. Include a schema block with customizable settings.`;
    } else if (context.filePath.includes('templates/')) {
      userPrompt += `\n\nThis is a Shopify template file. Templates define the structure of specific pages (product, collection, cart, etc.). Use {% layout 'theme' %} and include appropriate sections.`;
    } else if (context.filePath.includes('layout/')) {
      userPrompt += `\n\nThis is a Shopify layout file. Layouts wrap around templates and include the HTML structure, head section, header, footer, and scripts. Include proper Shopify Liquid tags and theme settings.`;
    } else if (context.filePath.includes('assets/')) {
      if (context.filePath.endsWith('.css')) {
        userPrompt += `\n\nThis is a CSS file for a Shopify theme. Use CSS variables for theming, ensure mobile responsiveness, and follow Shopify theme conventions.`;
      } else if (context.filePath.endsWith('.js')) {
        userPrompt += `\n\nThis is a JavaScript file for a Shopify theme. Use vanilla JavaScript (no frameworks), ensure browser compatibility, and handle Shopify-specific functionality like cart updates.`;
      }
    } else if (context.filePath.includes('config/')) {
      userPrompt += `\n\nThis is a Shopify theme config file. Include settings_schema.json for theme customization options or settings_data.json for default settings.`;
    }
  }

  if (context?.existingCode && context.existingCode.trim().length > 0) {
    userPrompt += `\n\nExisting code to modify or extend:\n\`\`\`\n${context.existingCode.substring(0, 2000)}\n\`\`\``;
    userPrompt += `\n\nUse the existing code structure and patterns as a reference. Maintain consistency with the existing code style and conventions.`;
  } else if (context?.filePath) {
    // If no existing code but we have file path, provide guidance
    if (context.filePath.includes('sections/')) {
      userPrompt += `\n\nCreate a complete section with proper schema block. Include settings for customization in the theme editor.`;
    }
  }

  return userPrompt;
}

/**
 * Get fallback code when AI is unavailable
 */
function getFallbackCode(codeType: 'liquid' | 'json' | 'css' | 'js', prompt: string): string {
  switch (codeType) {
    case 'liquid':
      return `{% comment %}
  ${prompt}
{% endcomment %}

<section class="custom-section">
  <div class="container">
    <!-- Your content here -->
  </div>
</section>

{% schema %}
{
  "name": "Custom Section",
  "settings": []
}
{% endschema %}`;
    
    case 'json':
      return JSON.stringify({
        sections: {},
        order: []
      }, null, 2);
    
    case 'css':
      return `/* ${prompt} */
.custom-section {
  /* Add your styles here */
}`;
    
    case 'js':
      return `// ${prompt}
(function() {
  'use strict';
  // Your JavaScript code here
})();`;
    
    default:
      return `// ${prompt}`;
  }
}

/**
 * Generate complete theme structure with AI
 */
export async function generateCompleteTheme(
  prompt: string,
  templateName: string
): Promise<{
  layout: { path: string; content: string };
  sections: Array<{ path: string; content: string }>;
  templates: Array<{ path: string; content: string }>;
  assets: Array<{ path: string; content: string }>;
  config: Array<{ path: string; content: string }>;
  pages: Array<{ path: string; content: string }>;
}> {
  const client = getOpenAIClient();
  
  if (!client) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const systemPrompt = `You are an expert Shopify theme developer. Generate a complete Shopify theme.

Required files:
1. layout/theme.liquid - Main layout with HTML, head, header, footer
2. sections/header.liquid - Header with logo, nav, cart
3. sections/footer.liquid - Footer with links
4. sections/main-hero.liquid - Hero section
5. sections/main-product.liquid - Product section
6. sections/main-collection.liquid - Collection section
7. templates/index.json - Homepage template
8. templates/product.json - Product template
9. templates/collection.json - Collection template
10. assets/base.css - Responsive CSS
11. assets/theme.js - Cart/interaction JS
12. config/settings_schema.json - Theme settings
13. config/settings_data.json - Default settings
14. pages/home.json - Homepage content

Rules: Complete functional code. Shopify Liquid syntax. Schema blocks in sections. Responsive CSS. Valid JSON.

Output JSON format:
{
  "layout": {"path": "layout/theme.liquid", "content": "..."},
  "sections": [{"path": "sections/header.liquid", "content": "..."}, ...],
  "templates": [{"path": "templates/index.json", "content": "..."}, ...],
  "assets": [{"path": "assets/base.css", "content": "..."}, ...],
  "config": [{"path": "config/settings_schema.json", "content": "..."}, ...],
  "pages": [{"path": "pages/home.json", "content": "..."}]
}`;

    const userPrompt = `Generate complete Shopify theme: ${prompt}
Template: ${templateName}
Features: Responsive, modern UI, cart, products, navigation, footer.`;

    // Use gpt-4 if available, otherwise use gpt-3.5-turbo with lower max_tokens
    const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    const maxTokens = model.includes('gpt-4') ? 8000 : 4000;
    
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{}';
    
    if (!content || content.trim() === '{}') {
      throw new Error('AI returned empty response. Please try again with a more detailed prompt.');
    }
    
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch (parseError: any) {
      console.error('[AI Error] Failed to parse JSON response:', parseError.message);
      console.error('[AI Error] Response content:', content.substring(0, 500));
      throw new Error('AI returned invalid JSON. Please try again.');
    }

    // Validate that we have at least some content
    const hasContent = 
      (parsed.layout && parsed.layout.content) ||
      (parsed.sections && parsed.sections.length > 0) ||
      (parsed.templates && parsed.templates.length > 0) ||
      (parsed.assets && parsed.assets.length > 0);

    if (!hasContent) {
      throw new Error('AI response did not contain any theme files. Please try again with a more detailed prompt.');
    }

    // Validate and structure the response
    const result = {
      layout: parsed.layout || { path: 'layout/theme.liquid', content: '' },
      sections: Array.isArray(parsed.sections) ? parsed.sections : [],
      templates: Array.isArray(parsed.templates) ? parsed.templates : [],
      assets: Array.isArray(parsed.assets) ? parsed.assets : [],
      config: Array.isArray(parsed.config) ? parsed.config : [],
      pages: Array.isArray(parsed.pages) ? parsed.pages : [],
    };

    console.log(`[AI Theme Generation] Generated ${result.sections.length} sections, ${result.templates.length} templates, ${result.assets.length} assets`);

    return result;
  } catch (error: any) {
    console.error(`[AI Error] Failed to generate complete theme:`, error.message);
    if (error.message.includes('max_tokens')) {
      throw new Error('Response too long. Please use a more concise prompt or upgrade to GPT-4.');
    }
    throw new Error(`Failed to generate theme: ${error.message}`);
  }
}

/**
 * Clear cache (useful for testing or cache invalidation)
 */
export function clearAICache(): void {
  aiCache.clear();
  console.log('[AI Cache] Cleared all cached entries');
}

