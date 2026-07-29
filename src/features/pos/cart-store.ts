'use client';

import { create } from 'zustand';
import { MAX_DISTINCT_PRODUCTS_PER_ORDER, MAX_ITEM_QUANTITY } from '@/lib/constraints';
import type { Product } from '@/types/models';
import type { CartLine } from './cart-domain';

interface CartState {
  lines: CartLine[];
  discount: number;
  addProduct: (product: Product) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeProduct: (productId: string) => void;
  setDiscount: (discount: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  lines: [],
  discount: 0,
  addProduct: (product) => set((state) => {
    const existing = state.lines.find((line) => line.productId === product.id);
    const nextQuantity = (existing?.quantity ?? 0) + 1;
    if (nextQuantity > MAX_ITEM_QUANTITY || (product.trackStock && nextQuantity > product.stockQty)) return state;

    return {
      lines: existing
        ? state.lines.map((line) => line.productId === product.id
          ? { ...line, quantity: nextQuantity }
          : line)
        : state.lines.length >= MAX_DISTINCT_PRODUCTS_PER_ORDER
          ? state.lines
          : [...state.lines, { productId: product.id, quantity: 1 }],
    };
  }),
  setQuantity: (productId, quantity) => set((state) => ({
    lines: quantity <= 0
      ? state.lines.filter((line) => line.productId !== productId)
      : state.lines.map((line) => line.productId === productId ? { ...line, quantity: Math.min(MAX_ITEM_QUANTITY, quantity) } : line),
  })),
  removeProduct: (productId) => set((state) => ({
    lines: state.lines.filter((line) => line.productId !== productId),
  })),
  setDiscount: (discount) => set({ discount: Number.isSafeInteger(discount) && discount >= 0 ? discount : 0 }),
  clear: () => set({ lines: [], discount: 0 }),
}));
