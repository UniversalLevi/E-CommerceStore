/**
 * Generate Encryption Key Script
 * Run this to generate a secure encryption key for ENCRYPTION_KEY env variable
 * 
 * Usage: npx ts-node src/scripts/generateEncryptionKey.ts
 */

import crypto from 'crypto';

function generateEncryptionKey() {
  console.log('\n🔐 Encryption Key Generator\n');
  console.log('Generating a secure 256-bit (32-byte) encryption key...\n');
  
  const key = crypto.randomBytes(32).toString('hex');
  
  console.log('✅ Generated Encryption Key:');
  console.log('─'.repeat(70));
  console.log(key);
  console.log('─'.repeat(70));
  console.log('\n📝 Add this to your backend/.env file:');
  console.log(`ENCRYPTION_KEY=${key}`);
  console.log('\n⚠️  IMPORTANT:');
  console.log('1. Keep this key secure and never commit it to version control');
  console.log('2. Use the same key across all instances of your application');
  console.log('3. Back up this key securely - losing it means losing access to encrypted data');
  console.log('4. Generate a new key for each environment (dev, staging, production)\n');
}

generateEncryptionKey();

