import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/constants";
import type { ActivityLog } from "@/types";

export function useActivityLog(limitCount: number = 100) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, COLLECTIONS.activityLogs),
      orderBy("createdAt", "desc"),
      limit(limitCount),
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
            }) as ActivityLog,
        );
        setLogs(data);
        setIsLoading(false);
      },
      () => setIsLoading(false),
    );

    return () => unsubscribe();
  }, [limitCount]);

  return { logs, isLoading };
}
