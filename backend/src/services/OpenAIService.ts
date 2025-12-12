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
 * Theme customization generated by AI
 */
interface ThemeCustomization {
  colors: {
    text: string;
    background1: string;
    background2: string;
    accent1: string;
    accent2: string;
    buttonText: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
  };
  hero: {
    heading: string;
    subheading: string;
    buttonText: string;
    overlayOpacity: number;
    textAlignment: string;
  };
  featuredProducts: {
    heading: string;
    subheading: string;
    productsToShow: number;
    columns: number;
  };
  collections: {
    heading: string;
    collectionsToShow: number;
    columns: number;
  };
  additionalCSS: string;
}

/**
 * Generate theme customization using AI
 * AI only generates styling and settings, not Liquid structure
 */
async function generateThemeCustomization(prompt: string): Promise<ThemeCustomization> {
  const client = getOpenAIClient();
  
  if (!client) {
    throw new Error('OpenAI API key not configured');
  }

  const systemPrompt = `You are a Shopify theme styling expert. Based on the user's prompt, generate a customization object for a Shopify theme.

You will customize ONLY:
1. Colors (hex values)
2. Typography choices
3. Section headings and button text
4. Layout settings (columns, products to show)
5. Additional custom CSS (optional)

Output a JSON object with this EXACT structure:
{
  "colors": {
    "text": "#1a1a1a",
    "background1": "#ffffff",
    "background2": "#f5f5f5",
    "accent1": "#1a1a1a",
    "accent2": "#4a90d9",
    "buttonText": "#ffffff"
  },
  "typography": {
    "headingFont": "assistant_n4",
    "bodyFont": "assistant_n4"
  },
  "hero": {
    "heading": "Welcome to our store",
    "subheading": "Discover our collection of premium products",
    "buttonText": "Shop Now",
    "overlayOpacity": 30,
    "textAlignment": "center"
  },
  "featuredProducts": {
    "heading": "Featured Products",
    "subheading": "",
    "productsToShow": 8,
    "columns": 4
  },
  "collections": {
    "heading": "Shop by Collection",
    "collectionsToShow": 6,
    "columns": 3
  },
  "additionalCSS": ""
}

Rules:
- Colors must be valid hex colors
- Font choices should be Shopify font picker format (e.g., "assistant_n4", "montserrat_n7", "playfair_display_n4")
- Headings should be creative and match the theme/brand requested
- Additional CSS should only include custom styling that enhances the theme`;

  const userPrompt = `Create a theme customization for: ${prompt}

Make the colors, typography, and text content match the style and mood requested. Be creative with headings and make them compelling for an e-commerce store.`;

  try {
    const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);
    
    // Validate and provide defaults
    return {
      colors: {
        text: parsed.colors?.text || '#1a1a1a',
        background1: parsed.colors?.background1 || '#ffffff',
        background2: parsed.colors?.background2 || '#f5f5f5',
        accent1: parsed.colors?.accent1 || '#1a1a1a',
        accent2: parsed.colors?.accent2 || '#4a90d9',
        buttonText: parsed.colors?.buttonText || '#ffffff',
      },
      typography: {
        headingFont: parsed.typography?.headingFont || 'assistant_n4',
        bodyFont: parsed.typography?.bodyFont || 'assistant_n4',
      },
      hero: {
        heading: parsed.hero?.heading || 'Welcome to our store',
        subheading: parsed.hero?.subheading || 'Discover our collection of premium products',
        buttonText: parsed.hero?.buttonText || 'Shop Now',
        overlayOpacity: parsed.hero?.overlayOpacity || 30,
        textAlignment: parsed.hero?.textAlignment || 'center',
      },
      featuredProducts: {
        heading: parsed.featuredProducts?.heading || 'Featured Products',
        subheading: parsed.featuredProducts?.subheading || '',
        productsToShow: parsed.featuredProducts?.productsToShow || 8,
        columns: parsed.featuredProducts?.columns || 4,
      },
      collections: {
        heading: parsed.collections?.heading || 'Shop by Collection',
        collectionsToShow: parsed.collections?.collectionsToShow || 6,
        columns: parsed.collections?.columns || 3,
      },
      additionalCSS: parsed.additionalCSS || '',
    };
  } catch (error: any) {
    console.error('[AI Customization Error]:', error.message);
    throw new Error(`Failed to generate theme customization: ${error.message}`);
  }
}

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex: string): { red: number; green: number; blue: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    red: parseInt(result[1], 16),
    green: parseInt(result[2], 16),
    blue: parseInt(result[3], 16)
  } : { red: 26, green: 26, blue: 26 };
}

