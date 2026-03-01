import OpenAI from 'openai';
import { Store } from '../models/Store';
import { StoreProduct } from '../models/StoreProduct';
import { StorePluginConfig } from '../models/StorePluginConfig';
import mongoose from 'mongoose';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

function sanitize(text: string): string {
  if (!text) return '';
  return text.replace(/<script.*?>.*?<\/script>/gi, '').replace(/<[^>]+>/g, '').trim();
}

export async function getStoreChatReply(
  storeId: string,
  slug: string,
  userMessage: string,
  conversationId?: string
): Promise<{ reply: string; error?: string }> {
  const store = await Store.findOne({ _id: storeId, status: 'active' }).lean();
  if (!store) return { reply: '', error: 'Store not found' };

  const pluginConfig = await StorePluginConfig.findOne({
    storeId: new mongoose.Types.ObjectId(storeId),
    pluginSlug: 'ai-chatbot',
    isConfigured: true,
  }).lean();
  if (!pluginConfig?.config?.enabled) return { reply: '', error: 'Chat is not enabled' };

  const greeting = (pluginConfig.config.greeting as string) || `Hello! How can I help you with ${(store as any).name} today?`;
  const faq = (pluginConfig.config.faq as string) || '';
  const policy = (pluginConfig.config.policy as string) || '';

  const products = await StoreProduct.find({ storeId, status: 'active' })
    .select('title description basePrice')
    .limit(30)
    .lean();
  const productSummary = products
    .map((p: any) => `- ${p.title}: ${(p.description || '').slice(0, 120)}... Price: ₹${((p.basePrice || 0) / 100).toFixed(0)}`)
    .join('\n');

  const systemContent = `You are a helpful customer support assistant for the online store "${(store as any).name}". 
Answer briefly and helpfully about products, orders, shipping, and store policy. Do not make up product names or prices; use only the information below.
If you don't know something, say so and suggest the customer contact the store.

Store: ${(store as any).name}
Currency: ${(store as any).currency || 'INR'}

Products (sample):
${productSummary || 'No products listed yet.'}
${faq ? `\nFAQ / Common info:\n${faq}` : ''}
${policy ? `\nStore policy:\n${policy}` : ''}`;

  const client = getOpenAIClient();
  if (!client) {
    return { reply: "I'm sorry, the chat service is temporarily unavailable. Please email the store or try again later." };
  }

  try {
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemContent },
        { role: 'user', content: sanitize(userMessage).slice(0, 1000) },
      ],
      max_tokens: 400,
      temperature: 0.5,
    });
    const reply = response.choices?.[0]?.message?.content?.trim() || "I couldn't generate a response. Please try again.";
    return { reply: sanitize(reply) };
  } catch (err: any) {
    console.error('Storefront chat OpenAI error:', err?.message);
    return { reply: "I'm sorry, I couldn't process that. Please try again or contact the store directly." };
  }
}
