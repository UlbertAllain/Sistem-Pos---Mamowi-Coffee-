'use client';

import { useEffect, useState } from 'react';
import { getErrorMessage } from '@/lib/errors';
import type { PaymentMethod, StoreSettings } from '@/types/models';
import { subscribePaymentMethods, subscribeSettings } from './settings-service';

export function useSettings(storeId: string | undefined) {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [methodsLoaded, setMethodsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId) return;
    setError(null);
    setSettingsLoaded(false);
    setMethodsLoaded(false);
    const handleError = (cause: Error) => {
      setError(getErrorMessage(cause));
      setSettingsLoaded(true);
      setMethodsLoaded(true);
    };
    const stopSettings = subscribeSettings(storeId, (value) => {
      setSettings(value);
      setSettingsLoaded(true);
    }, handleError);
    const stopMethods = subscribePaymentMethods(storeId, (value) => {
      setPaymentMethods(value);
      setMethodsLoaded(true);
    }, handleError);
    return () => {
      stopSettings();
      stopMethods();
    };
  }, [storeId]);

  return {
    settings,
    paymentMethods,
    loading: !settingsLoaded || !methodsLoaded,
    error,
  };
}
