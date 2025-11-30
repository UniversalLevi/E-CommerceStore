import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to check if user has an active subscription
 * Returns subscription status and helper functions
 */
export function useSubscription() {
  const { user } = useAuth();

  const hasActiveSubscription = (): boolean => {
    if (!user) return false;
    
    // Lifetime users always have access
    if (user.isLifetime) return true;
    
    // Check if plan is set and not expired
    if (!user.plan || !user.planExpiresAt) return false;
    
    // Check if expiration date is in the future
    return new Date(user.planExpiresAt) > new Date();
  };

  const getSubscriptionStatus = (): 'active' | 'expired' | 'none' => {
    if (!user) return 'none';
    
    if (user.isLifetime) return 'active';
    
    if (!user.plan || !user.planExpiresAt) return 'none';
    
    return new Date(user.planExpiresAt) > new Date() ? 'active' : 'expired';
  };

  return {
    hasActiveSubscription: hasActiveSubscription(),
    subscriptionStatus: getSubscriptionStatus(),
    isLifetime: user?.isLifetime || false,
    planExpiresAt: user?.planExpiresAt,
  };
}

