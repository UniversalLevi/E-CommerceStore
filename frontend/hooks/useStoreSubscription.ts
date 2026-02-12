import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

/**
 * Hook to check if user has an active store subscription
 * Returns store subscription status and helper functions
 */
export function useStoreSubscription() {
  const { user } = useAuth();
  const [storeSubscription, setStoreSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStoreSubscription = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getCurrentStorePlan();
      if (response.success && response.data) {
        setStoreSubscription(response.data);
      } else {
        setStoreSubscription(null);
      }
    } catch (error) {
      console.error('Error fetching store subscription:', error);
      setStoreSubscription(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchStoreSubscription();
    } else {
      setLoading(false);
    }
  }, [user, fetchStoreSubscription]);

  const hasActiveStoreSubscription = (): boolean => {
    if (!storeSubscription) return false;
    
    // Free plan is always active
    if (storeSubscription.planCode === 'stores_basic_free') {
      return true;
    }
    
    // Check if subscription is active and not expired
    if (storeSubscription.status === 'active' || storeSubscription.status === 'manually_granted') {
      if (storeSubscription.endDate) {
        return new Date(storeSubscription.endDate) > new Date();
      }
      // No end date means active
      return true;
    }
    
    return false;
  };

  const getStoreSubscriptionStatus = (): 'active' | 'expired' | 'none' => {
    if (!storeSubscription) return 'none';
    
    if (storeSubscription.planCode === 'stores_basic_free') {
      return 'active';
    }
    
    if (storeSubscription.status === 'active' || storeSubscription.status === 'manually_granted') {
      if (storeSubscription.endDate) {
        return new Date(storeSubscription.endDate) > new Date() ? 'active' : 'expired';
      }
      return 'active';
    }
    
    return 'expired';
  };

  return {
    hasActiveStoreSubscription: hasActiveStoreSubscription(),
    storeSubscriptionStatus: getStoreSubscriptionStatus(),
    storeSubscription,
    loading,
    refreshStoreSubscription: fetchStoreSubscription,
  };
}
