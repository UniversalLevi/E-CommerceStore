import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/shopify-store-builder',
  jwtSecret: (process.env.JWT_SECRET || 'your-secret-key') as string,
  jwtExpiresIn: (process.env.JWT_EXPIRES_IN || '1d') as string,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  shopify: {
    apiKey: process.env.SHOPIFY_API_KEY || '',
    apiSecret: process.env.SHOPIFY_API_SECRET || '',
    redirectUri: process.env.SHOPIFY_REDIRECT_URI || 'http://localhost:5000/api/shopify/callback',
    scopes: process.env.SHOPIFY_SCOPES || 'write_products,read_products,write_themes,read_themes',
  },
};

