'use client';

import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '@/lib/errors';
import type { Order } from '@/types/models';
import { loadOrdersByRange, subscribeRecentOrders } from './orders-service';

export function useRecentOrders(storeId: string | undefined, resultLimit = 100) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId) return;
    setLoading(true);
    setError(null);
    return subscribeRecentOrders(storeId, (items) => {
      setOrders(items);
      setLoading(false);
    }, (cause) => {
      setError(getErrorMessage(cause));
      setLoading(false);
    }, resultLimit);
  }, [resultLimit, storeId]);

  return { orders, loading, error };
}

export function useOrdersRange(storeId: string | undefined, from: Date, to: Date) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const fromTime = from.getTime();
  const toTime = to.getTime();

  useEffect(() => {
    if (!storeId) return;
    let active = true;
    setLoading(true);
    setError(null);
    loadOrdersByRange(storeId, new Date(fromTime), new Date(toTime))
      .then((items) => {
        if (!active) return;
        setOrders(items);
        setLoading(false);
      })
      .catch((cause) => {
        if (!active) return;
        setError(getErrorMessage(cause));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fromTime, reloadToken, storeId, toTime]);

  const reload = useCallback(() => setReloadToken((value) => value + 1), []);
  return { orders, loading, error, reload };
}
