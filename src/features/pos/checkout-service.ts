import { z } from 'zod';

import { authenticatedJson } from '@/lib/api/client';
import { MAX_DISTINCT_PRODUCTS_PER_ORDER, MAX_ITEM_QUANTITY, MAX_TRANSACTION_AMOUNT } from '@/lib/constraints';
import type { OrderItem } from '@/types/models';
import type { CartLine } from './cart-domain';

const checkoutResultSchema = z.object({
  orderId: z.string().min(1),
  orderNumber: z.string().min(1),
  sequence: z.number().int().positive(),
  storeId: z.string().min(1),
  cashierId: z.string().min(1),
  cashierName: z.string().min(1),
  items: z.array(z.object({
    productId: z.string().min(1), sku: z.string(), name: z.string().min(1),
    unitPrice: z.number().int(), quantity: z.number().int().positive(),
    lineTotal: z.number().int(), trackStock: z.boolean(),
  })),
  subtotal: z.number().int(),
  discount: z.number().int(),
  total: z.number().int(),
  paid: z.number().int(),
  change: z.number().int(),
  paymentMethodId: z.string().min(1),
  paymentMethodName: z.string().min(1),
});

const checkoutInputSchema = z.object({
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

export interface CheckoutInput {
  orderId: string;
  storeId: string;
  items: CartLine[];
  discount: number;
  paid: number;
  paymentMethodId: string;
}

export interface CheckoutResult {
  orderId: string;
  orderNumber: string;
  sequence: number;
  storeId: string;
  cashierId: string;
  cashierName: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  change: number;
  paymentMethodId: string;
  paymentMethodName: string;
}

export async function checkout(rawInput: CheckoutInput): Promise<CheckoutResult> {
  const input = checkoutInputSchema.parse(rawInput);
  const payload = await authenticatedJson<unknown>('/api/checkout', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return checkoutResultSchema.parse(payload) as CheckoutResult;
}
