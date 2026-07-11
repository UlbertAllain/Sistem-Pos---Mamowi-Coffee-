import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/constants";
import type { StockTransaction } from "@/types";

export function useStockTransactions(
  ingredientId: string | null,
  limitCount: number = 50,
) {
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const baseConstraints = [orderBy("createdAt", "desc"), limit(limitCount)];
    const q = ingredientId
      ? query(
          collection(db, COLLECTIONS.stockTransactions),
          where("ingredientId", "==", ingredientId),
          ...baseConstraints,
        )
      : query(
          collection(db, COLLECTIONS.stockTransactions),
          ...baseConstraints,
        );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map(
          (d) =>
            ({
              id: d.id,
              ...d.data(),
              createdAt: d.data().createdAt?.toDate() || new Date(),
            }) as StockTransaction,
        );
        setTransactions(data);
        setIsLoading(false);
      },
      () => setIsLoading(false),
    );

    return () => unsubscribe();
  }, [ingredientId, limitCount]);

  return { transactions, isLoading };
}
