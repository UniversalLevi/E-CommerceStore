/**
 * Test Script: Image Generation with GPT-4 Vision Analysis
 * 
 * This script tests the workflow:
 * 1. Analyze original product image using GPT-4 Vision
 * 2. Generate detailed description
 * 3. Use description to generate 3 similar images with DALL-E 3
 * 
 * Usage: npx ts-node scripts/test-image-generation.ts <image-path> [product-name]
 * Example: npx ts-node scripts/test-image-generation.ts public/uploads/whatsapp/wa-123.jpg "Wrist Watch"
 */

import OpenAI from 'openai';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables - prioritize backend/.env
const envPaths = [
  path.join(process.cwd(), '.env'), // backend/.env (when running from backend directory)
  path.join(__dirname, '../../.env'), // root .env
  path.join(process.cwd(), 'backend', '.env'), // backend/.env (when running from root)
];

let envLoaded = false;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    if (!envLoaded) {
      console.log(`📁 Loaded .env from: ${envPath}`);
      envLoaded = true;
    }
  }
}

// Also try loading from backend directory specifically
const backendEnvPath = path.join(__dirname, '../.env');
if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath, override: true }); // Override to prioritize backend/.env
  console.log(`📁 Also loaded backend/.env from: ${backendEnvPath}`);
}

// Initialize OpenAI client (will be created when needed)
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not found in environment variables. Please check your .env file.');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

/**
 * Convert local image to base64 for GPT-4 Vision
 */
function imageToBase64(imagePath: string): string {
  const imageBuffer = fs.readFileSync(imagePath);
  return imageBuffer.toString('base64');
}

/**
 * Get image MIME type
 */
function getImageMimeType(imagePath: string): string {
  const ext = path.extname(imagePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
  };
  return mimeTypes[ext] || 'image/jpeg';
}

/**
 * Analyze product image using GPT-4 Vision
 */
