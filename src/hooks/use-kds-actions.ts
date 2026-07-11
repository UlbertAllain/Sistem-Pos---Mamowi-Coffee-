import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/constants";
import type { CartItem } from "@/types";
import { toast } from "sonner";

export function useKDSActions() {
  // Update status satu item (pending -> preparing -> ready)
  const updateItemStatus = async (
    orderId: string,
    itemId: string,
    newStatus: CartItem["status"],
  ) => {
    try {
      const orderRef = doc(db, COLLECTIONS.orders, orderId);
      const orderSnap = await getDoc(orderRef);
      if (!orderSnap.exists()) return;

      const orderData = orderSnap.data();
      const updatedItems = orderData.items.map((item: CartItem) =>
        item.id === itemId ? { ...item, status: newStatus } : item,
      );

      await updateDoc(orderRef, {
        items: updatedItems,
        status: "paid",
      });
    } catch (error) {
      console.error("Update item error:", error);
      toast.error("Gagal update status");
    }
  };

  // Manual complete seluruh order
  const completeOrder = async (orderId: string) => {
    try {
      const orderRef = doc(db, COLLECTIONS.orders, orderId);
      const orderSnap = await getDoc(orderRef);
      if (!orderSnap.exists()) return;

      const orderData = orderSnap.data();
      const servedItems = (orderData.items || []).map((item: CartItem) => ({
        ...item,
        status: item.status === "cancelled" ? item.status : "served",
      }));

      await updateDoc(orderRef, {
        items: servedItems,
        status: "completed",
        "timestamps.completedAt": serverTimestamp(),
      });
    } catch (error) {
      console.error("Complete order error:", error);
      toast.error("Gagal menyelesaikan pesanan");
    }
  };

  return { updateItemStatus, completeOrder };
}
