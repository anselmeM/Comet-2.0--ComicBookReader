'use client';

import { useState } from 'react';
import { getErrorMessage } from '@/lib/errors';
import { useNotification } from '@/components/atoms/Toast';

export function useSubscription() {
  const [isLoading, setIsLoading] = useState(false);
  const { triggerNotification } = useNotification();

  const handleCheckout = async (interval: 'monthly' | 'annual' = 'monthly') => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/stripe/checkout?interval=${interval}`);
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to initiate checkout');
      }
    } catch (error) {
      triggerNotification(getErrorMessage(error), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePortal = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/stripe/portal');
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to open billing portal');
      }
    } catch (error) {
      triggerNotification(getErrorMessage(error), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleCheckout,
    handlePortal,
    isLoading,
  };
}
