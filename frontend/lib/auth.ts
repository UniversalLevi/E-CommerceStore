import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDatabase from './db';
import User from './models/User';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET || '';

export interface AuthUser {
  _id: string;
  email: string;
  role: 'user' | 'admin';
  isActive: boolean;
}

export async function getAuthenticatedUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return null;
    }

    if (!JWT_SECRET) {
      console.error('JWT_SECRET not configured');
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      passwordChangedAt?: number;
    };

    await connectDatabase();
    const user = await User.findById(decoded.userId).select('-password').lean();

    if (!user || !user.isActive) {
      return null;
    }

    // Check if password was changed after token was issued
    const tokenPasswordChangedAt = decoded.passwordChangedAt || 0;
    const userPasswordChangedAt = user.passwordChangedAt?.getTime() || 0;

    if (userPasswordChangedAt > tokenPasswordChangedAt) {
      return null;
    }

    return {
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

