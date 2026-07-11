import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/constants";
import type { Order } from "@/types";

export function useKDSOrders() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, COLLECTIONS.orders),
      where("status", "==", "paid"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => {
          const raw = d.data();
          const timestamps = {
            createdAt: raw.timestamps?.createdAt?.toDate() || new Date(),
            heldAt: raw.timestamps?.heldAt?.toDate() || null,
            recalledAt: raw.timestamps?.recalledAt?.toDate() || null,
            paidAt: raw.timestamps?.paidAt?.toDate() || new Date(),
            completedAt: raw.timestamps?.completedAt?.toDate() || null,
            voidedAt: raw.timestamps?.voidedAt?.toDate() || null,
          };
          return { id: d.id, ...raw, timestamps } as Order;
        });

        data.sort((a, b) => {
          const timeA = (a.timestamps.paidAt || new Date()).getTime();
          const timeB = (b.timestamps.paidAt || new Date()).getTime();
          return timeA - timeB;
        });

        setOrders(data);
      },
      (err) => {
        console.error("KDS listener error:", err);
      },
    );

    return () => unsubscribe();
  }, []);

  return { orders };
}
