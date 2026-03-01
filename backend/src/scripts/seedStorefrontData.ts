/**
 * Seed sample reviews and "frequently bought together" data for storefronts.
 * Run from backend dir: npm run seed:storefront
 */
import path from 'path';
import dotenv from 'dotenv';

// Load .env from backend directory (in case cwd is project root)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { connectDatabase } from '../config/database';
import { Store } from '../models/Store';
import { StoreProduct } from '../models/StoreProduct';
import { ProductReview } from '../models/ProductReview';
import mongoose from 'mongoose';

const SAMPLE_REVIEWS = [
  { authorName: 'Priya S.', authorEmail: 'priya.s@example.com', rating: 5, title: 'Exactly what I needed', body: 'Great quality and fast delivery. Very happy with my purchase!' },
  { authorName: 'Rahul M.', authorEmail: 'rahul.m@example.com', rating: 4, title: 'Good product', body: 'Works as described. Would recommend to others.' },
  { authorName: 'Anita K.', authorEmail: 'anita.k@example.com', rating: 5, title: 'Love it', body: 'Perfect. Will buy again.' },
  { authorName: 'Vikram R.', authorEmail: 'vikram.r@example.com', rating: 4, title: 'Solid buy', body: 'Good value for money. No complaints.' },
  { authorName: 'Sneha P.', authorEmail: 'sneha.p@example.com', rating: 5, title: 'Excellent', body: 'Very satisfied. Packaging was also neat.' },
];

async function seed() {
  await connectDatabase();

  const stores = await Store.find({ status: 'active' }).limit(5).lean();
  if (stores.length === 0) {
    console.log('No active stores found. Create a store first.');
    process.exit(0);
    return;
  }

  for (const store of stores) {
    const storeId = store._id as mongoose.Types.ObjectId;
    const products = await StoreProduct.find({ storeId, status: 'active' }).limit(10).lean();
    if (products.length < 2) {
      console.log(`Store ${(store as any).name} has fewer than 2 products, skipping.`);
      continue;
    }

    // Seed approved reviews for first 3 products
    const productIds = products.slice(0, 3).map((p) => p._id);
    let reviewsCreated = 0;
    for (let i = 0; i < productIds.length; i++) {
      const productId = productIds[i];
      const existing = await ProductReview.countDocuments({ storeId, productId });
      if (existing >= 2) continue;
      const toAdd = SAMPLE_REVIEWS.slice(i * 2, i * 2 + 2);
      for (const r of toAdd) {
        try {
          await ProductReview.create({
            storeId,
            productId,
            authorName: r.authorName,
            authorEmail: r.authorEmail,
            rating: r.rating,
            title: r.title,
            body: r.body,
            status: 'approved',
            verifiedPurchase: false,
          });
          reviewsCreated++;
        } catch {
          // skip duplicate or validation error
        }
      }
    }
    if (reviewsCreated > 0) {
      console.log(`Created ${reviewsCreated} review(s) for store ${(store as any).name}`);
    }

    // Seed "frequently bought together" for first 2 or 3 products
    const group = products.slice(0, 3).filter((p) => p && p._id);
    if (group.length >= 2) {
      const ids = group.map((p) => p!._id);
      for (let i = 0; i < group.length; i++) {
        const others = ids.filter((_, j) => j !== i);
        await StoreProduct.updateOne(
          { _id: group[i]!._id, storeId },
          { $set: { boughtTogetherIds: others, boughtTogetherDiscount: 10 } }
        );
      }
      console.log(`Set "Frequently bought together" for ${group.length} products in store ${(store as any).name}`);
    }
  }

  console.log('Storefront seed done.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
