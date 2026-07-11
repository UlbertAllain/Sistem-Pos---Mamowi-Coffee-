import { useState } from "react";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/constants";
import type { Customer } from "@/types";
import { toast } from "sonner";

export function useCustomerLookup() {
  const [results, setResults] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const search = async (queryStr: string): Promise<Customer[]> => {
    if (!queryStr || queryStr.length < 2) {
      setResults([]);
      return [];
    }

    setIsSearching(true);
    try {
      const ref = collection(db, COLLECTIONS.customers);
      const byPhone = query(ref, where("phone", "==", queryStr), limit(5));
      const byName = query(
        ref,
        where("name", ">=", queryStr),
        where("name", "<=", queryStr + "\uf8ff"),
        limit(10),
      );

      const [phoneSnap, nameSnap] = await Promise.all([
        getDocs(byPhone),
        getDocs(byName),
      ]);

      const mapDoc = (snap: Awaited<typeof phoneSnap>) =>
        snap.docs.map((d) => {
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

      const phoneResults = mapDoc(phoneSnap);
      const nameResults = mapDoc(nameSnap);

      // Dedupe by id
      const seen = new Set<string>();
      const merged = [...phoneResults, ...nameResults].filter((c) => {
        if (seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
      });

      setResults(merged);
      return merged;
    } catch (error) {
      console.error("Customer lookup error:", error);
      toast.error("Gagal mencari pelanggan");
      setResults([]);
      return [];
    } finally {
      setIsSearching(false);
    }
  };

  const clear = () => setResults([]);

  return { results, isSearching, search, clear };
}
