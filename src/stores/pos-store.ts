import { create } from "zustand";
import type {
  CartItem,
  Customer,
  OrderType,
  RecipeItem,
  SelectedModifier,
  Variant,
} from "@/types";
import { generateId } from "@/lib/utils";

interface POSState {
  // Order meta
  orderType: OrderType;
  tableNumber: number | null;
  customerName: string | null;
  customerPhone: string | null;
  customerId: string | null;
  selectedCustomer: Customer | null;

  // Cart
  items: CartItem[];

  // Status
  status: "new" | "held" | "payment";
  heldAt: Date | null;

  // Discount
  discountType: "percentage" | "fixed" | null;
  discountValue: number;

  // Loyalty
  redeemedPoints: number;

  // Notes
  orderNotes: string;

  // Actions — Order Meta
  setOrderType: (type: OrderType) => void;
  setTableNumber: (num: number | null) => void;
  setCustomer: (
    name: string | null,
    phone: string | null,
    id: string | null,
    customer?: Customer | null,
  ) => void;

  // Actions — Cart
  addItem: (params: {
    menuItemId: string;
    name: string;
    image?: string;
    recipe?: RecipeItem[];
    basePrice: number;
    variant: Variant | null;
    modifiers: SelectedModifier[];
    notes: string;
    quantity: number;
  }) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  incrementItem: (itemId: string) => void;
  decrementItem: (itemId: string) => void;

  // Actions — Discount
  setDiscount: (type: "percentage" | "fixed" | null, value: number) => void;
  clearDiscount: () => void;

  // Actions — Loyalty
  setRedeemedPoints: (pts: number) => void;

  // Actions — Status
  setHeld: () => void;
  setRecalled: () => void;
  setPayment: () => void;

  // Actions — Reset
  clearCart: () => void;
  resetAll: () => void;

  // Getters
  getSubtotal: () => number;
  getDiscountAmount: () => number;
  getTaxAmount: (taxRate: number, taxMode: "included" | "added") => number;
  getTotal: (taxRate: number, taxMode: "included" | "added") => number;
  getItemCount: () => number;
}

const initialState = {
  orderType: "dine-in" as OrderType,
  tableNumber: null,
  customerName: null,
  customerPhone: null,
  customerId: null,
  selectedCustomer: null as Customer | null,
  items: [] as CartItem[],
  status: "new" as const,
  heldAt: null as Date | null,
  discountType: null as "percentage" | "fixed" | null,
  discountValue: 0,

  redeemedPoints: 0,

  orderNotes: "",
};

export const usePOSStore = create<POSState>()((set, get) => ({
  ...initialState,

  // ===== Order Meta =====
  setOrderType: (orderType) =>
    set({ orderType, tableNumber: orderType === "dine-in" ? null : null }),

  setTableNumber: (tableNumber) => set({ tableNumber }),

  setCustomer: (customerName, customerPhone, customerId, selectedCustomer) =>
    set({
      customerName,
      customerPhone,
      customerId,
      selectedCustomer: selectedCustomer ?? null,
      redeemedPoints: selectedCustomer ? get().redeemedPoints : 0,
    }),

  // ===== Cart =====
  addItem: ({
    menuItemId,
    name,
    image,
    recipe,
    basePrice,
    variant,
    modifiers,
    notes,
    quantity,
  }) => {
    const variantPrice = variant?.priceAdjustment || 0;
    const modifiersPrice = modifiers.reduce(
      (sum, m) => sum + m.priceAdjustment,
      0,
    );
    const unitPrice = basePrice + variantPrice + modifiersPrice;
    const subtotal = unitPrice * quantity;

    const newItem: CartItem = {
      id: generateId("ci"),
      menuItemId,
      name,
      image,
      recipe,
      variant,
      modifiers,
      notes,
      quantity,
      unitPrice,
      subtotal,
      status: "pending",
    };

    set((state) => ({ items: [...state.items, newItem] }));
  },

  updateItemQuantity: (itemId, quantity) => {
    if (quantity <= 0) {
      set((state) => ({ items: state.items.filter((i) => i.id !== itemId) }));
      return;
    }
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId
          ? { ...item, quantity, subtotal: item.unitPrice * quantity }
          : item,
      ),
    }));
  },

  removeItem: (itemId) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== itemId) })),

  incrementItem: (itemId) => {
    const { items } = get();
    const item = items.find((i) => i.id === itemId);
    if (item) get().updateItemQuantity(itemId, item.quantity + 1);
  },

  decrementItem: (itemId) => {
    const { items } = get();
    const item = items.find((i) => i.id === itemId);
    if (item) get().updateItemQuantity(itemId, item.quantity - 1);
  },

  // ===== Discount =====
  setDiscount: (discountType, discountValue) =>
    set({ discountType, discountValue }),
  clearDiscount: () => set({ discountType: null, discountValue: 0 }),

  // ===== Loyalty =====
  setRedeemedPoints: (pts) => set({ redeemedPoints: Math.max(0, pts) }),

  // ===== Status =====
  setHeld: () => set({ status: "held", heldAt: new Date() }),
  setRecalled: () => set({ status: "new", heldAt: null }),
  setPayment: () => set({ status: "payment" }),

  // ===== Reset =====
  clearCart: () =>
    set({
      ...initialState,
      orderType: get().orderType, // keep current order type
    }),

  resetAll: () => set(initialState),

  // ===== Getters =====
  getSubtotal: () => get().items.reduce((sum, item) => sum + item.subtotal, 0),

  getDiscountAmount: () => {
    const { discountType, discountValue } = get();
    const subtotal = get().getSubtotal();
    if (!discountType || discountValue <= 0) return 0;
    if (discountType === "percentage")
      return Math.round((subtotal * discountValue) / 100);
    return Math.min(discountValue, subtotal);
  },

  getTaxAmount: (taxRate, taxMode) => {
    const subtotal = get().getSubtotal();
    const discountAmount = get().getDiscountAmount();
    const afterDiscount = subtotal - discountAmount;

    if (taxMode === "included") {
      return Math.round((afterDiscount * taxRate) / (100 + taxRate));
    }
    return Math.round((afterDiscount * taxRate) / 100);
  },

  getTotal: (taxRate, taxMode) => {
    const subtotal = get().getSubtotal();
    const discountAmount = get().getDiscountAmount();
    const taxAmount = get().getTaxAmount(taxRate, taxMode);

    if (taxMode === "included") {
      return subtotal - discountAmount; // tax already included
    }
    return subtotal - discountAmount + taxAmount;
  },

  getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
}));