/**
 * Generate complete theme structure using master template + AI customization
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
  const fs = await import('fs');
  const path = await import('path');
  
  const masterTemplatePath = path.join(__dirname, '../../templates/_master');
  
  // Check if master template exists
  if (!fs.existsSync(masterTemplatePath)) {
    throw new Error('Master template not found. Please ensure _master template exists.');
  }

  console.log('[Theme Generation] Loading master template from:', masterTemplatePath);
  
  // Generate AI customization
  console.log('[Theme Generation] Generating AI customization for:', prompt);
  const customization = await generateThemeCustomization(prompt);
  console.log('[Theme Generation] AI customization generated:', JSON.stringify(customization.colors));

  // Helper to read file
  const readFile = (filePath: string): string => {
    const fullPath = path.join(masterTemplatePath, filePath);
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath, 'utf-8');
    }
    return '';
  };

  // Load all master template files
  const layout = {
    path: 'layout/theme.liquid',
    content: readFile('layout/theme.liquid'),
  };

  const sections = [
    { path: 'sections/header.liquid', content: readFile('sections/header.liquid') },
    { path: 'sections/footer.liquid', content: readFile('sections/footer.liquid') },
    { path: 'sections/hero-banner.liquid', content: readFile('sections/hero-banner.liquid') },
    { path: 'sections/featured-products.liquid', content: readFile('sections/featured-products.liquid') },
    { path: 'sections/collection-list.liquid', content: readFile('sections/collection-list.liquid') },
    { path: 'sections/main-product.liquid', content: readFile('sections/main-product.liquid') },
    { path: 'sections/main-collection.liquid', content: readFile('sections/main-collection.liquid') },
  ];

  // Create customized template JSONs with AI settings
  const indexTemplate = {
    sections: {
      hero: {
        type: 'hero-banner',
        settings: {
          heading: customization.hero.heading,
          subheading: customization.hero.subheading,
          button_label: customization.hero.buttonText,
          button_link: '/collections/all',
          height: 70,
          overlay_opacity: customization.hero.overlayOpacity,
          text_alignment: customization.hero.textAlignment,
          text_color: '#ffffff',
        },
      },
      'featured-products': {
        type: 'featured-products',
        settings: {
          heading: customization.featuredProducts.heading,
          subheading: customization.featuredProducts.subheading,
          products_to_show: customization.featuredProducts.productsToShow,
          columns: customization.featuredProducts.columns,
          show_secondary_image: true,
          show_vendor: false,
          content_alignment: 'left',
          show_view_all: true,
          view_all_text: 'View all products',
        },
      },
      'collection-list': {
        type: 'collection-list',
        settings: {
          heading: customization.collections.heading,
          collections_to_show: customization.collections.collectionsToShow,
          columns: customization.collections.columns,
        },
      },
    },
    order: ['hero', 'featured-products', 'collection-list'],
  };

  const templates = [
    { path: 'templates/index.json', content: JSON.stringify(indexTemplate, null, 2) },
    { path: 'templates/product.json', content: readFile('templates/product.json') },
    { path: 'templates/collection.json', content: readFile('templates/collection.json') },
  ];

  // Create customized settings_data.json with AI colors
  const textRgb = hexToRgb(customization.colors.text);
  const bg1Rgb = hexToRgb(customization.colors.background1);
  const bg2Rgb = hexToRgb(customization.colors.background2);
  const accent1Rgb = hexToRgb(customization.colors.accent1);
  const accent2Rgb = hexToRgb(customization.colors.accent2);
  const buttonTextRgb = hexToRgb(customization.colors.buttonText);

  const settingsData = {
    current: {
      colors_text: customization.colors.text,
      colors_background_1: customization.colors.background1,
      colors_background_2: customization.colors.background2,
      colors_accent_1: customization.colors.accent1,
      colors_accent_2: customization.colors.accent2,
      colors_solid_button_labels: customization.colors.buttonText,
      type_header_font: customization.typography.headingFont,
      type_body_font: customization.typography.bodyFont,
      page_width: 1400,
      spacing_sections: 50,
      logo_width: 120,
    },
  };

  // Create customized base.css with additional CSS
  let baseCss = readFile('assets/base.css');
  if (customization.additionalCSS) {
    baseCss += `\n\n/* AI-generated custom styles */\n${customization.additionalCSS}`;
  }

  const assets = [
    { path: 'assets/base.css', content: baseCss },
    { path: 'assets/global.js', content: readFile('assets/global.js') },
  ];

  const config = [
    { path: 'config/settings_schema.json', content: readFile('config/settings_schema.json') },
    { path: 'config/settings_data.json', content: JSON.stringify(settingsData, null, 2) },
  ];

  console.log(`[Theme Generation] Created theme with ${sections.length} sections, ${templates.length} templates, ${assets.length} assets`);

  return {
    layout,
    sections,
    templates,
    assets,
    config,
    pages: [],
  };
}

/**
 * Clear cache (useful for testing or cache invalidation)
 */
export function clearAICache(): void {
  aiCache.clear();
  console.log('[AI Cache] Cleared all cached entries');
}

