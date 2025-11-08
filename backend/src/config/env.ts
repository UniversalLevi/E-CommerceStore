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
};

