'use client';

import { useEffect, useState } from 'react';

import { getErrorMessage } from '@/lib/errors';
import type { PaymentMethod, StoreSettings } from '@/types/models';
import { subscribePaymentMethods, subscribeSettings } from './settings-service';

interface SettingsSnapshot {
  storeId: string | null;
  settings: StoreSettings | null;
  paymentMethods: PaymentMethod[];
  settingsLoaded: boolean;
  methodsLoaded: boolean;
  settingsError: string | null;
  methodsError: string | null;
}

const initialSnapshot: SettingsSnapshot = {
  storeId: null,
  settings: null,
  paymentMethods: [],
  settingsLoaded: false,
  methodsLoaded: false,
  settingsError: null,
  methodsError: null,
};

export function useSettings(storeId: string | undefined) {
  const [snapshot, setSnapshot] = useState<SettingsSnapshot>(initialSnapshot);

  useEffect(() => {
    if (!storeId) return;

    const stopSettings = subscribeSettings(
      storeId,
      (settings) => {
        setSnapshot((current) => ({
          ...(current.storeId === storeId ? current : initialSnapshot),
          storeId,
          settings,
          settingsLoaded: true,
          settingsError: null,
        }));
      },
      (cause) => {
        setSnapshot((current) => ({
          ...(current.storeId === storeId ? current : initialSnapshot),
          storeId,
          settingsLoaded: true,
          settingsError: getErrorMessage(cause),
        }));
      },
    );

    const stopMethods = subscribePaymentMethods(
      storeId,
      (paymentMethods) => {
        setSnapshot((current) => ({
          ...(current.storeId === storeId ? current : initialSnapshot),
          storeId,
          paymentMethods,
          methodsLoaded: true,
          methodsError: null,
        }));
      },
      (cause) => {
        setSnapshot((current) => ({
          ...(current.storeId === storeId ? current : initialSnapshot),
          storeId,
          methodsLoaded: true,
          methodsError: getErrorMessage(cause),
        }));
      },
    );

    return () => {
      stopSettings();
      stopMethods();
    };
  }, [storeId]);

  if (!storeId || snapshot.storeId !== storeId) {
    return {
      settings: null,
      paymentMethods: [],
      loading: Boolean(storeId),
      error: null,
    };
  }

  return {
    settings: snapshot.settings,
    paymentMethods: snapshot.paymentMethods,
    loading: !snapshot.settingsLoaded || !snapshot.methodsLoaded,
    error: snapshot.settingsError ?? snapshot.methodsError,
  };
}
