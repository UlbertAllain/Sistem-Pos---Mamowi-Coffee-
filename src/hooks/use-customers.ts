import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/constants";
import type { Customer } from "@/types";

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, COLLECTIONS.customers),
      orderBy("loyalty.lastVisit", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => {
          const raw = d.data();
          return {
            id: d.id,
            ...raw,
            loyalty: {
              ...raw.loyalty,
              joinDate: raw.loyalty?.joinDate?.toDate() || new Date(),
              lastVisit: raw.loyalty?.lastVisit?.toDate() || null,
            },
            createdAt: raw.createdAt?.toDate() || new Date(),
            updatedAt: raw.updatedAt?.toDate() || new Date(),
          } as Customer;
        });
        setCustomers(data);
        setIsLoading(false);
      },
      () => setIsLoading(false),
    );

    return () => unsubscribe();
  }, []);

  return { customers, isLoading };
}
