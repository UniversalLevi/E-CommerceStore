# WhatsApp Bulk Product Intake - Testing Guide

## Prerequisites

1. **Environment Variables** - Ensure these are set in your `.env` file:
```env
ENABLE_WHATSAPP_BULK_ADD=true
WHATSAPP_PHONE_NUMBER_ID=<your_phone_number_id>
WHATSAPP_ACCESS_TOKEN=<your_permanent_access_token>
WHATSAPP_VERIFY_TOKEN=<your_webhook_verify_token>
WHATSAPP_BUSINESS_ACCOUNT_ID=<your_business_account_id>
```

2. **WhatsApp Business API Setup**:
   - You need a Meta Business Account with WhatsApp Business API access
   - Get your Phone Number ID and Access Token from Meta for Developers
   - Set up a webhook URL pointing to your server

## Testing Methods

### Method 1: Test Webhook Verification (GET)

Test the webhook verification endpoint that Meta uses:

```bash
# Using curl
curl "http://localhost:5000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=YOUR_VERIFY_TOKEN&hub.challenge=test_challenge_123"

# Expected response: "test_challenge_123"
```

### Method 2: Test with Postman/Thunder Client

#### 2.1. Test Webhook Verification
- **Method**: GET
- **URL**: `http://localhost:5000/api/whatsapp/webhook`
- **Query Params**:
  - `hub.mode`: `subscribe`
  - `hub.verify_token`: Your `WHATSAPP_VERIFY_TOKEN`
  - `hub.challenge`: Any string (e.g., `test123`)
- **Expected**: Returns the challenge string

#### 2.2. Simulate WhatsApp Message (POST)

Create a POST request to simulate an incoming WhatsApp message:

