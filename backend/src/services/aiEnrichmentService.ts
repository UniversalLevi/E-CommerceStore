import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { Niche } from '../models/Niche';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('[AI Enrichment] OpenAI API key not configured');
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
 * Result from AI enrichment process
 */
export interface EnrichmentResult {
  ai_name: string;
  ai_description: string;
  generated_image_urls: string[];
  detected_niche_id: string | null;
  errors: string[];
  needs_review: boolean;
}

/**
 * Create a flipped/manipulated version of the original product image
 * Only uses the original WhatsApp image - no AI generation
 * @param originalImageUrl - URL or path to the original product image (relative to public folder)
 * @param productName - Product name for context (not used, kept for compatibility)
 * @returns Array with one manipulated image URL
 */
export async function generateImageVariations(
  originalImageUrl: string,
  productName: string
): Promise<{ urls: string[]; errors: string[] }> {
  const errors: string[] = [];
  const generatedUrls: string[] = [];

  try {
    // Resolve the original image path (originalImageUrl is relative like /uploads/whatsapp/wa-123.jpg)
    const publicDir = path.join(process.cwd(), 'public');
    const originalImagePath = path.join(publicDir, originalImageUrl.replace(/^\//, ''));

    if (!fs.existsSync(originalImagePath)) {
      errors.push(`Original image not found: ${originalImagePath}`);
      return { urls: [], errors };
    }

    // Create output directory for manipulated images
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'whatsapp');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Create flipped version (horizontal flip)
    const timestamp = Date.now();
    const filename = `wa-flipped-${timestamp}.jpg`;
    const flippedPath = path.join(uploadsDir, filename);

    console.log(`[AI Enrichment] Creating flipped version for: ${productName}`);

    // Determine if we should flip horizontally or vertically based on image dimensions
    const metadata = await sharp(originalImagePath).metadata();
    const shouldFlipHorizontally = (metadata.width || 0) >= (metadata.height || 0);

    if (shouldFlipHorizontally) {
      // Horizontal flip (flop) for landscape images
      await sharp(originalImagePath)
        .flop()
        .jpeg({ quality: 95 })
        .toFile(flippedPath);
    } else {
      // Vertical flip (flip) for portrait images
      await sharp(originalImagePath)
        .flip()
        .jpeg({ quality: 95 })
        .toFile(flippedPath);
    }

    generatedUrls.push(`/uploads/whatsapp/${filename}`);
    console.log(`[AI Enrichment] Created flipped version: ${filename}`);

  } catch (error: any) {
    const errorMsg = `Image manipulation failed: ${error.message}`;
    console.error(`[AI Enrichment] ${errorMsg}`);
    errors.push(errorMsg);
  }

  return { urls: generatedUrls, errors };
}

/**
 * Generate an SEO-optimized product name
 */
export async function generateOptimizedName(originalName: string): Promise<{
  name: string;
  error?: string;
}> {
  const client = getOpenAIClient();

  if (!client) {
    return { name: originalName, error: 'OpenAI client not available' };
  }

  try {
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an e-commerce SEO expert. Rewrite product names to be:
- Short and concise (3-6 words maximum)
- Professional and SEO-friendly
- Clear and descriptive
- Free of brand violations or trademarks
- Appealing to Indian dropshipping customers
- Without emojis or special characters
Keep it brief - avoid long descriptive phrases. Return ONLY the optimized product name, nothing else.`,
        },
        {
          role: 'user',
          content: `Optimize this product name for e-commerce: "${originalName}"`,
        },
      ],
      temperature: 0.7,
      max_tokens: 100,
    });

    const optimizedName = response.choices[0]?.message?.content?.trim();
    return { name: optimizedName || originalName };
  } catch (error: any) {
    console.error('[AI Enrichment] Name optimization failed:', error.message);
    return { name: originalName, error: error.message };
  }
}

/**
 * Generate a product description
 */
export async function generateProductDescription(
  productName: string,
  nicheName?: string
): Promise<{ description: string; error?: string }> {
  const client = getOpenAIClient();

  if (!client) {
    return {
      description: `High-quality ${productName}. Perfect for your needs. Order now and enjoy fast shipping across India.`,
      error: 'OpenAI client not available',
    };
  }

  try {
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an e-commerce copywriter. Write product descriptions that are:
- Persuasive and clean
- E-commerce ready for Indian market
- Include a short intro (1-2 sentences)
- Include 4-5 bullet-point features/benefits
- Include a brief usage/benefits section
- NO emojis
- NO false claims or exaggerated statements
- Professional tone

Format:
<intro paragraph>

Features:
• Feature 1
• Feature 2
• Feature 3
• Feature 4

<usage/benefits paragraph>`,
        },
        {
          role: 'user',
          content: `Write a product description for: "${productName}"${nicheName ? ` in the ${nicheName} category` : ''}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const description = response.choices[0]?.message?.content?.trim();
    return { description: description || `High-quality ${productName}. Order now!` };
  } catch (error: any) {
    console.error('[AI Enrichment] Description generation failed:', error.message);
    return {
      description: `High-quality ${productName}. Perfect for your needs. Order now and enjoy fast shipping across India.`,
      error: error.message,
    };
  }
}

/**
 * Detect the most appropriate niche for a product
 */
export async function detectNiche(productName: string): Promise<{
  nicheId: string | null;
  nicheName: string | null;
  error?: string;
}> {
  const client = getOpenAIClient();

  // Get all active niches from database
  const niches = await Niche.find({ active: true, deleted: false }).lean();
  
  // Find or create Uncategorized niche
  let uncategorizedNiche = niches.find((n: any) => n.isDefault);
  
  if (!uncategorizedNiche) {
    // Create Uncategorized niche if it doesn't exist
    try {
      const newNiche = await Niche.create({
        name: 'Uncategorized',
        slug: 'uncategorized',
        description: 'Products that have not been assigned to a specific niche',
        isDefault: true,
        active: true,
        order: 0,
        priority: 0,
        featured: false,
        showOnHomePage: false,
        defaultSortMode: 'newest',
      });
      uncategorizedNiche = newNiche.toObject() as any;
      console.log('[AI Enrichment] Created Uncategorized niche');
    } catch (error: any) {
      console.error('[AI Enrichment] Failed to create Uncategorized niche:', error.message);
      // If creation fails and no niches exist, return error
      if (niches.length === 0) {
        return { nicheId: null, nicheName: null, error: 'No niches available and could not create Uncategorized' };
      }
      // Otherwise use first niche as temporary fallback
      uncategorizedNiche = niches[0];
    }
  }

  // Ensure we have uncategorizedNiche at this point
  if (!uncategorizedNiche) {
    return { nicheId: null, nicheName: null, error: 'Could not find or create Uncategorized niche' };
  }

  if (!client) {
    // Return Uncategorized if OpenAI not available
    return {
      nicheId: uncategorizedNiche._id.toString(),
      nicheName: uncategorizedNiche.name,
      error: 'OpenAI client not available, using Uncategorized',
    };
  }

  const nicheList = niches.map((n: any) => `- ${n.name}: ${n.description || 'General category'}`).join('\n');

  try {
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a product categorization expert. Given a product name, determine which niche/category it belongs to.

Available niches:
${nicheList}

Respond with ONLY the exact niche name from the list above. If uncertain or no good match, respond with "Uncategorized".`,
        },
        {
          role: 'user',
          content: `Which niche does this product belong to: "${productName}"`,
        },
      ],
      temperature: 0.3,
      max_tokens: 50,
    });

    const detectedNicheName = response.choices[0]?.message?.content?.trim();
    
    // Find matching niche (case-insensitive)
    const matchedNiche = niches.find(
      (n) => n.name.toLowerCase() === detectedNicheName?.toLowerCase()
    );

    if (matchedNiche) {
      return {
        nicheId: matchedNiche._id.toString(),
        nicheName: matchedNiche.name,
      };
    }

    // Always fallback to Uncategorized if no match
    return {
      nicheId: uncategorizedNiche._id.toString(),
      nicheName: uncategorizedNiche.name,
      error: `Could not match niche "${detectedNicheName}", using Uncategorized`,
    };
  } catch (error: any) {
    console.error('[AI Enrichment] Niche detection failed:', error.message);
    // Always return Uncategorized on error
    return {
      nicheId: uncategorizedNiche._id.toString(),
      nicheName: uncategorizedNiche.name,
      error: error.message,
    };
  }
}

