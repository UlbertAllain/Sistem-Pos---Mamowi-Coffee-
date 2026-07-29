import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { z } from 'zod';

import { MAX_DISCOUNT_AMOUNT, MAX_STOCK_QUANTITY } from '@/lib/constraints';
import { getFirebaseDb } from '@/lib/firebase/client';
import { firestorePaths } from '@/lib/firebase/paths';
import { createId } from '@/lib/id';
import type { PaymentMethod, StoreSettings } from '@/types/models';

export const settingsInputSchema = z.object({
  storeName: z.string().trim().min(1).max(120),
  address: z.string().trim().max(300),
  phone: z.string().trim().max(30),
  receiptFooter: z.string().trim().max(300),
  maxDiscount: z.number().int().nonnegative().max(MAX_DISCOUNT_AMOUNT),
  lowStockThreshold: z.number().int().nonnegative().max(MAX_STOCK_QUANTITY),
});

export const paymentMethodInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  type: z.enum(['cash', 'non_cash']),
  isActive: z.boolean(),
});

export type SettingsInput = z.infer<typeof settingsInputSchema>;
export type PaymentMethodInput = z.infer<typeof paymentMethodInputSchema>;

const settingsDocumentSchema = settingsInputSchema.extend({
  storeId: z.string().min(1),
  createdAt: z.unknown().optional(),
  updatedAt: z.unknown().optional(),
});

const paymentMethodDocumentSchema = paymentMethodInputSchema.extend({
  storeId: z.string().min(1),
  createdAt: z.unknown().optional(),
  updatedAt: z.unknown().optional(),
});

function mapSettings(data: Record<string, unknown>, storeId: string): StoreSettings {
  const parsed = settingsDocumentSchema.parse({
    storeId,
    storeName: data.storeName ?? 'Mamowi Coffee',
    address: data.address ?? '',
    phone: data.phone ?? '',
    receiptFooter: data.receiptFooter ?? 'Terima kasih.',
    maxDiscount: data.maxDiscount ?? 0,
    lowStockThreshold: data.lowStockThreshold ?? 5,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  });
  return {
    id: 'general',
    ...parsed,
    createdAt: parsed.createdAt as StoreSettings['createdAt'],
    updatedAt: parsed.updatedAt as StoreSettings['updatedAt'],
  };
}

function mapPaymentMethod(id: string, data: Record<string, unknown>): PaymentMethod {
  const parsed = paymentMethodDocumentSchema.parse(data);
  return {
    id,
    ...parsed,
    createdAt: parsed.createdAt as PaymentMethod['createdAt'],
    updatedAt: parsed.updatedAt as PaymentMethod['updatedAt'],
  };
}

export function subscribeSettings(
  storeId: string,
  callback: (settings: StoreSettings) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(doc(getFirebaseDb(), firestorePaths.settings(storeId)), (snapshot) => {
    try {
      callback(mapSettings(snapshot.exists() ? snapshot.data() : {}, storeId));
    } catch (cause) {
      onError(cause instanceof Error ? cause : new Error('Pengaturan toko tidak valid.'));
    }
  }, onError);
}

export function subscribePaymentMethods(
  storeId: string,
  callback: (methods: PaymentMethod[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const q = query(collection(getFirebaseDb(), firestorePaths.paymentMethods(storeId)), orderBy('name'));
  return onSnapshot(q, (snapshot) => {
    try {
      callback(snapshot.docs.map((item) => mapPaymentMethod(item.id, item.data())));
    } catch (cause) {
      onError(cause instanceof Error ? cause : new Error('Metode pembayaran tidak valid.'));
    }
  }, onError);
}

export async function saveSettings(storeId: string, input: SettingsInput): Promise<void> {
  const parsed = settingsInputSchema.parse(input);
  const db = getFirebaseDb();
  const settingsRef = doc(db, firestorePaths.settings(storeId));

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(settingsRef);
    transaction.set(settingsRef, {
      ...parsed,
      storeId,
      ...(snapshot.exists() ? {} : { createdAt: serverTimestamp() }),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });
}

export async function savePaymentMethod(
  storeId: string,
  input: PaymentMethodInput,
  methodId?: string,
): Promise<string> {
  const parsed = paymentMethodInputSchema.parse(input);
  const db = getFirebaseDb();
  const duplicates = await getDocs(query(
    collection(db, firestorePaths.paymentMethods(storeId)),
    where('name', '==', parsed.name),
    limit(2),
  ));
  if (duplicates.docs.some((item) => item.id !== methodId)) {
    throw new Error('Nama metode pembayaran sudah digunakan.');
  }
  if (methodId) {
    await updateDoc(doc(db, firestorePaths.paymentMethod(storeId, methodId)), {
      ...parsed,
      storeId,
      updatedAt: serverTimestamp(),
    });
    return methodId;
  }

  const id = createId('pay');
  await setDoc(doc(db, firestorePaths.paymentMethod(storeId, id)), {
    ...parsed,
    storeId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return id;
}
