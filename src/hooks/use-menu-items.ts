import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/constants";
import type { MenuItem } from "@/types";

export function useMenuItems(categoryId?: string | null) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const constraints = [where("isActive", "==", true)];
    if (categoryId) {
      constraints.push(where("categoryId", "==", categoryId));
    }

    const q = query(collection(db, COLLECTIONS.menuItems), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as MenuItem)
          .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
        setItems(data);
        setIsLoading(false);
      },
      (error) => {
        console.error("Menu items listener error:", error);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [categoryId]);

  return { items, isLoading };
}
