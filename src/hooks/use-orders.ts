import {
  doc,
  increment,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS, STORE_ID } from "@/constants";
import type { Order, CartItem, PaymentRecord, OrderType } from "@/types";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

async function generateOrderNumber(): Promise<number> {
  const counterRef = doc(db, COLLECTIONS.counters, "order_number");

  return await runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterRef);
    if (!counterSnap.exists()) {
      transaction.set(counterRef, { value: 1 });
      return 1;
    }
    const newValue = counterSnap.data().value + 1;
    transaction.update(counterRef, { value: newValue });
    return newValue;
  });
}

export function useCreateOrder() {
  const { user } = useAuthStore();

  const create = async (params: {
    orderType: OrderType;
    tableNumber: number | null;
    customerName?: string | null;
    customerPhone?: string | null;
    customerId?: string | null;
    items: CartItem[];
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    discountType: "percentage" | "fixed" | null;
    discountValue: number;
    discountAmount: number;
    totalAmount: number;
    payments: PaymentRecord[];
    loyaltyPointsEarned: number;
    loyaltyPointsRedeemed: number;
    loyaltyCardNumber?: string;
    notes?: string;
    shiftId?: string;
  }): Promise<Order | null> => {
    if (!user) {
      toast.error("Tidak ada user yang login");
      return null;
    }

    try {
      const orderNumber = await generateOrderNumber();
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
      const orderId = `ORD-${dateStr}-${String(orderNumber).padStart(4, "0")}`;

      const orderData = {
        id: orderId,
        storeId: STORE_ID,
        orderNumber,
        orderType: params.orderType,
        tableNumber: params.tableNumber,
        customerName: params.customerName || null,
        customerPhone: params.customerPhone || null,
        customerId: params.customerId || null,
        items: params.items.map((item) => ({
          ...item,
          status: "pending",
        })),
        subtotal: params.subtotal,
        taxRate: params.taxRate,
        taxAmount: params.taxAmount,
        discountType: params.discountType,
        discountValue: params.discountValue,
        discountAmount: params.discountAmount,
        totalAmount: params.totalAmount,
        status: "paid",
        paymentStatus: "paid",
        payments: params.payments,
        cashierId: user.uid,
        cashierName: user.displayName,
        shiftId: params.shiftId || "",
        loyaltyPointsEarned: params.loyaltyPointsEarned,
        loyaltyPointsRedeemed: params.loyaltyPointsRedeemed,
        loyaltyCardNumber: params.loyaltyCardNumber || null,
        timestamps: {
          createdAt: now,
          heldAt: null,
          recalledAt: null,
          paidAt: now,
          completedAt: null,
          voidedAt: null,
        },
        voidReason: null,
        voidApprovedBy: null,
        notes: params.notes || null,
      };

      await setDoc(doc(db, COLLECTIONS.orders, orderId), orderData);

      if (params.shiftId) {
        await setDoc(
          doc(db, COLLECTIONS.shifts, params.shiftId),
          {
            totalTransactions: increment(1),
            totalRevenue: increment(params.totalAmount),
            expectedCash: increment(
              params.payments
                .filter((payment) => payment.method === "cash")
                .reduce((sum, payment) => sum + payment.amount, 0),
            ),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      }

      toast.success(`Pesanan #${orderId} berhasil dibuat!`);
      return orderData as unknown as Order;
    } catch (error) {
      console.error("Create order error:", error);
      toast.error("Gagal membuat pesanan");
      return null;
    }
  };

  return { create };
}
