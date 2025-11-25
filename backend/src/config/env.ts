import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

const envSchema = Joi.object({
  PORT: Joi.number().default(5000),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  MONGODB_URI: Joi.string().uri().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('1d'),
  CORS_ORIGIN: Joi.string().uri().required(),
  ENCRYPTION_KEY: Joi.string().base64().length(44).required(), // 32 bytes base64 = 44 chars
  SHOPIFY_API_KEY: Joi.string().allow('').optional(),
  SHOPIFY_API_SECRET: Joi.string().allow('').optional(),
  SHOPIFY_SCOPES: Joi.string().default('write_products,read_products,write_themes,read_themes'),
  SHOPIFY_REDIRECT_URI: Joi.string().uri().allow('').optional(),
  SHOPIFY_SHOP: Joi.string().allow('').optional(),
  SHOPIFY_ACCESS_TOKEN: Joi.string().allow('').optional(),
  // Email configuration (optional - if not set, emails will be logged only)
  SMTP_HOST: Joi.string().allow('').optional(),
  SMTP_PORT: Joi.string().allow('').optional(),
  SMTP_SECURE: Joi.string().valid('true', 'false').allow('').optional(),
  SMTP_USER: Joi.string().allow('').optional(),
  SMTP_PASS: Joi.string().allow('').optional(),
  SMTP_FROM: Joi.string().email().allow('').optional(),
  SMTP_FROM_NAME: Joi.string().allow('').optional(),
  SMTP_IGNORE_TLS: Joi.string().valid('true', 'false').allow('').optional(),
  CONTACT_EMAIL: Joi.string().email().allow('').optional(),
  // Razorpay configuration
  RAZORPAY_KEY_ID: Joi.string().required(),
  RAZORPAY_KEY_SECRET: Joi.string().required(),
  RAZORPAY_WEBHOOK_SECRET: Joi.string().required(),
  // OpenAI configuration (optional - fallback will be used if not set)
  OPENAI_API_KEY: Joi.string().allow('').optional(),
  OPENAI_MODEL: Joi.string().default('gpt-3.5-turbo'),
  AI_CACHE_TTL: Joi.string().default('3600'),
}).unknown();

const { error, value } = envSchema.validate(process.env);

if (error) {
  console.error('❌ Invalid environment configuration:');
  console.error(error.details.map((d) => `  - ${d.message}`).join('\n'));
  process.exit(1);
}

export const config = {
  port: value.PORT,
  nodeEnv: value.NODE_ENV,
  mongoUri: value.MONGODB_URI,
  jwtSecret: value.JWT_SECRET,
  jwtExpiresIn: value.JWT_EXPIRES_IN,
  corsOrigin: value.CORS_ORIGIN,
  encryptionKey: value.ENCRYPTION_KEY,
  shopify: {
    apiKey: value.SHOPIFY_API_KEY || '',
    apiSecret: value.SHOPIFY_API_SECRET || '',
    redirectUri: value.SHOPIFY_REDIRECT_URI || 'http://localhost:5000/api/shopify/callback',
    scopes: value.SHOPIFY_SCOPES,
    accessToken: value.SHOPIFY_ACCESS_TOKEN || '',
    shop: value.SHOPIFY_SHOP || '',
  },
  razorpay: {
    keyId: value.RAZORPAY_KEY_ID,
    keySecret: value.RAZORPAY_KEY_SECRET,
    webhookSecret: value.RAZORPAY_WEBHOOK_SECRET,
  },
  openai: {
    apiKey: value.OPENAI_API_KEY || '',
    model: value.OPENAI_MODEL || 'gpt-3.5-turbo',
    cacheTtl: parseInt(value.AI_CACHE_TTL || '3600', 10),
  },
};

