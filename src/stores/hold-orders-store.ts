import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, OrderType } from "@/types";

export interface HeldOrder {
  id: string;
  orderType: OrderType;
  tableNumber: number | null;
  customerName: string | null;
  customerPhone: string | null;
  customerId: string | null;
  items: CartItem[];
  discountType: "percentage" | "fixed" | null;
  discountValue: number;
  orderNotes: string;
  heldAt: string; // ISO string
}

interface HoldOrdersState {
  orders: HeldOrder[];
  add: (order: Omit<HeldOrder, "id" | "heldAt">) => string;
  remove: (id: string) => void;
  get: (id: string) => HeldOrder | undefined;
  clearAll: () => void;
}

export const useHoldOrdersStore = create<HoldOrdersState>()(
  persist(
    (set, get) => ({
      orders: [],

      add: (order) => {
        const id = `hold-${Date.now()}`;
        const heldOrder: HeldOrder = {
          ...order,
          id,
          heldAt: new Date().toISOString(),
        };
        set((state) => ({ orders: [...state.orders, heldOrder] }));
        return id;
      },

      remove: (id) =>
        set((state) => ({ orders: state.orders.filter((o) => o.id !== id) })),

      get: (id) => get().orders.find((o) => o.id === id),

      clearAll: () => set({ orders: [] }),
    }),
    {
      name: "koffee-hold-orders",
    },
  ),
);
