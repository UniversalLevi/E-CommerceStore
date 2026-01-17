import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { isPaidUser } from '../middleware/subscription';
import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured');
    return null;
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });
  }

  return openaiClient;
}

// Rate limiting map
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const key = `rate_limit:${userId}`;
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
}

async function generateAIResponse(
  prompt: string,
  systemPrompt?: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const client = getOpenAIClient();

  if (!client) {
    return 'AI service is not configured. Please set OPENAI_API_KEY environment variable.';
  }

  try {
    const response = await client.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
        { role: 'user' as const, content: prompt },
      ],
      max_tokens: options?.maxTokens || 1000,
      temperature: options?.temperature || 0.7,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    throw new Error(`AI generation failed: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Generate recommendations for Instagram/Facebook ad settings
 * POST /api/instagram/generate-recommendations
 * POST /api/facebook/generate-recommendations
 */
export const generateRecommendations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    // Check subscription (admin bypass)
    if (req.user.role !== 'admin' && !(await isPaidUser(req.user))) {
      throw createError('Subscription required', 403);
    }

    const userId = (req.user as any)._id.toString();
    if (!checkRateLimit(userId)) {
      throw createError('Rate limit exceeded. Please try again later.', 429);
    }

    const { productName } = req.body;
    if (!productName) {
      throw createError('Product name is required', 400);
    }

    const prompt = `Based on the product "${productName}", recommend optimal ad campaign settings. Return a JSON object with: campaignGoal (string), dailyBudget (number), country (string), ageRange (object with min and max numbers), gender (string: "all", "male", or "female"). Return only valid JSON, no explanations.`;
    
    const response = await generateAIResponse(prompt, 'You are a Facebook/Instagram advertising expert.');
    
    let recommendations;
    try {
      recommendations = JSON.parse(response);
    } catch {
      recommendations = {
        campaignGoal: 'Conversions',
        dailyBudget: 50,
        country: 'United States',
        ageRange: { min: 18, max: 65 },
        gender: 'all',
      };
    }

    res.json({ success: true, recommendations });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate captions for social media
 * POST /api/instagram/generate-captions
 * POST /api/facebook/generate-captions
 */
export const generateCaptions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    if (req.user.role !== 'admin' && !isPaidUser(req.user)) {
      throw createError('Subscription required', 403);
    }

    const userId = (req.user as any)._id.toString();
    if (!checkRateLimit(userId)) {
      throw createError('Rate limit exceeded. Please try again later.', 429);
    }

    const { productName, platform = 'instagram' } = req.body;
    if (!productName) {
      throw createError('Product name is required', 400);
    }

    const prompt = `Generate 5 engaging ${platform} ad captions for the product: "${productName}". Each caption should be 1-2 sentences, engaging, and include a call-to-action. Return each caption on a new line, numbered 1-5.`;
    
    const response = await generateAIResponse(prompt, 'You are a copywriting expert specializing in social media ads.');
    
    const captions = response
      .split('\n')
      .map((line) => line.replace(/^\d+[\.\)]\s*/, '').trim())
      .filter(Boolean)
      .slice(0, 5);

    res.json({ 
      success: true, 
      captions: captions.length > 0 ? captions : ['Check out this amazing product!', 'Discover something special today!']
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate hashtags
 * POST /api/instagram/generate-hashtags
 * POST /api/facebook/generate-hashtags
 */
export const generateHashtags = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    if (req.user.role !== 'admin' && !isPaidUser(req.user)) {
      throw createError('Subscription required', 403);
    }

    const userId = (req.user as any)._id.toString();
    if (!checkRateLimit(userId)) {
      throw createError('Rate limit exceeded. Please try again later.', 429);
    }

    const { productName, platform = 'instagram' } = req.body;
    if (!productName) {
      throw createError('Product name is required', 400);
    }

    const prompt = `Generate 10 relevant hashtags for ${platform} posts about: "${productName}". Return only hashtags separated by spaces, no explanations.`;
    
    const response = await generateAIResponse(prompt, 'You are a social media marketing expert.');
    
    const hashtags = response
      .split(/\s+/)
      .map((h) => h.replace(/^#/, '').trim())
      .filter(Boolean)
      .map((h) => `#${h}`)
      .slice(0, 10);

    res.json({ 
      success: true, 
      hashtags: hashtags.length > 0 ? hashtags : ['#product', '#new', '#trending']
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate interests for targeting
 * POST /api/instagram/generate-interests
 * POST /api/facebook/generate-interests
 */
export const generateInterests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    if (req.user.role !== 'admin' && !isPaidUser(req.user)) {
      throw createError('Subscription required', 403);
    }

    const userId = (req.user as any)._id.toString();
    if (!checkRateLimit(userId)) {
      throw createError('Rate limit exceeded. Please try again later.', 429);
    }

    const { productName } = req.body;
    if (!productName) {
      throw createError('Product name is required', 400);
    }

    const prompt = `Generate 10 relevant interest keywords for Facebook/Instagram ad targeting based on this product: "${productName}". Return only a comma-separated list of interests, no explanations.`;
    
    const response = await generateAIResponse(prompt, 'You are a social media advertising expert.');
    const interests = response.split(',').map((i) => i.trim()).filter(Boolean).slice(0, 10);

    res.json({ 
      success: true, 
      interests: interests.length > 0 ? interests : ['Shopping', 'E-commerce', 'Online shopping']
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate trending content ideas
 * POST /api/content/trending
 */
export const generateTrendingContent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    if (req.user.role !== 'admin' && !isPaidUser(req.user)) {
      throw createError('Subscription required', 403);
    }

    const userId = (req.user as any)._id.toString();
    if (!checkRateLimit(userId)) {
      throw createError('Rate limit exceeded. Please try again later.', 429);
    }

    const { niche } = req.body;
    if (!niche) {
      throw createError('Niche is required', 400);
    }

    const prompt = `Generate trending content ideas for the "${niche}" niche. Return a JSON object with arrays: adConcepts (5 items), viralProductIdeas (5 items), ugcExamples (3 items), hookIdeas (10 items), captionTemplates (10 items). Return only valid JSON, no explanations.`;
    
    const response = await generateAIResponse(prompt, 'You are a social media trends expert.');
    
    let content;
    try {
      content = JSON.parse(response);
    } catch {
      content = {
        adConcepts: [],
        viralProductIdeas: [],
        ugcExamples: [],
        hookIdeas: [],
        captionTemplates: [],
      };
    }

    res.json({ success: true, content });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate daily content ideas
 * GET /api/content/daily
 */
export const generateDailyIdeas = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    if (req.user.role !== 'admin' && !isPaidUser(req.user)) {
      throw createError('Subscription required', 403);
    }

    const userId = (req.user as any)._id.toString();
    if (!checkRateLimit(userId)) {
      throw createError('Rate limit exceeded. Please try again later.', 429);
    }

    const prompt = `Generate fresh daily content ideas for social media. Return a JSON object with arrays: reelIdeas (10 items), photoIdeas (10 items), hooks (10 items), captions (10 items), trendingAudios (10 items - just descriptions, not actual audio). Return only valid JSON, no explanations.`;
    
    const response = await generateAIResponse(prompt, 'You are a social media content strategist.');
    
    let ideas;
    try {
      ideas = JSON.parse(response);
    } catch {
      ideas = {
        reelIdeas: ['Create a day-in-the-life video', 'Product unboxing with reactions', 'Behind the scenes content'],
        photoIdeas: ['Flat lay product shots', 'Lifestyle imagery', 'Customer testimonials'],
        hooks: ['Did you know...', 'Stop scrolling if...', 'This changed my life'],
        captions: ['New drop alert!', 'Limited time offer', 'Link in bio'],
        trendingAudios: ['Upbeat trending sound', 'Viral voiceover clip', 'Popular music track'],
      };
    }

    res.json({ success: true, ideas, cached: false });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate content using AI
 * POST /api/content/generator
 */
export const generateContent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    if (req.user.role !== 'admin' && !isPaidUser(req.user)) {
      throw createError('Subscription required', 403);
    }

    const userId = (req.user as any)._id.toString();
    if (!checkRateLimit(userId)) {
      throw createError('Rate limit exceeded. Please try again later.', 429);
    }

    const { type, productName, niche } = req.body;
    if (!type) {
      throw createError('Content type is required', 400);
    }

    let prompt = '';
    let systemPrompt = 'You are a creative content strategist for e-commerce.';

    let isStructured = false;
    
    switch (type) {
      case 'hook':
        prompt = `Generate 5 attention-grabbing hooks for ${productName ? `the product "${productName}"` : `the ${niche || 'general'} niche`}. Return them as a numbered list.`;
        break;
      case 'caption':
        prompt = `Generate 5 engaging social media captions for ${productName ? `the product "${productName}"` : `the ${niche || 'general'} niche`}. Return them as a numbered list.`;
        break;
      case 'script':
        prompt = `Write a 30-second video script for ${productName ? `promoting "${productName}"` : `a ${niche || 'general'} product`}. Include hook, main content, and call-to-action.`;
        break;
      case 'creative_idea':
        isStructured = true;
        const productContext = productName ? `the product "${productName}"` : `the ${niche || 'general'} niche`;
        prompt = `Generate creative content for ${productContext}. Return a JSON object with these arrays of STRINGS ONLY (no nested objects):
- adConcepts: 5 creative ad campaign ideas as plain text strings
- scripts: 3 short video scripts as plain text strings (each script should be a single string containing hook, content, and CTA)
- ugcIdeas: 3 user-generated content ideas as plain text strings
- headlines: 5 catchy headlines/hooks as plain text strings

IMPORTANT: Each array must contain ONLY plain text strings, NOT objects.
Return ONLY valid JSON, no explanations or markdown.
Example: {"adConcepts":["Create a viral unboxing video showcasing...","Launch a before/after transformation campaign..."],"scripts":["Hook: Stop scrolling! Content: This product changed my life... CTA: Click the link below!"],"ugcIdeas":["Ask customers to share their experience..."],"headlines":["This Changes Everything","You Won't Believe..."]}`;
        break;
      default:
        prompt = `Generate marketing content for ${productName || niche || 'e-commerce'}.`;
    }

    const response = await generateAIResponse(prompt, systemPrompt);

    if (isStructured) {
      // Parse JSON response for structured content
      let ideas;
      try {
        // Try to extract JSON from the response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          ideas = JSON.parse(jsonMatch[0]);
        } else {
          ideas = JSON.parse(response);
        }
      } catch {
        // Fallback: create structured response from plain text
        ideas = {
          adConcepts: [response],
          scripts: [],
          ugcIdeas: [],
          headlines: [],
        };
      }
      
      // Sanitize: Convert any objects in arrays to strings
      const sanitizeArray = (arr: any[]): string[] => {
        if (!Array.isArray(arr)) return [];
        return arr.map(item => {
          if (typeof item === 'string') return item;
          if (typeof item === 'object' && item !== null) {
            // Convert object to readable string
            if (item.hook || item.content || item.CTA) {
              return `Hook: ${item.hook || ''}\nContent: ${item.content || ''}\nCTA: ${item.CTA || ''}`.trim();
            }
            return Object.values(item).join(' - ');
          }
          return String(item);
        });
      };
      
      ideas = {
        adConcepts: sanitizeArray(ideas.adConcepts),
        scripts: sanitizeArray(ideas.scripts),
        ugcIdeas: sanitizeArray(ideas.ugcIdeas),
        headlines: sanitizeArray(ideas.headlines),
      };
      
      return res.json({ success: true, ideas, type });
    }

    res.json({ success: true, content: response, type });
  } catch (error) {
    next(error);
  }
};

/**
 * Get content library (placeholder - returns empty for now)
 * GET /api/content/library
 */
export const getContentLibrary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    if (req.user.role !== 'admin' && !isPaidUser(req.user)) {
      throw createError('Subscription required', 403);
    }

    // Return empty library for now - can be extended to use database
    res.json({ success: true, library: [] });
  } catch (error) {
    next(error);
  }
};

/**
 * Save content to library (placeholder)
 * POST /api/content/library
 */
export const saveToLibrary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    if (req.user.role !== 'admin' && !isPaidUser(req.user)) {
      throw createError('Subscription required', 403);
    }

    const { type, content, title } = req.body;
    if (!content) {
      throw createError('Content is required', 400);
    }

    // For now, just acknowledge the save
    res.json({ 
      success: true, 
      message: 'Content saved successfully',
      content: { type, content, title, createdAt: new Date() }
    });
  } catch (error) {
    next(error);
  }
};


