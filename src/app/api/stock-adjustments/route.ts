import { FieldValue } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { MAX_STOCK_QUANTITY } from '@/lib/constraints';
import { getAdminDb } from '@/lib/firebase/admin';
import { firestorePaths } from '@/lib/firebase/paths';
import { requireStoreUser } from '@/lib/server/auth';
import { HttpError, jsonError } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const inputSchema = z.object({
  storeId: z.string().min(1).max(120),
  productId: z.string().min(1).max(120),
  nextQty: z.number().int().nonnegative().max(MAX_STOCK_QUANTITY),
  note: z.string().trim().min(3).max(300),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const input = inputSchema.parse(await request.json());
    const actor = await requireStoreUser(request, input.storeId, ['owner', 'manager']);
    const db = getAdminDb();
    const productRef = db.doc(firestorePaths.product(input.storeId, input.productId));
    const movementRef = db.collection(firestorePaths.stockMovements(input.storeId)).doc();

    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(productRef);
      if (!snapshot.exists) throw new HttpError('Produk tidak ditemukan.', 404);
      const beforeQty = Number(snapshot.data()?.stockQty);
      if (!Number.isSafeInteger(beforeQty) || beforeQty < 0) throw new HttpError('Data stok produk tidak valid.');
      if (beforeQty === input.nextQty) throw new HttpError('Stok tidak berubah.');

      transaction.update(productRef, {
        stockQty: input.nextQty,
        lastAdjustmentId: movementRef.id,
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.set(movementRef, {
        storeId: input.storeId,
        productId: input.productId,
        type: 'adjustment',
        quantityDelta: input.nextQty - beforeQty,
        beforeQty,
        afterQty: input.nextQty,
        actorId: actor.uid,
        note: input.note,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({ ok: true });
  } catch (cause) {
    return jsonError(cause);
  }
}
