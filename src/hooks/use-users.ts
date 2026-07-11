import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/constants";
import type { User } from "@/types";

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, COLLECTIONS.users),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => {
          const raw = d.data();
          return {
            ...raw,
            uid: raw.uid || d.id,
            email: raw.email || "",
            displayName: raw.displayName || "Tanpa Nama",
            role: raw.role || "viewer",
            storeId: raw.storeId || "default",
            isActive: raw.isActive ?? true,
            lastLogin: raw.lastLogin?.toDate() || null,
            createdAt: raw.createdAt?.toDate() || new Date(),
            updatedAt: raw.updatedAt?.toDate() || new Date(),
          } as unknown as User;
        });
        setUsers(data);
        setIsLoading(false);
      },
      () => setIsLoading(false),
    );

    return () => unsubscribe();
  }, []);

  return { users, isLoading };
}
