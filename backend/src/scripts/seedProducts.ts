/**
 * Sample Product Seeder
 * Run this script to populate your database with sample products for testing
 * 
 * Usage: npx ts-node src/scripts/seedProducts.ts
 */

import mongoose from 'mongoose';
import { Product } from '../models/Product';
import { config } from '../config/env';

const sampleProducts = [
  {
    title: 'Wireless Bluetooth Headphones',
    description: 'Premium wireless headphones with active noise cancellation, 30-hour battery life, and crystal-clear audio quality. Perfect for music lovers and professionals.',
    price: 79.99,
    category: 'electronics',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800',
    ],
    active: true,
  },
  {
    title: 'Smart Fitness Watch',
    description: 'Track your fitness goals with this advanced smartwatch featuring heart rate monitoring, GPS, sleep tracking, and 50+ sport modes. Water-resistant up to 50m.',
    price: 149.99,
    category: 'electronics',
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
      'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800',
    ],
    active: true,
  },
  {
    title: 'Minimalist Leather Backpack',
    description: 'Stylish and functional leather backpack with laptop compartment, multiple pockets, and durable construction. Perfect for daily commute or travel.',
    price: 89.99,
    category: 'fashion',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
      'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800',
    ],
    active: true,
  },
  {
    title: 'Organic Cotton T-Shirt',
    description: 'Comfortable and eco-friendly t-shirt made from 100% organic cotton. Available in multiple colors. Breathable, soft, and perfect for everyday wear.',
    price: 24.99,
    category: 'fashion',
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
      'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800',
    ],
    active: true,
  },
  {
    title: 'Modern Desk Lamp',
    description: 'LED desk lamp with adjustable brightness, color temperature control, and USB charging port. Energy-efficient and eye-friendly lighting for your workspace.',
    price: 45.99,
    category: 'home',
    images: [
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800',
      'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800',
    ],
    active: true,
  },
  {
    title: 'Ceramic Coffee Mug Set',
    description: 'Set of 4 handcrafted ceramic coffee mugs. Microwave and dishwasher safe. Beautiful design that adds elegance to your morning coffee routine.',
    price: 34.99,
    category: 'home',
    images: [
      'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800',
      'https://images.unsplash.com/photo-1556881286-fc6915169721?w=800',
    ],
    active: true,
  },
  {
    title: 'Portable Phone Charger',
    description: '20000mAh power bank with fast charging support for multiple devices. Compact design with LED indicator. Never run out of battery on the go.',
    price: 29.99,
    category: 'electronics',
    images: [
      'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800',
      'https://images.unsplash.com/photo-1624823183493-ed5832f48f18?w=800',
    ],
    active: true,
  },
  {
    title: 'Yoga Mat with Carrying Strap',
    description: 'Premium non-slip yoga mat made from eco-friendly materials. Extra thick for comfort, includes carrying strap. Perfect for yoga, pilates, and fitness.',
    price: 39.99,
    category: 'sports',
    images: [
      'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800',
      'https://images.unsplash.com/photo-1588286840104-8957b019727f?w=800',
    ],
    active: true,
  },
];

async function seedProducts() {
  try {
    console.log('🌱 Starting product seeder...');

    // Connect to MongoDB
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing products (optional - comment out if you want to keep existing)
    const deleteResult = await Product.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing products`);

    // Insert sample products
    const products = await Product.insertMany(sampleProducts);
    console.log(`✅ Created ${products.length} sample products`);

    // Display created products
    console.log('\n📦 Created Products:');
    products.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.title} - $${product.price} (${product.category})`);
    });

    console.log('\n🎉 Seeding completed successfully!');
    console.log('💡 You can now view these products at http://localhost:3000/products');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeder
seedProducts();

