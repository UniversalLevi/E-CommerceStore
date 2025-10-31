import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { config } from '../config/env';
import { User } from '../models/User';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

// Initiate Shopify OAuth flow
export const initiateAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { shop, token } = req.query;

    if (!token) {
      throw createError('Authentication token required', 401);
    }

    if (!shop) {
      throw createError('Shopify shop parameter required', 400);
    }

    // Verify the token and get user ID
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };

    // Store user ID in session/state for callback
    const state = Buffer.from(
      JSON.stringify({ userId: decoded.userId })
    ).toString('base64');

    // Build Shopify OAuth URL
    const shopifyAuthUrl = `https://${shop}/admin/oauth/authorize?client_id=${
      config.shopify.apiKey
    }&scope=${config.shopify.scopes}&redirect_uri=${
      config.shopify.redirectUri
    }&state=${state}`;

    res.redirect(shopifyAuthUrl);
  } catch (error) {
    next(error);
  }
};

// Handle Shopify OAuth callback
export const handleCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code, shop, state } = req.query;

    if (!code || !shop || !state) {
      throw createError('Invalid callback parameters', 400);
    }

    // Decode state to get user ID
    const stateData = JSON.parse(
      Buffer.from(state as string, 'base64').toString()
    );
    const userId = stateData.userId;

    // Exchange code for access token
    const tokenResponse = await axios.post(
      `https://${shop}/admin/oauth/access_token`,
      {
        client_id: config.shopify.apiKey,
        client_secret: config.shopify.apiSecret,
        code,
      }
    );

    const { access_token, scope } = tokenResponse.data;

    // Update user with Shopify credentials
    await User.findByIdAndUpdate(userId, {
      shopifyAccessToken: access_token,
      shopifyShop: shop,
    });

    // Redirect to frontend dashboard
    res.redirect(`${config.corsOrigin}/dashboard?shopify=connected`);
  } catch (error: any) {
    console.error('Shopify OAuth error:', error.response?.data || error.message);
    res.redirect(`${config.corsOrigin}/dashboard?shopify=error`);
  }
};

// Check Shopify connection status
export const getConnectionStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const connected = !!(
      req.user.shopifyAccessToken && req.user.shopifyShop
    );

    res.status(200).json({
      success: true,
      connected,
      shop: connected ? req.user.shopifyShop : null,
    });
  } catch (error) {
    next(error);
  }
};

// Disconnect Shopify account
export const disconnectShopify = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    await User.findByIdAndUpdate(req.user._id, {
      $unset: { shopifyAccessToken: '', shopifyShop: '' },
    });

    res.status(200).json({
      success: true,
      message: 'Shopify account disconnected',
    });
  } catch (error) {
    next(error);
  }
};

