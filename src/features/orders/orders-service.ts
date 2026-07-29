import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { z } from 'zod';

import { MAX_ITEM_QUANTITY, MAX_TRANSACTION_AMOUNT } from '@/lib/constraints';
import { authenticatedJson } from '@/lib/api/client';
import { getFirebaseDb } from '@/lib/firebase/client';
import { firestorePaths } from '@/lib/firebase/paths';
import type { Order, OrderItem } from '@/types/models';

const orderItemSchema = z.object({
  productId: z.string().min(1),
  sku: z.string(),
  name: z.string().min(1),
  unitPrice: z.number().int().nonnegative().max(MAX_TRANSACTION_AMOUNT),
  quantity: z.number().int().positive().max(MAX_ITEM_QUANTITY),
  lineTotal: z.number().int().nonnegative().max(MAX_TRANSACTION_AMOUNT),
  trackStock: z.boolean(),
});


const orderDocumentSchema = z.object({
  schemaVersion: z.literal(2),
  sequence: z.number().int().positive(),
  storeId: z.string().min(1),
  orderNumber: z.string().min(1),
  counterId: z.string().optional(),
  stockQuantities: z.record(z.string(), z.number().int().positive()).optional(),
  cashierId: z.string().min(1),
  cashierName: z.string().min(1),
  requestFingerprint: z.string(),
  items: z.array(orderItemSchema).min(1),
  subtotal: z.number().int().nonnegative().max(MAX_TRANSACTION_AMOUNT),
  discount: z.number().int().nonnegative().max(MAX_TRANSACTION_AMOUNT),
  total: z.number().int().nonnegative().max(MAX_TRANSACTION_AMOUNT),
  paid: z.number().int().nonnegative().max(MAX_TRANSACTION_AMOUNT),
  change: z.number().int().nonnegative().max(MAX_TRANSACTION_AMOUNT),
  paymentMethodId: z.string().min(1),
  paymentMethodName: z.string().min(1),
  status: z.enum(['paid', 'voided']),
  paymentStatus: z.enum(['paid', 'refunded']),
  createdAt: z.unknown().optional(),
  updatedAt: z.unknown().optional(),
  voidReason: z.string().optional(),
  voidedBy: z.string().optional(),
  voidedAt: z.unknown().optional(),
});

function mapOrder(id: string, data: Record<string, unknown>): Order {
  const parsed = orderDocumentSchema.parse(data);
  return {
    id,
    ...parsed,
    items: parsed.items as OrderItem[],
    createdAt: parsed.createdAt as Order['createdAt'],
    updatedAt: parsed.updatedAt as Order['updatedAt'],
    voidedAt: parsed.voidedAt as Order['voidedAt'],
  };
}

export function subscribeRecentOrders(
  storeId: string,
  callback: (orders: Order[]) => void,
  onError: (error: Error) => void,
  resultLimit = 100,
): Unsubscribe {
  const q = query(
    collection(getFirebaseDb(), firestorePaths.orders(storeId)),
    where('schemaVersion', '==', 2),
    orderBy('createdAt', 'desc'),
    limit(resultLimit),
  );
  return onSnapshot(q, (snapshot) => {
    try {
      callback(snapshot.docs.map((item) => mapOrder(item.id, item.data())));
    } catch (cause) {
      onError(cause instanceof Error ? cause : new Error('Data transaksi tidak valid.'));
    }
  }, onError);
}

export async function loadOrdersByRange(
  storeId: string,
  from: Date,
  to: Date,
): Promise<Order[]> {
  const q = query(
    collection(getFirebaseDb(), firestorePaths.orders(storeId)),
    where('schemaVersion', '==', 2),
    where('createdAt', '>=', Timestamp.fromDate(from)),
    where('createdAt', '<=', Timestamp.fromDate(to)),
    orderBy('createdAt', 'desc'),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((item) => mapOrder(item.id, item.data()));
}

export async function voidOrder(storeId: string, orderId: string, reason: string): Promise<void> {
  await authenticatedJson<{ ok: true }>(`/api/orders/${encodeURIComponent(orderId)}/void`, {
    method: 'POST',
    body: JSON.stringify({ storeId, reason }),
  });
}
