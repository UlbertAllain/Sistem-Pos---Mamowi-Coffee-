'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { getErrorMessage } from '@/lib/errors';
import type { Order } from '@/types/models';
import { loadOrdersByRange, subscribeRecentOrders } from './orders-service';

interface RecentOrdersSnapshot {
  storeId: string | null;
  orders: Order[];
  loaded: boolean;
  error: string | null;
}

interface RangeOrdersSnapshot {
  requestKey: string;
  orders: Order[];
  error: string | null;
}

const initialRecentSnapshot: RecentOrdersSnapshot = {
  storeId: null,
  orders: [],
  loaded: false,
  error: null,
};

export function useRecentOrders(storeId: string | undefined, resultLimit = 100) {
  const [snapshot, setSnapshot] = useState<RecentOrdersSnapshot>(initialRecentSnapshot);

  useEffect(() => {
    if (!storeId) return;

    return subscribeRecentOrders(
      storeId,
      (orders) => {
        setSnapshot({ storeId, orders, loaded: true, error: null });
      },
      (cause) => {
        setSnapshot({
          storeId,
          orders: [],
          loaded: true,
          error: getErrorMessage(cause),
        });
      },
      resultLimit,
    );
  }, [resultLimit, storeId]);

  if (!storeId || snapshot.storeId !== storeId) {
    return { orders: [], loading: Boolean(storeId), error: null };
  }

  return {
    orders: snapshot.orders,
    loading: !snapshot.loaded,
    error: snapshot.error,
  };
}

export function useOrdersRange(storeId: string | undefined, from: Date, to: Date) {
  const [reloadToken, setReloadToken] = useState(0);
  const [snapshot, setSnapshot] = useState<RangeOrdersSnapshot>({
    requestKey: '',
    orders: [],
    error: null,
  });
  const fromTime = from.getTime();
  const toTime = to.getTime();
  const requestKey = `${storeId ?? ''}:${fromTime}:${toTime}:${reloadToken}`;

  useEffect(() => {
    if (!storeId) return;

    let active = true;
    loadOrdersByRange(storeId, new Date(fromTime), new Date(toTime))
      .then((orders) => {
        if (active) setSnapshot({ requestKey, orders, error: null });
      })
      .catch((cause) => {
        if (active) {
          setSnapshot({
            requestKey,
            orders: [],
            error: getErrorMessage(cause),
          });
        }
      });

    return () => {
      active = false;
    };
  }, [fromTime, requestKey, storeId, toTime]);

  const reload = useCallback(() => setReloadToken((value) => value + 1), []);
  const current = snapshot.requestKey === requestKey;

  return useMemo(() => ({
    orders: current ? snapshot.orders : [],
    loading: Boolean(storeId) && !current,
    error: current ? snapshot.error : null,
    reload,
  }), [current, reload, snapshot.error, snapshot.orders, storeId]);
}
