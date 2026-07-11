import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { STORE_ID } from "@/constants";
import type { StoreSettings } from "@/types";

export function useSettings() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const ref = doc(db, "stores", STORE_ID, "settings", "main");
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setSettings({ id: snap.id, ...snap.data() } as StoreSettings);
        }
        setIsLoading(false);
      },
      () => setIsLoading(false),
    );

    return () => unsubscribe();
  }, []);

  return { settings, isLoading };
}
