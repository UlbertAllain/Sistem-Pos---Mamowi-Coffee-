import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/constants";
import type { Order } from "@/types";

function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getEndOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function useReports(startDate: Date, endDate: Date) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      try {
        const q = query(
          collection(db, COLLECTIONS.orders),
          where(
            "timestamps.paidAt",
            ">=",
            Timestamp.fromDate(getStartOfDay(startDate)),
          ),
          where(
            "timestamps.paidAt",
            "<=",
            Timestamp.fromDate(getEndOfDay(endDate)),
          ),
          where("status", "in", ["paid", "completed"]),
        );

        const snap = await getDocs(q);
        const data = snap.docs.map((d) => {
          const raw = d.data();
          return {
            id: d.id,
            ...raw,
            timestamps: {
              createdAt: raw.timestamps?.createdAt?.toDate() || new Date(),
              heldAt: raw.timestamps?.heldAt?.toDate() || null,
              recalledAt: raw.timestamps?.recalledAt?.toDate() || null,
              paidAt: raw.timestamps?.paidAt?.toDate() || null,
              completedAt: raw.timestamps?.completedAt?.toDate() || null,
              voidedAt: raw.timestamps?.voidedAt?.toDate() || null,
            },
          } as Order;
        });

        data.sort((a, b) => {
          const timeA = a.timestamps.paidAt?.getTime() || 0;
          const timeB = b.timestamps.paidAt?.getTime() || 0;
          return timeB - timeA;
        });

        setOrders(data);
      } catch (error) {
        console.error("Reports error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetch();
  }, [startDate, endDate]);

  return { orders, isLoading };
}
