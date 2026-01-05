import axios from 'axios';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const WEBHOOK_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const WEBHOOK_ENDPOINT = `${WEBHOOK_URL}/api/whatsapp/webhook`;

/**
 * Test webhook verification (GET)
 */
async function testWebhookVerification() {
  console.log('\n📋 Testing Webhook Verification (GET)...');
  
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'test_verify_token';
  const challenge = `test_challenge_${Date.now()}`;
  
  try {
    const response = await axios.get(WEBHOOK_ENDPOINT, {
      params: {
        'hub.mode': 'subscribe',
        'hub.verify_token': verifyToken,
        'hub.challenge': challenge,
      },
    });
    
    if (response.data === challenge) {
      console.log('✅ Webhook verification successful!');
      console.log(`   Challenge returned: ${response.data}`);
    } else {
      console.log('❌ Webhook verification failed!');
      console.log(`   Expected: ${challenge}`);
      console.log(`   Got: ${response.data}`);
    }
  } catch (error: any) {
    console.error('❌ Error testing webhook verification:', error.response?.data || error.message);
  }
}

/**
 * Test incoming message (POST) - Image with caption
 */
async function testImageWithCaption() {
  console.log('\n📋 Testing Image Message with Caption (POST)...');
  
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || 'test_phone_id';
  const messageId = `wamid.test_${Date.now()}`;
  
  const payload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'test_entry_id',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '1234567890',
                phone_number_id: phoneNumberId,
              },
              messages: [
                {
                  from: '919876543210',
                  id: messageId,
                  timestamp: Math.floor(Date.now() / 1000).toString(),
                  type: 'image',
                  image: {
                    id: 'test_image_id_' + Date.now(), // test_ prefix enables placeholder mode
                    mime_type: 'image/jpeg',
                    sha256: 'test_hash_' + Date.now(),
                    caption: 'Product Name: Wireless Bluetooth Headphones Premium\nCost Price: 500',
                  },
                },
              ],
            },
            field: 'messages',
          },
        ],
      },
    ],
  };
  
  try {
    const response = await axios.post(WEBHOOK_ENDPOINT, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('✅ Webhook POST request sent successfully!');
    console.log(`   Status: ${response.status}`);
    console.log(`   Message ID: ${messageId}`);
    console.log('\n   Note: Check your server logs and database for draft creation.');
    console.log('   The draft should appear in /admin/whatsapp-drafts after processing.');
  } catch (error: any) {
    if (error.response?.status === 200) {
      // 200 is expected - webhook returns 200 immediately
      console.log('✅ Webhook POST request accepted!');
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message ID: ${messageId}`);
      console.log('\n   Note: Check your server logs and database for draft creation.');
    } else {
      console.error('❌ Error testing webhook POST:', error.response?.data || error.message);
    }
  }
}

/**
 * Test text-only message (should be ignored - needs image)
 */
async function testTextOnly() {
  console.log('\n📋 Testing Text-Only Message (should be ignored)...');
  
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || 'test_phone_id';
  const messageId = `wamid.test_text_${Date.now()}`;
  
  const payload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'test_entry_id',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '1234567890',
                phone_number_id: phoneNumberId,
              },
              messages: [
                {
                  from: '919876543210',
                  id: messageId,
                  timestamp: Math.floor(Date.now() / 1000).toString(),
                  type: 'text',
                  text: {
                    body: 'Product Name: Test Product\nCost Price: 300',
                  },
                },
              ],
            },
            field: 'messages',
          },
        ],
      },
    ],
  };
  
  try {
    const response = await axios.post(WEBHOOK_ENDPOINT, payload);
    console.log('✅ Text-only message sent (expected to be ignored)');
    console.log(`   Status: ${response.status}`);
  } catch (error: any) {
    if (error.response?.status === 200) {
      console.log('✅ Text-only message accepted (will be ignored - no image)');
    } else {
      console.error('❌ Error:', error.response?.data || error.message);
    }
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🚀 Starting WhatsApp Webhook Tests...');
  console.log(`   Webhook URL: ${WEBHOOK_ENDPOINT}`);
  console.log(`   Feature Enabled: ${process.env.ENABLE_WHATSAPP_BULK_ADD === 'true' ? '✅ Yes' : '❌ No'}`);
  
  if (process.env.ENABLE_WHATSAPP_BULK_ADD !== 'true') {
    console.log('\n⚠️  Warning: ENABLE_WHATSAPP_BULK_ADD is not set to "true"');
    console.log('   Set it in your .env file to enable the feature.');
  }
  
  await testWebhookVerification();
  await testImageWithCaption();
  await testTextOnly();
  
  console.log('\n✅ All tests completed!');
  console.log('\n📝 Next Steps:');
  console.log('   1. Check server logs for processing messages');
  console.log('   2. Check database for WhatsAppProductDraft documents');
  console.log('   3. Visit /admin/whatsapp-drafts to see drafts');
  console.log('   4. For real testing, set up Meta webhook and send actual WhatsApp messages');
}

// Run tests
runTests().catch(console.error);

