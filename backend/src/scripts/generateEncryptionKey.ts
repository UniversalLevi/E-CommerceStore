import crypto from 'crypto';

/**
 * Generate a secure 256-bit encryption key for AES-256-GCM
 * Run: npm run generate-key
 */
function generateEncryptionKey() {
  const key = crypto.randomBytes(32).toString('base64');
  
  console.log('\n🔐 Generated Encryption Key\n');
  console.log('Add this to your backend/.env file:\n');
  console.log(`ENCRYPTION_KEY=${key}\n`);
  console.log('⚠️  IMPORTANT:');
  console.log('   - Keep this key secret');
  console.log('   - Back it up securely');
  console.log('   - Never commit it to version control');
  console.log('   - Losing this key means losing access to all encrypted credentials\n');
}

generateEncryptionKey();



