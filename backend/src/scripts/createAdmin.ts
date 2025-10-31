/**
 * Create Admin User Script
 * Run this script to create an admin user directly
 * 
 * Usage: npx ts-node src/scripts/createAdmin.ts
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from '../models/User';
import { config } from '../config/env';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function createAdmin() {
  try {
    console.log('👨‍💼 Admin User Creation Tool\n');

    // Connect to MongoDB
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Get user input
    const email = await question('Enter admin email: ');
    const password = await question('Enter admin password (min 6 characters): ');

    // Validate input
    if (!email.includes('@')) {
      console.log('❌ Invalid email format');
      process.exit(1);
    }

    if (password.length < 6) {
      console.log('❌ Password must be at least 6 characters');
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`\n⚠️  User with email ${email} already exists`);
      const update = await question('Update to admin? (yes/no): ');
      
      if (update.toLowerCase() === 'yes') {
        await User.findByIdAndUpdate(existingUser._id, { role: 'admin' });
        console.log('✅ User updated to admin role');
      } else {
        console.log('❌ Operation cancelled');
      }
      
      rl.close();
      process.exit(0);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const admin = await User.create({
      email,
      password: hashedPassword,
      role: 'admin',
      stores: [],
    });

    console.log('\n✅ Admin user created successfully!');
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🔑 Role: ${admin.role}`);
    console.log(`\n💡 You can now login at http://localhost:3000/login`);

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Admin creation failed:', error);
    rl.close();
    process.exit(1);
  }
}

// Run script
createAdmin();

