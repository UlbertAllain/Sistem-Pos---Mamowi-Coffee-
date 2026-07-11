import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  getDocs,
  limit,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  where,
  doc,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS, STORE_ID } from "@/constants";
import type { Shift } from "@/types";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

function mapShift(id: string, data: DocumentData): Shift {
  return {
    id,
    ...data,
    startTime: data.startTime?.toDate() || new Date(),
    endTime: data.endTime?.toDate() || null,
  } as Shift;
}

export function useShifts() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, COLLECTIONS.shifts),
      orderBy("startTime", "desc"),
      where("status", "in", ["active", "closed"]),
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => mapShift(d.id, d.data()));
        setShifts(data);
        setIsLoading(false);
      },
      () => setIsLoading(false),
    );

    return () => unsubscribe();
  }, []);

  return { shifts, isLoading };
}

export function useActiveShift(userId?: string | null) {
  const [shift, setShift] = useState<Shift | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      queueMicrotask(() => {
        setShift(null);
        setIsLoading(false);
      });
      return;
    }

    const q = query(
      collection(db, COLLECTIONS.shifts),
      where("status", "==", "active"),
      where("userId", "==", userId),
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs
          .map((d) => mapShift(d.id, d.data()))
          .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
        setShift(data[0] || null);
        setIsLoading(false);
      },
      () => setIsLoading(false),
    );

    return () => unsubscribe();
  }, [userId]);

  return { shift, isLoading };
}

export function useShiftActions() {
  const { user } = useAuthStore();

  const openShift = async (params: {
    openingCash: number;
    notes?: string;
  }): Promise<string | null> => {
    if (!user) {
      toast.error("Tidak ada user yang login");
      return null;
    }

    try {
      const existing = await getDocs(
        query(
          collection(db, COLLECTIONS.shifts),
          where("status", "==", "active"),
          where("userId", "==", user.uid),
          limit(1),
        ),
      );

      if (!existing.empty) {
        toast.error("Shift aktif sudah ada");
        return existing.docs[0].id;
      }

      const shiftRef = await addDoc(collection(db, COLLECTIONS.shifts), {
        storeId: STORE_ID,
        userId: user.uid,
        userName: user.displayName,
        role: user.role,
        startTime: serverTimestamp(),
        endTime: null,
        status: "active",
        openingCash: params.openingCash,
        closingCash: null,
        expectedCash: params.openingCash,
        cashDifference: null,
        totalTransactions: 0,
        totalRevenue: 0,
        notes: params.notes || "",
      });

      toast.success("Shift berhasil dibuka");
      return shiftRef.id;
    } catch (error) {
      console.error("Open shift error:", error);
      toast.error("Gagal membuka shift");
      return null;
    }
  };

  const closeShift = async (params: {
    shiftId: string;
    closingCash: number;
    expectedCash: number;
    notes?: string;
  }): Promise<boolean> => {
    try {
      await updateDoc(doc(db, COLLECTIONS.shifts, params.shiftId), {
        status: "closed",
        endTime: serverTimestamp(),
        closingCash: params.closingCash,
        expectedCash: params.expectedCash,
        cashDifference: params.closingCash - params.expectedCash,
        notes: params.notes || "",
      });

      toast.success("Shift berhasil ditutup");
      return true;
    } catch (error) {
      console.error("Close shift error:", error);
      toast.error("Gagal menutup shift");
      return false;
    }
  };

  return { openShift, closeShift };
}
