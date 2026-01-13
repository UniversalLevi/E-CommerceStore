/**
 * Test Script: Image Manipulation Only
 * 
 * Creates 1 product image variation:
 * 1. Manipulated: Flipped version (exact same product, horizontally or vertically flipped)
 * 
 * Usage: npx ts-node scripts/test-combined-images.ts <image-path> [product-name]
 */

import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';


/**
 * Create flipped version using sharp
 * Automatically chooses horizontal or vertical flip based on image dimensions
 */
async function createFlippedVersion(inputPath: string, outputPath: string): Promise<boolean> {
  try {
    // Get image metadata to determine orientation
    const metadata = await sharp(inputPath).metadata();
    const isLandscape = (metadata.width || 0) >= (metadata.height || 0);

    if (isLandscape) {
      // Horizontal flip (flop) for landscape images
      await sharp(inputPath)
        .flop()
        .jpeg({ quality: 95 })
        .toFile(outputPath);
      console.log('  → Applied horizontal flip (landscape image)');
    } else {
      // Vertical flip (flip) for portrait images
      await sharp(inputPath)
        .flip()
        .jpeg({ quality: 95 })
        .toFile(outputPath);
      console.log('  → Applied vertical flip (portrait image)');
    }
    
    return true;
  } catch (error: any) {
    console.error(`  ❌ Flip failed: ${error.message}`);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
Usage: npx ts-node scripts/test-combined-images.ts <image-path> [product-name]

Example:
  npx ts-node scripts/test-combined-images.ts "C:\\Users\\Downloads\\product.jpg" "Wrist Watch"
    `);
    process.exit(1);
  }
  
  const imagePath = path.resolve(args[0]);
  const productName = args[1] || 'Product';
  
  if (!fs.existsSync(imagePath)) {
    console.error(`❌ Image not found: ${imagePath}`);
    process.exit(1);
  }
  
  console.log('🚀 Starting image manipulation...');
  console.log(`📸 Image: ${imagePath}`);
  console.log(`🏷️  Product: ${productName}\n`);
  
  const outputDir = path.join(process.cwd(), 'public', 'uploads', 'test-combined');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const timestamp = Date.now();
  const results: string[] = [];
  
  // === IMAGE 1: FLIPPED VERSION (Manipulation) ===
  console.log('\n📷 Creating flipped version...');
  const flippedPath = path.join(outputDir, `manipulated-${timestamp}-flipped.jpg`);
  if (await createFlippedVersion(imagePath, flippedPath)) {
    results.push(flippedPath);
    console.log(`  ✅ Saved: ${path.basename(flippedPath)}`);
  }
  
  // === SUMMARY ===
  console.log(`\n${'='.repeat(50)}`);
  console.log('✅ COMPLETE!\n');
  console.log('📊 Results:');
  console.log(`  - Original: ${imagePath}`);
  console.log(`  - Generated ${results.length} manipulated image:\n`);
  results.forEach((img, i) => {
    console.log(`    ${i + 1}. ${path.basename(img)} (Flipped - Exact same product)`);
  });
  console.log(`\n💡 Check: ${outputDir}`);
}

main().catch((err) => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});

