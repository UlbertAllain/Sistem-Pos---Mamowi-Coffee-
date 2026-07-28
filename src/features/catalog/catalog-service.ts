import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { MAX_PRODUCT_PRICE, MAX_STOCK_QUANTITY } from '@/lib/constraints';
import { authenticatedJson } from '@/lib/api/client';
import { getFirebaseDb } from '@/lib/firebase/client';
import { firestorePaths } from '@/lib/firebase/paths';
import { createId } from '@/lib/id';
import { z } from 'zod';
import type { Category, Product } from '@/types/models';
import {
  categoryInputSchema,
  productInputSchema,
  type CategoryInput,
  type ProductInput,
} from './catalog-schemas';

const categoryDocumentSchema = z.object({
  storeId: z.string().min(1),
  name: z.string().min(1).max(80),
  isActive: z.boolean(),
  createdAt: z.unknown().optional(),
  updatedAt: z.unknown().optional(),
});

const productDocumentSchema = z.object({
  storeId: z.string().min(1),
  categoryId: z.string().min(1).max(120),
  name: z.string().min(1).max(120),
  sku: z.string().min(1).max(50),
  price: z.number().int().nonnegative().max(MAX_PRODUCT_PRICE),
  stockQty: z.number().int().nonnegative().max(MAX_STOCK_QUANTITY),
  trackStock: z.boolean(),
  isActive: z.boolean(),
  imageUrl: z.string().max(1000),
  createdAt: z.unknown().optional(),
  updatedAt: z.unknown().optional(),
});

function mapCategory(id: string, data: Record<string, unknown>): Category {
  const parsed = categoryDocumentSchema.parse(data);
  return {
    id,
    ...parsed,
    createdAt: parsed.createdAt as Category['createdAt'],
    updatedAt: parsed.updatedAt as Category['updatedAt'],
  };
}

function mapProduct(id: string, data: Record<string, unknown>): Product {
  const parsed = productDocumentSchema.parse(data);
  return {
    id,
    ...parsed,
    createdAt: parsed.createdAt as Product['createdAt'],
    updatedAt: parsed.updatedAt as Product['updatedAt'],
  };
}

export function subscribeCategories(
  storeId: string,
  callback: (categories: Category[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const q = query(collection(getFirebaseDb(), firestorePaths.categories(storeId)), orderBy('name'));
  return onSnapshot(q, (snapshot) => {
    try {
      callback(snapshot.docs.map((item) => mapCategory(item.id, item.data())));
    } catch (cause) {
      onError(cause instanceof Error ? cause : new Error('Data kategori tidak valid.'));
    }
  }, onError);
}

export function subscribeProducts(
  storeId: string,
  callback: (products: Product[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const q = query(collection(getFirebaseDb(), firestorePaths.products(storeId)), orderBy('name'));
  return onSnapshot(q, (snapshot) => {
    try {
      callback(snapshot.docs.map((item) => mapProduct(item.id, item.data())));
    } catch (cause) {
      onError(cause instanceof Error ? cause : new Error('Data produk tidak valid.'));
    }
  }, onError);
}

export async function saveCategory(
  storeId: string,
  input: CategoryInput,
  categoryId?: string,
): Promise<string> {
  const parsed = categoryInputSchema.parse(input);
  const db = getFirebaseDb();

  if (categoryId) {
    await updateDoc(doc(db, firestorePaths.category(storeId, categoryId)), {
      ...parsed,
      storeId,
      updatedAt: serverTimestamp(),
    });
    return categoryId;
  }

  const ref = await addDoc(collection(db, firestorePaths.categories(storeId)), {
    ...parsed,
    storeId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function archiveCategory(storeId: string, categoryId: string): Promise<void> {
  const db = getFirebaseDb();
  const usedProducts = await getDocs(query(
    collection(db, firestorePaths.products(storeId)),
    where('categoryId', '==', categoryId),
    where('isActive', '==', true),
    limit(1),
  ));

  if (!usedProducts.empty) {
    throw new Error('Kategori masih dipakai produk aktif. Arsipkan atau pindahkan produknya terlebih dahulu.');
  }

  await updateDoc(doc(db, firestorePaths.category(storeId, categoryId)), {
    isActive: false,
    updatedAt: serverTimestamp(),
  });
}

export async function saveProduct(
  storeId: string,
  input: ProductInput,
  productId?: string,
): Promise<string> {
  const parsed = productInputSchema.parse(input);
  const db = getFirebaseDb();

  if (productId) {
    const editableFields = {
      categoryId: parsed.categoryId,
      name: parsed.name,
      price: parsed.price,
      trackStock: parsed.trackStock,
      isActive: parsed.isActive,
      imageUrl: parsed.imageUrl,
    };
    await updateDoc(doc(db, firestorePaths.product(storeId, productId)), {
      ...editableFields,
      storeId,
      updatedAt: serverTimestamp(),
    });
    return productId;
  }

  const id = createId('prd');
  const productRef = doc(db, firestorePaths.product(storeId, id));
  const indexRef = doc(db, firestorePaths.skuIndex(storeId, parsed.sku));
  await runTransaction(db, async (transaction) => {
    const indexSnapshot = await transaction.get(indexRef);
    if (indexSnapshot.exists()) throw new Error('SKU sudah digunakan produk lain.');

    transaction.set(productRef, {
      ...parsed,
      storeId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    transaction.set(indexRef, {
      storeId,
      sku: parsed.sku,
      productId: id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
  return id;
}

export async function archiveProduct(storeId: string, productId: string): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), firestorePaths.product(storeId, productId)), {
    isActive: false,
    updatedAt: serverTimestamp(),
  });
}

export async function adjustProductStock(
  storeId: string,
  productId: string,
  nextQty: number,
  note: string,
): Promise<void> {
  await authenticatedJson<{ ok: true }>('/api/stock-adjustments', {
    method: 'POST',
    body: JSON.stringify({ storeId, productId, nextQty, note }),
  });
}
