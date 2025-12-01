import connectDatabase from './db';
import User from './models/User';

/**
 * Check if user has an active subscription
 * Note: Admins always return true regardless of subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  try {
    await connectDatabase();
    const user = await User.findById(userId).select('plan planExpiresAt isLifetime role').lean();
    
    if (!user) {
      return false;
    }
    
    // Admins always have access regardless of subscription
    if (user.role === 'admin') {
      return true;
    }
    
    // Lifetime users always have access
    if (user.isLifetime) {
      return true;
    }
    
    // Check if plan is set and not expired
    if (!user.plan || !user.planExpiresAt) {
      return false;
    }
    
    // Check if expiration date is in the future
    return new Date(user.planExpiresAt) > new Date();
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
}

/**
 * Middleware function to check subscription in Next.js API routes
 * Returns null if subscription is active, otherwise returns error response
 * Note: Admins are always allowed access
 */
export async function requireSubscription(userId: string): Promise<{ error: string; status: number } | null> {
  const hasSubscription = await hasActiveSubscription(userId);
  
  if (!hasSubscription) {
    return {
      error: 'Subscription required. Please upgrade to continue.',
      status: 403,
    };
  }
  
  return null;
}

