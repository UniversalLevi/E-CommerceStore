import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { config } from '../config/env';
import { createError } from '../middleware/errorHandler';
import { WhatsAppProductDraft } from '../models/WhatsAppProductDraft';
import {
  isWhatsAppEnabled,
  extractMessages,
  validateMessagePayload,
  parseProductText,
  downloadWhatsAppMedia,
  generateProfitMargin,
  calculateFinalPrice,
  WhatsAppWebhookPayload,
  WhatsAppMessage,
} from '../services/whatsappIntakeService';
import { enrichProduct } from '../services/aiEnrichmentService';
import mongoose from 'mongoose';

// In-memory store for pending image messages (awaiting text)
// Maps phone number -> { imageId, messageId, timestamp }
const pendingImages = new Map<string, {
  imageId: string;
  messageId: string;
  timestamp: number;
}>();

// Clean up old pending images (older than 5 minutes)
const PENDING_TIMEOUT = 5 * 60 * 1000;

function cleanupPendingImages() {
  const now = Date.now();
  for (const [phone, data] of pendingImages.entries()) {
    if (now - data.timestamp > PENDING_TIMEOUT) {
      pendingImages.delete(phone);
    }
  }
}

// Run cleanup every minute
setInterval(cleanupPendingImages, 60 * 1000);

/**
 * Verify webhook (GET request from Meta)
 * GET /api/whatsapp/webhook
 */
export const verifyWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!isWhatsAppEnabled()) {
      throw createError('WhatsApp feature is not enabled', 503);
    }

    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === config.whatsapp.verifyToken) {
      console.log('[WhatsApp Webhook] Verification successful');
      return res.status(200).send(challenge);
    }

    console.warn('[WhatsApp Webhook] Verification failed - invalid token');
    res.status(403).json({ error: 'Verification failed' });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle incoming webhook (POST request from Meta)
 * POST /api/whatsapp/webhook
 */
export const handleWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!isWhatsAppEnabled()) {
      // Acknowledge but don't process
      return res.sendStatus(200);
    }

    const payload = req.body as WhatsAppWebhookPayload;
    
    // Always respond 200 quickly to Meta
    res.sendStatus(200);

    // Process messages asynchronously
    const messages = extractMessages(payload);
    
    for (const message of messages) {
      try {
        await processMessage(message);
      } catch (error: any) {
        console.error(`[WhatsApp Webhook] Error processing message ${message.id}:`, error.message);
      }
    }
  } catch (error: any) {
    console.error('[WhatsApp Webhook] Error:', error.message);
    // Still return 200 to prevent Meta from retrying
    if (!res.headersSent) {
      res.sendStatus(200);
    }
  }
};

/**
 * Process a single WhatsApp message
 */
async function processMessage(message: WhatsAppMessage): Promise<void> {
  const validation = validateMessagePayload(message);
  if (!validation.valid) {
    console.warn(`[WhatsApp Webhook] Invalid message: ${validation.error}`);
    return;
  }

  // Check for duplicate message
  const existingDraft = await WhatsAppProductDraft.findOne({
    whatsapp_message_id: message.id,
  });
  
  if (existingDraft) {
    console.log(`[WhatsApp Webhook] Duplicate message ignored: ${message.id}`);
    return;
  }

  const senderPhone = message.from;

  if (message.type === 'image') {
    // Store pending image, waiting for text
    pendingImages.set(senderPhone, {
      imageId: message.image!.id,
      messageId: message.id,
      timestamp: Date.now(),
    });

    // If caption is provided with the image, process immediately
    if (message.image?.caption) {
      const parsedData = parseProductText(message.image.caption);
      if (parsedData) {
        await createProductDraft(
          message.id,
          message.image.id,
          parsedData.productName,
          parsedData.costPrice
        );
        pendingImages.delete(senderPhone);
      }
    }

    console.log(`[WhatsApp Webhook] Image received from ${senderPhone}, waiting for text`);
    return;
  }

  if (message.type === 'text') {
    const textBody = message.text!.body;
    const parsedData = parseProductText(textBody);

    if (!parsedData) {
      console.log(`[WhatsApp Webhook] Could not parse product data from text`);
      return;
    }

    // Check for pending image from this sender
    const pendingImage = pendingImages.get(senderPhone);
    
    if (!pendingImage) {
      console.log(`[WhatsApp Webhook] Text received but no pending image from ${senderPhone}`);
      return;
    }

    // Create draft with both image and text data
    await createProductDraft(
      pendingImage.messageId,
      pendingImage.imageId,
      parsedData.productName,
      parsedData.costPrice
    );

    pendingImages.delete(senderPhone);
    console.log(`[WhatsApp Webhook] Product draft created for: ${parsedData.productName}`);
  }
}

/**
 * Create a product draft and run AI enrichment
 */
