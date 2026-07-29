import { NextResponse } from 'next/server';
import { z } from 'zod';

import { MAX_DISTINCT_PRODUCTS_PER_ORDER, MAX_ITEM_QUANTITY, MAX_TRANSACTION_AMOUNT } from '@/lib/constraints';
import { requireStoreUser } from '@/lib/server/auth';
import { jsonError } from '@/lib/server/http';
import { runServerCheckout } from '@/features/pos/checkout-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const checkoutSchema = z.object({
  orderId: z.string().min(1).max(120),
  storeId: z.string().min(1).max(120),
  paymentMethodId: z.string().min(1).max(120),
  discount: z.number().int().nonnegative().max(MAX_TRANSACTION_AMOUNT),
  paid: z.number().int().nonnegative().max(MAX_TRANSACTION_AMOUNT),
  items: z.array(z.object({
    productId: z.string().min(1).max(120),
    quantity: z.number().int().positive().max(MAX_ITEM_QUANTITY),
  })).min(1).max(MAX_DISTINCT_PRODUCTS_PER_ORDER),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const input = checkoutSchema.parse(await request.json());
    const actor = await requireStoreUser(request, input.storeId);
    const result = await runServerCheckout(input, actor);
    return NextResponse.json(result, { status: 200 });
  } catch (cause) {
    return jsonError(cause);
  }
}
