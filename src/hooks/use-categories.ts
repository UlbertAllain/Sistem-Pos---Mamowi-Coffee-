import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/constants";
import type { Category } from "@/types";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, COLLECTIONS.categories),
      where("isActive", "==", true),
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as Category)
          .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
        setCategories(data);
        setIsLoading(false);
      },
      (error) => {
        console.error("Categories listener error:", error);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  return { categories, isLoading };
}