async function analyzeProductImage(imagePath: string, productName?: string): Promise<string> {
  console.log(`\n🔍 Analyzing product image: ${imagePath}`);
  
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Image file not found: ${imagePath}`);
  }

  const base64Image = imageToBase64(imagePath);
  const mimeType = getImageMimeType(imagePath);

  const prompt = productName
    ? `Analyze this product image. The product is called "${productName}". 
Describe the product in extreme detail: its exact appearance, colors, materials, design, shape, size, texture, and any distinctive features. 
Be very specific about what the product looks like. This description will be used to generate similar product images, so accuracy is critical.`
    : `Analyze this product image. Describe the product in extreme detail: its exact appearance, colors, materials, design, shape, size, texture, and any distinctive features. 
Be very specific about what the product looks like. This description will be used to generate similar product images, so accuracy is critical.`;

  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: 'gpt-4o', // Using GPT-4o for vision
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    const description = response.choices[0]?.message?.content || '';
    console.log(`✅ Image analysis complete\n`);
    console.log(`📝 Product Description:\n${description}\n`);
    
    return description;
  } catch (error: any) {
    console.error('❌ Error analyzing image:', error.message);
    throw error;
  }
}

/**
 * Use GPT-4 to generate optimized prompts for DALL-E 3 image generation
 */
async function generateImagePromptsWithGPT4(
  productDescription: string,
  productName: string
): Promise<string[]> {
  console.log(`\n🤖 Using GPT-4 to create optimized image generation prompts...\n`);

  const client = getOpenAIClient();

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert at creating precise, photorealistic image generation prompts. Create prompts that generate REALISTIC, PHOTOGRAPHIC images that look like actual product photos, not AI-generated art.

CRITICAL RULES:
- Generate PHOTOREALISTIC images that look like real product photography
- The product must be IDENTICAL in every detail: exact colors, materials, design, shape, size, texture
- Use terms like "photorealistic", "professional product photography", "real product photo", "high-resolution photograph"
- Avoid AI-looking styles - make it look like a real camera photo
- Be extremely specific about product details from the description
- Only vary: background, camera angle, or lighting setup
- NO artistic styles, NO illustrations, NO renderings - ONLY real photography`,
        },
        {
          role: 'user',
          content: `Product Name: ${productName}

Detailed Product Description:
${productDescription}

Create 3 DALL-E 3 prompts for generating PHOTOREALISTIC product photos of this EXACT product:
1. White studio background - professional e-commerce product photo
2. 45-degree side angle - same product, different viewing angle
3. Lifestyle setting - same product in a real environment

Each prompt must:
- Start with "Photorealistic professional product photography of [exact product details]"
- Include ALL specific details from the description (colors, materials, design features)
- Emphasize "real product photo", "high-resolution photograph", "no AI artifacts"
- Keep the product IDENTICAL, only change background/angle/lighting

Return as JSON: {"prompts": ["prompt1", "prompt2", "prompt3"]}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2, // Lower temperature for more consistent, accurate prompts
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from GPT-4');
    }

    const parsed = JSON.parse(content);
    // Handle different possible response formats
    const prompts = parsed.prompts || parsed.prompt || parsed;
    
    if (Array.isArray(prompts) && prompts.length >= 3) {
      console.log(`✅ Generated 3 optimized prompts\n`);
      return prompts.slice(0, 3);
    } else {
      throw new Error('Invalid prompt format from GPT-4');
    }
  } catch (error: any) {
    console.error(`⚠️  GPT-4 prompt generation failed: ${error.message}`);
    console.log(`   Falling back to default prompts...\n`);
    
    // Fallback to default prompts (improved for realism)
    return [
      `Photorealistic professional product photography of ${productName}. ${productDescription}. Exact same product, identical in every detail - colors, materials, design, shape, texture. Only the background is changed to a clean pure white studio background. Real product photo, high-resolution photograph, professional e-commerce photography, no AI artifacts, looks like real camera photo.`,
      `Photorealistic professional product photography of ${productName} from a 45-degree side angle view. ${productDescription}. Exact same product, identical in every detail - colors, materials, design, shape, texture. Only the viewing angle is changed. Real product photo, high-resolution photograph, professional product photography, white or light gray background, no AI artifacts, looks like real camera photo.`,
      `Photorealistic professional product photography of ${productName} in a lifestyle setting. ${productDescription}. Exact same product, identical in every detail - colors, materials, design, shape, texture. Product placed on a subtle lifestyle background (soft blurred modern room or desk setting). Real product photo, high-resolution photograph, natural lighting, e-commerce ready, no AI artifacts, looks like real camera photo.`,
    ];
  }
}

/**
 * Generate 3 similar product images using DALL-E 3 with GPT-4 optimized prompts
 */
async function generateSimilarImages(
  productDescription: string,
  productName: string,
  outputDir: string
): Promise<string[]> {
  console.log(`\n🎨 Generating 3 similar product images with DALL-E 3...\n`);

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Use GPT-4 to generate optimized prompts
  const prompts = await generateImagePromptsWithGPT4(productDescription, productName);

  const generatedImages: string[] = [];

  for (let i = 0; i < prompts.length; i++) {
    try {
      console.log(`  Generating image ${i + 1}/3...`);
      
      const client = getOpenAIClient();
      const response = await client.images.generate({
        model: 'dall-e-3',
        prompt: prompts[i],
        n: 1,
        size: '1024x1024',
        quality: 'hd', // HD quality for better realism
      });

      const imageUrl = response.data?.[0]?.url;
      if (imageUrl) {
        // Download the image
        const imageResponse = await axios.get(imageUrl, {
          responseType: 'arraybuffer',
        });

        const filename = `generated-${Date.now()}-${i + 1}.png`;
        const filePath = path.join(outputDir, filename);
        fs.writeFileSync(filePath, imageResponse.data);

        generatedImages.push(filePath);
        console.log(`  ✅ Saved: ${filename}`);
      }
    } catch (error: any) {
      console.error(`  ❌ Error generating image ${i + 1}:`, error.message);
    }
  }

  return generatedImages;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage: npx ts-node scripts/test-image-generation.ts <image-path> [product-name]

Examples:
  npx ts-node scripts/test-image-generation.ts public/uploads/whatsapp/wa-123.jpg
  npx ts-node scripts/test-image-generation.ts public/uploads/whatsapp/wa-123.jpg "Wrist Watch"
    `);
    process.exit(1);
  }

  const imagePath = path.resolve(args[0]);
  const productName = args[1] || 'Product';

  // Check for API key (will throw error in getOpenAIClient if missing)
  try {
    getOpenAIClient();
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
    console.error('\n💡 Make sure you have OPENAI_API_KEY in your backend/.env file');
    process.exit(1);
  }

  try {
    console.log('🚀 Starting image generation test...');
    console.log(`📸 Image: ${imagePath}`);
    console.log(`🏷️  Product Name: ${productName}\n`);

    // Step 1: Analyze the image
    const productDescription = await analyzeProductImage(imagePath, productName);

    // Step 2: Generate similar images
    const outputDir = path.join(process.cwd(), 'public', 'uploads', 'test-generated');
    const generatedImages = await generateSimilarImages(productDescription, productName, outputDir);

    console.log(`\n✅ Test complete!`);
    console.log(`\n📊 Results:`);
    console.log(`  - Original image analyzed: ${imagePath}`);
    console.log(`  - Generated ${generatedImages.length} images:`);
    generatedImages.forEach((img, idx) => {
      console.log(`    ${idx + 1}. ${img}`);
    });
    console.log(`\n💡 Check the generated images to see if they match the original product.`);
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);