- **Method**: POST
- **URL**: `http://localhost:5000/api/whatsapp/webhook`
- **Headers**: `Content-Type: application/json`
- **Body** (JSON):
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "1234567890",
              "phone_number_id": "YOUR_PHONE_NUMBER_ID"
            },
            "messages": [
              {
                "from": "919876543210",
                "id": "wamid.test123",
                "timestamp": "1234567890",
                "type": "image",
                "image": {
                  "id": "test_image_id_123",
                  "mime_type": "image/jpeg",
                  "sha256": "test_hash",
                  "caption": "Product Name: Wireless Bluetooth Headphones\nCost Price: 500"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

**Note**: For real testing, you'll need to:
1. Download an actual image from WhatsApp using the Media API
2. Or use a test image URL that your server can access

### Method 3: Test Admin Dashboard Endpoints

#### 3.1. List All Drafts
```bash
GET http://localhost:5000/api/whatsapp/drafts
Headers: Authorization: Bearer <admin_token>
```

#### 3.2. Get Draft Statistics
```bash
GET http://localhost:5000/api/whatsapp/drafts/stats
Headers: Authorization: Bearer <admin_token>
```

#### 3.3. Get Single Draft
```bash
GET http://localhost:5000/api/whatsapp/drafts/<draft_id>
Headers: Authorization: Bearer <admin_token>
```

#### 3.4. Update Draft
```bash
PUT http://localhost:5000/api/whatsapp/drafts/<draft_id>
Headers: Authorization: Bearer <admin_token>
Body: {
  "ai_name": "Updated Product Name",
  "ai_description": "Updated description",
  "cost_price": 600,
  "profit_margin": 450,
  "detected_niche": "<niche_id>"
}
```

#### 3.5. Approve Draft (Create Product)
```bash
POST http://localhost:5000/api/whatsapp/drafts/<draft_id>/approve
Headers: Authorization: Bearer <admin_token>
```

#### 3.6. Reject Draft
```bash
DELETE http://localhost:5000/api/whatsapp/drafts/<draft_id>
Headers: Authorization: Bearer <admin_token>
```

## Step-by-Step Testing Flow

### Step 1: Set Up Webhook in Meta Dashboard

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Select your WhatsApp Business App
3. Go to **Configuration** → **Webhooks**
4. Click **Edit** on the webhook subscription
5. Set **Callback URL**: `https://your-domain.com/api/whatsapp/webhook`
6. Set **Verify Token**: Same as your `WHATSAPP_VERIFY_TOKEN` env var
7. Subscribe to **messages** field
8. Click **Verify and Save**

### Step 2: Send Test Message via WhatsApp

1. Open WhatsApp on your phone
2. Send a message to your WhatsApp Business number:
   - **First**: Send an image (product photo)
   - **Second**: Send text in this format:
     ```
     Product Name: Wireless Bluetooth Headphones
     Cost Price: 500
     ```

   **OR** send image with caption:
   ```
   [Image with caption:]
   Product Name: Wireless Bluetooth Headphones
   Cost Price: 500
   ```

### Step 3: Check Backend Logs

Watch your server logs for:
```
[WhatsApp Webhook] Image received from <phone_number>, waiting for text
[WhatsApp Webhook] Downloading image: <media_id>
[WhatsApp Webhook] Draft created: <draft_id>
[WhatsApp Webhook] Starting enrichment for draft: <draft_id>
[AI Enrichment] Starting enrichment for: <product_name>
[AI Enrichment] Generating image 1/4 for: <product_name>
...
[WhatsApp Webhook] Enrichment completed for draft: <draft_id>
```

### Step 4: Verify in Admin Dashboard

1. Navigate to: `http://localhost:3000/admin/whatsapp-drafts`
2. You should see:
   - New draft in the list
   - Status: "Enriched" (after AI processing completes)
   - Product name, images, pricing
   - Detected niche

### Step 5: Test Approval Flow

1. Click on a draft to view details
2. Review/edit:
   - Product name
   - Description
   - Pricing
   - Niche selection
3. Click **"Approve & Create Product"**
4. Verify:
   - Draft status changes to "Approved"
   - New product appears in `/admin/products`
   - Product is ready for Content Generator

## Testing Without Real WhatsApp (Mock Testing)

### Create a Test Script

Create `backend/scripts/test-whatsapp-webhook.ts`:

```typescript
import axios from 'axios';

const WEBHOOK_URL = 'http://localhost:5000/api/whatsapp/webhook';

// Mock WhatsApp webhook payload
const mockPayload = {
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
              phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID || 'test_id',
            },
            messages: [
              {
                from: '919876543210',
                id: `wamid.test_${Date.now()}`,
                timestamp: Math.floor(Date.now() / 1000).toString(),
                type: 'image',
                image: {
                  id: 'test_image_id',
                  mime_type: 'image/jpeg',
                  sha256: 'test_hash',
                  caption: 'Product Name: Test Product\nCost Price: 500',
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

async function testWebhook() {
  try {
    console.log('Sending test webhook payload...');
    const response = await axios.post(WEBHOOK_URL, mockPayload);
    console.log('Response:', response.status, response.data);
  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testWebhook();
```

Run it:
```bash
cd backend
npx ts-node scripts/test-whatsapp-webhook.ts
```

## Common Issues & Solutions

### Issue 1: Webhook Verification Fails
- **Check**: `WHATSAPP_VERIFY_TOKEN` matches Meta dashboard
- **Check**: Server is accessible from internet (use ngrok for local testing)

### Issue 2: Images Not Downloading
- **Check**: `WHATSAPP_ACCESS_TOKEN` is valid
- **Check**: Token has `whatsapp_business_messaging` permission
- **Check**: Media ID is valid (use real WhatsApp message)

### Issue 3: AI Enrichment Not Working
- **Check**: `OPENAI_API_KEY` is set
- **Check**: OpenAI account has credits
- **Check**: DALL-E 3 access (may require GPT-4 subscription)

### Issue 4: Drafts Not Appearing
- **Check**: Feature flag `ENABLE_WHATSAPP_BULK_ADD=true`
- **Check**: Database connection
- **Check**: Server logs for errors

## Local Testing with ngrok

For local development, use ngrok to expose your server:

```bash
# Install ngrok: https://ngrok.com/download
ngrok http 5000

# Use the HTTPS URL in Meta webhook configuration:
# https://abc123.ngrok.io/api/whatsapp/webhook
```

## Testing Checklist

- [ ] Webhook verification works (GET)
- [ ] Webhook receives messages (POST)
- [ ] Images download successfully
- [ ] Drafts are created in database
- [ ] AI enrichment runs (name, description, niche, images)
- [ ] Drafts appear in admin dashboard
- [ ] Draft editing works
- [ ] Draft approval creates Product
- [ ] Approved products appear in Products list
- [ ] Rejected drafts are marked correctly
- [ ] Bulk approve works
- [ ] Filters work (status, needs_review)
- [ ] Pagination works

## Next Steps After Testing

1. **Monitor Logs**: Watch for errors during real usage
2. **Check Database**: Verify drafts are stored correctly
3. **Test Edge Cases**:
   - Duplicate messages (should be ignored)
   - Invalid format (should handle gracefully)
   - Missing images (should mark needs_review)
   - AI failures (should fallback appropriately)

4. **Performance Testing**:
   - Multiple simultaneous messages
   - Large image files
   - Slow AI responses

