import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured. AI features will use fallback responses.');
    return null;
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: OPENAI_API_KEY,
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
    .replace(/<script.*?>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\b(100%|guaranteed|FDA-approved|cure|heal|magic|viral|guaranteed to go viral)\b/gi, '')
    .replace(/\b(FDA|cure|heal|treat|medical|prescription|diagnosis)\b/gi, '')
    .trim();
}

/**
 * Rate limiting helper - simple in-memory counter
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute per user

export function checkRateLimit(userId: string): boolean {
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

/**
 * Generate AI response with prompt
 */
export async function generateAIResponse(
  prompt: string,
  systemPrompt?: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
  }
): Promise<string> {
  const client = getOpenAIClient();

  if (!client) {
    // Fallback response when OpenAI is not configured
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

    const content = response.choices[0]?.message?.content || '';
    return sanitizeLLMOutput(content);
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    throw new Error(`AI generation failed: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Generate interests from product name
 */
export async function generateInterests(productName: string): Promise<string[]> {
  const prompt = `Generate 10 relevant interest keywords for Facebook/Instagram ad targeting based on this product: "${productName}". Return only a comma-separated list of interests, no explanations.`;
  
  const response = await generateAIResponse(prompt, 'You are a social media advertising expert.');
  return response.split(',').map((i) => i.trim()).filter(Boolean).slice(0, 10);
}

/**
 * Generate captions
 */
export async function generateCaptions(productName: string, platform: 'instagram' | 'facebook'): Promise<string[]> {
  const prompt = `Generate 5 engaging ${platform} ad captions for the product: "${productName}". Each caption should be 1-2 sentences, engaging, and include a call-to-action. Return each caption on a new line, numbered 1-5.`;
  
  const response = await generateAIResponse(prompt, 'You are a copywriting expert specializing in social media ads.');
  const captions = response
    .split('\n')
    .map((line) => line.replace(/^\d+[\.\)]\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 5);
  
  return captions.length > 0 ? captions : ['Check out this amazing product!', 'Discover something special today!'];
}

/**
 * Generate hashtags
 */
export async function generateHashtags(productName: string, platform: 'instagram' | 'facebook'): Promise<string[]> {
  const prompt = `Generate 10 relevant hashtags for ${platform} posts about: "${productName}". Return only hashtags separated by spaces, no explanations.`;
  
  const response = await generateAIResponse(prompt, 'You are a social media marketing expert.');
  const hashtags = response
    .split(/\s+/)
    .map((h) => h.replace(/^#/, '').trim())
    .filter(Boolean)
    .map((h) => `#${h}`)
    .slice(0, 10);
  
  return hashtags.length > 0 ? hashtags : ['#product', '#new', '#trending'];
}

/**
 * Generate CTA recommendations
 */
export async function generateCTAs(productName: string): Promise<string[]> {
  const prompt = `Generate 3 effective call-to-action phrases for ads promoting: "${productName}". Return each CTA on a new line, numbered 1-3.`;
  
  const response = await generateAIResponse(prompt, 'You are a conversion optimization expert.');
  const ctas = response
    .split('\n')
    .map((line) => line.replace(/^\d+[\.\)]\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 3);
  
  return ctas.length > 0 ? ctas : ['Shop Now', 'Learn More', 'Get Started'];
}

/**
 * Generate recommended settings
 */
export async function generateRecommendedSettings(productName: string): Promise<{
  campaignGoal: string;
  dailyBudget: number;
  country: string;
  ageRange: { min: number; max: number };
  gender: string;
}> {
  const prompt = `Based on the product "${productName}", recommend optimal ad campaign settings. Return a JSON object with: campaignGoal (string), dailyBudget (number), country (string), ageRange (object with min and max numbers), gender (string: "all", "male", or "female"). Return only valid JSON, no explanations.`;
  
  const response = await generateAIResponse(prompt, 'You are a Facebook/Instagram advertising expert.');
  
  try {
    const parsed = JSON.parse(response);
    return {
      campaignGoal: parsed.campaignGoal || 'Conversions',
      dailyBudget: parsed.dailyBudget || 50,
      country: parsed.country || 'United States',
      ageRange: {
        min: parsed.ageRange?.min || 18,
        max: parsed.ageRange?.max || 65,
      },
      gender: parsed.gender || 'all',
    };
  } catch {
    // Fallback if JSON parsing fails
    return {
      campaignGoal: 'Conversions',
      dailyBudget: 50,
      country: 'United States',
      ageRange: { min: 18, max: 65 },
      gender: 'all',
    };
  }
}

/**
 * Generate trending content for niche
 */
export async function generateTrendingContent(niche: string): Promise<{
  adConcepts: string[];
  viralProductIdeas: string[];
  ugcExamples: string[];
  hookIdeas: string[];
  captionTemplates: string[];
}> {
  const prompt = `Generate trending content ideas for the "${niche}" niche. Return a JSON object with arrays: adConcepts (5 items), viralProductIdeas (5 items), ugcExamples (3 items), hookIdeas (10 items), captionTemplates (10 items). Return only valid JSON, no explanations.`;
  
  const response = await generateAIResponse(prompt, 'You are a social media trends expert.');
  
  try {
    const parsed = JSON.parse(response);
    return {
      adConcepts: Array.isArray(parsed.adConcepts) ? parsed.adConcepts.slice(0, 5) : [],
      viralProductIdeas: Array.isArray(parsed.viralProductIdeas) ? parsed.viralProductIdeas.slice(0, 5) : [],
      ugcExamples: Array.isArray(parsed.ugcExamples) ? parsed.ugcExamples.slice(0, 3) : [],
      hookIdeas: Array.isArray(parsed.hookIdeas) ? parsed.hookIdeas.slice(0, 10) : [],
      captionTemplates: Array.isArray(parsed.captionTemplates) ? parsed.captionTemplates.slice(0, 10) : [],
    };
  } catch {
    return {
      adConcepts: [],
      viralProductIdeas: [],
      ugcExamples: [],
      hookIdeas: [],
      captionTemplates: [],
    };
  }
}

/**
 * Generate daily content ideas
 */
export async function generateDailyIdeas(): Promise<{
  reelIdeas: string[];
  photoIdeas: string[];
  hooks: string[];
  captions: string[];
  trendingAudios: string[];
}> {
  const prompt = `Generate fresh daily content ideas for social media. Return a JSON object with arrays: reelIdeas (10 items), photoIdeas (10 items), hooks (10 items), captions (10 items), trendingAudios (10 items - just descriptions, not actual audio). Return only valid JSON, no explanations.`;
  
  const response = await generateAIResponse(prompt, 'You are a social media content strategist.');
  
  try {
    const parsed = JSON.parse(response);
    return {
      reelIdeas: Array.isArray(parsed.reelIdeas) ? parsed.reelIdeas.slice(0, 10) : [],
      photoIdeas: Array.isArray(parsed.photoIdeas) ? parsed.photoIdeas.slice(0, 10) : [],
      hooks: Array.isArray(parsed.hooks) ? parsed.hooks.slice(0, 10) : [],
      captions: Array.isArray(parsed.captions) ? parsed.captions.slice(0, 10) : [],
      trendingAudios: Array.isArray(parsed.trendingAudios) ? parsed.trendingAudios.slice(0, 10) : [],
    };
  } catch {
    return {
      reelIdeas: [],
      photoIdeas: [],
      hooks: [],
      captions: [],
      trendingAudios: [],
    };
  }
}

/**
 * Generate creative ideas from product
 */
export async function generateCreativeIdeas(productName: string): Promise<{
  adConcepts: string[];
  scripts: string[];
  ugcIdeas: string[];
  headlines: string[];
}> {
  const prompt = `Generate creative ad ideas for the product: "${productName}". Return a JSON object with arrays: adConcepts (5 items), scripts (3 items - short ad scripts), ugcIdeas (3 items), headlines (5 items). Return only valid JSON, no explanations.`;
  
  const response = await generateAIResponse(prompt, 'You are a creative advertising director.');
  
  try {
    const parsed = JSON.parse(response);
    return {
      adConcepts: Array.isArray(parsed.adConcepts) ? parsed.adConcepts.slice(0, 5) : [],
      scripts: Array.isArray(parsed.scripts) ? parsed.scripts.slice(0, 3) : [],
      ugcIdeas: Array.isArray(parsed.ugcIdeas) ? parsed.ugcIdeas.slice(0, 3) : [],
      headlines: Array.isArray(parsed.headlines) ? parsed.headlines.slice(0, 5) : [],
    };
  } catch {
    return {
      adConcepts: [],
      scripts: [],
      ugcIdeas: [],
      headlines: [],
    };
  }
}