/**
 * Run full AI enrichment pipeline for a product
 */
export async function enrichProduct(
  originalName: string,
  originalImageUrl: string
): Promise<EnrichmentResult> {
  const errors: string[] = [];
  let needsReview = false;

  console.log(`[AI Enrichment] Starting enrichment for: ${originalName}`);

  // Run enrichment tasks in parallel where possible
  const [nameResult, nicheResult, imageResult] = await Promise.all([
    generateOptimizedName(originalName),
    detectNiche(originalName),
    generateImageVariations(originalImageUrl, originalName),
  ]);

  // Collect errors
  if (nameResult.error) {
    errors.push(`Name optimization: ${nameResult.error}`);
    needsReview = true;
  }
  if (nicheResult.error) {
    errors.push(`Niche detection: ${nicheResult.error}`);
  }
  if (imageResult.errors.length > 0) {
    errors.push(...imageResult.errors);
  }

  // Generate description after we have the niche
  const descriptionResult = await generateProductDescription(
    nameResult.name,
    nicheResult.nicheName || undefined
  );

  if (descriptionResult.error) {
    errors.push(`Description generation: ${descriptionResult.error}`);
    needsReview = true;
  }

  console.log(`[AI Enrichment] Completed enrichment for: ${originalName}`, {
    manipulatedImages: imageResult.urls.length,
    hasErrors: errors.length > 0,
    needsReview,
  });

  return {
    ai_name: nameResult.name,
    ai_description: descriptionResult.description,
    generated_image_urls: imageResult.urls,
    detected_niche_id: nicheResult.nicheId,
    errors,
    needs_review: needsReview,
  };
}