async function createProductDraft(
  messageId: string,
  imageMediaId: string,
  productName: string,
  costPrice: number
): Promise<void> {
  let originalImageUrl: string;
  
  try {
    // Download image from WhatsApp
    console.log(`[WhatsApp Webhook] Downloading image: ${imageMediaId}`);
    originalImageUrl = await downloadWhatsAppMedia(imageMediaId);
  } catch (error: any) {
    console.error(`[WhatsApp Webhook] Failed to download image: ${error.message}`);
    // Try to download a realistic placeholder from picsum
    try {
      const placeholderResponse = await axios.get(`https://picsum.photos/800/800?random=${Date.now()}`, {
        responseType: 'arraybuffer',
        timeout: 5000,
      });
      
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'whatsapp');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      const filename = `wa-placeholder-${Date.now()}.jpg`;
      originalImageUrl = `/uploads/whatsapp/${filename}`;
      fs.writeFileSync(path.join(uploadsDir, filename), placeholderResponse.data);
    } catch (placeholderError: any) {
      console.warn(`[WhatsApp Webhook] Failed to get placeholder image: ${placeholderError.message}`);
      // Final fallback: use a simple placeholder
      originalImageUrl = `/uploads/whatsapp/placeholder-${Date.now()}.png`;
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'whatsapp');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const placeholderPng = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );
      fs.writeFileSync(path.join(uploadsDir, path.basename(originalImageUrl)), placeholderPng);
    }
  }

  try {
    // Calculate pricing
    const profitMargin = generateProfitMargin();
    const shippingFee = 80;
    const finalPrice = calculateFinalPrice(costPrice, profitMargin, shippingFee);

    // Create initial draft
    const draft = new WhatsAppProductDraft({
      whatsapp_message_id: messageId,
      original_image_url: originalImageUrl,
      original_name: productName,
      cost_price: costPrice,
      profit_margin: profitMargin,
      shipping_fee: shippingFee,
      final_price: finalPrice,
      status: 'incoming',
      needs_review: false,
    });

    await draft.save();
    console.log(`[WhatsApp Webhook] Draft created: ${draft._id}`);

    // Run AI enrichment asynchronously
    runEnrichmentAsync(draft._id as mongoose.Types.ObjectId, productName, originalImageUrl);
  } catch (error: any) {
    console.error('[WhatsApp Webhook] Failed to create draft:', error.message);
    throw error;
  }
}

/**
 * Run AI enrichment in the background
 */
async function runEnrichmentAsync(
  draftId: mongoose.Types.ObjectId,
  productName: string,
  imageUrl: string
): Promise<void> {
  try {
    console.log(`[WhatsApp Webhook] Starting enrichment for draft: ${draftId}`);
    
    const enrichmentResult = await enrichProduct(productName, imageUrl);

    // Ensure we have a niche - if detection failed, get the first available niche
    let nicheId = enrichmentResult.detected_niche_id;
    if (!nicheId) {
      const { Niche } = await import('../models/Niche');
      const firstNiche = await Niche.findOne({ active: true, deleted: false });
      if (firstNiche) {
        nicheId = (firstNiche._id as any).toString();
        console.log(`[WhatsApp Webhook] Using fallback niche for draft ${draftId}: ${firstNiche.name}`);
      }
    }

    // Update the draft with enrichment results
    const updateData: any = {
      ai_name: enrichmentResult.ai_name,
      ai_description: enrichmentResult.ai_description,
      generated_image_urls: enrichmentResult.generated_image_urls,
      images_ai_generated: enrichmentResult.generated_image_urls.length > 0,
      status: 'enriched',
      needs_review: enrichmentResult.needs_review,
      error_log: enrichmentResult.errors,
    };

    // Always set niche if we have one
    if (nicheId) {
      updateData.detected_niche = new mongoose.Types.ObjectId(nicheId);
    }

    await WhatsAppProductDraft.findByIdAndUpdate(draftId, updateData);

    console.log(`[WhatsApp Webhook] Enrichment completed for draft: ${draftId}`);
  } catch (error: any) {
    console.error(`[WhatsApp Webhook] Enrichment failed for draft ${draftId}:`, error.message);
    
    // Try to assign a default niche even on failure
    try {
      const { Niche } = await import('../models/Niche');
      const firstNiche = await Niche.findOne({ active: true, deleted: false });
      
      const updateData: any = {
        needs_review: true,
        status: 'enriched',
        $push: { error_log: `Enrichment failed: ${error.message}` },
      };

      if (firstNiche) {
        updateData.detected_niche = firstNiche._id;
      }

      await WhatsAppProductDraft.findByIdAndUpdate(draftId, updateData);
    } catch (fallbackError: any) {
      console.error(`[WhatsApp Webhook] Failed to set fallback niche: ${fallbackError.message}`);
    }
  }
}

