import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { User, IUser } from '../models/User';
import { Store } from '../models/Store';
import { createError } from '../middleware/errorHandler';
import { logAudit } from '../utils/auditLogger';
import { logInternalStoreActivity } from '../services/internalStoreLogger';
import { config } from '../config/env';

interface InstagramProvisionRequest {
  email?: string;
  mobile?: string;
  name?: string;
  storeName: string;
  currency?: 'INR' | 'USD' | 'EUR' | 'GBP';
  instagramUserId: string;
  instagramUsername?: string;
}

export const createUserAndStoreFromInstagram = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const body: InstagramProvisionRequest = req.body || {};
    const { email, mobile, name, storeName, currency, instagramUserId, instagramUsername } = body;

    if (!storeName || !storeName.trim()) {
      throw createError('storeName is required', 400);
    }

    if (!instagramUserId || !instagramUserId.trim()) {
      throw createError('instagramUserId is required', 400);
    }

    if (!email && !mobile) {
      throw createError('Either email or mobile is required', 400);
    }

    const normalizedEmail = email ? email.trim().toLowerCase() : undefined;
    const normalizedMobile = mobile ? mobile.replace(/\s+/g, '') : undefined;

    let existingUser: IUser | null = null;

    if (normalizedEmail) {
      existingUser = await User.findOne({ email: normalizedEmail });
    }

    if (!existingUser && normalizedMobile) {
      existingUser = await User.findOne({ mobile: normalizedMobile });
    }

    // Handle deleted accounts similarly to register: allow re-use by hard-deleting
    if (existingUser && existingUser.deletedAt) {
      await User.findByIdAndDelete(existingUser._id);
      existingUser = null;
    }

    let user: IUser;
    let tempPassword: string | undefined;
    let existingUserFlag = false;

    if (existingUser) {
      user = existingUser;
      existingUserFlag = true;
    } else {
      tempPassword = crypto.randomBytes(8).toString('hex');
      const hashedPassword = await bcrypt.hash(tempPassword, 8);

      const userData: Partial<IUser> = {
        name: name?.trim() || instagramUsername || 'Instagram User',
        email: normalizedEmail,
        mobile: normalizedMobile,
        password: hashedPassword,
        role: 'user',
      };

      try {
        user = await User.create(userData as IUser);
      } catch (error: any) {
        if (error.code === 11000) {
          const duplicateField = error.keyPattern?.email
            ? 'email'
            : error.keyPattern?.mobile
            ? 'mobile'
            : 'field';
          throw createError(
            `${duplicateField === 'email' ? 'Email' : duplicateField === 'mobile' ? 'Mobile number' : 'Field'} already registered`,
            409
          );
        }
        throw error;
      }

      await logAudit({
        userId: user._id as mongoose.Types.ObjectId,
        action: 'USER_REGISTER',
        success: true,
        details: {
          email: user.email,
          mobile: user.mobile,
          role: user.role,
          signupSource: 'instagram_dm',
          instagramUserId,
          instagramUsername,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
    }

    // Find or create internal store (one per user for now)
    let store = await Store.findOne({ owner: user._id });
    let existingStoreFlag = false;

    if (store) {
      existingStoreFlag = true;
    } else {
      // Generate base slug from storeName or instagramUsername
      const baseSlugSource = storeName || instagramUsername || 'store';
      const baseSlug = baseSlugSource
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50) || 'store';

      let finalSlug = baseSlug;
      let counter = 1;

      // Ensure slug uniqueness
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const existing = await Store.findOne({ slug: finalSlug });
        if (!existing) {
          break;
        }
        finalSlug = `${baseSlug}-${counter}`;
        counter += 1;
      }

      store = new Store({
        owner: user._id,
        name: storeName.trim(),
        slug: finalSlug,
        currency: currency || 'INR',
        status: 'active',
        razorpayAccountStatus: 'not_connected',
        settings: {
          testMode: true,
        },
      });

      await store.save();

      const storeId = (store._id as any).toString();

      await logInternalStoreActivity({
        storeId,
        userId: (user._id as any).toString(),
        action: 'INTERNAL_STORE_CREATED',
        entityType: 'store',
        entityId: storeId,
        changes: {
          after: {
            name: store.name,
            slug: store.slug,
            currency: store.currency,
            status: store.status,
          },
        },
        success: true,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
    }

    const baseFrontendUrl = (config.corsOrigin || 'http://localhost:3000').replace(/\/+$/, '');
    const storeUrl = `${baseFrontendUrl}/storefront/${store.slug}`;
    const loginIdentifier = user.email || user.mobile || '';

    res.status(200).json({
      success: true,
      existingUser: existingUserFlag,
      existingStore: existingStoreFlag,
      storeSlug: store.slug,
      storeUrl,
      loginIdentifier,
      // Only include tempPassword when a new user was created
      ...(tempPassword ? { tempPassword } : {}),
    });
  } catch (error) {
    next(error);
  }
};

