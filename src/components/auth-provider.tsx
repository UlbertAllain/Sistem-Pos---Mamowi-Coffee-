"use client";

import { useEffect } from "react";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useAuthStore } from "@/stores/auth-store";
import { doc, getDoc } from "firebase/firestore";
import { STORE_ID } from "@/constants";
import type { User } from "@/types";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setFirebaseUid } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          setFirebaseUid(firebaseUser.uid);

          try {
            // Ambil data user dari Firestore
            const userDoc = await getDoc(
              doc(db, "stores", STORE_ID, "users", firebaseUser.uid),
            );

            if (userDoc.exists()) {
              const data = userDoc.data();
              const user: User = {
                uid: firebaseUser.uid,
                email: data.email || firebaseUser.email || "",
                displayName: data.displayName || firebaseUser.displayName || "",
                pin: data.pin,
                role: data.role,
                avatar: data.avatar,
                storeId: data.storeId || STORE_ID,
                isActive: data.isActive ?? true,
                lastLogin: data.lastLogin ? new Date(data.lastLogin) : null,
                createdAt: data.createdAt
                  ? new Date(data.createdAt)
                  : new Date(),
                updatedAt: data.updatedAt
                  ? new Date(data.updatedAt)
                  : new Date(),
              };
              setUser(user);
            } else {
              // User Firebase ada tapi belum ada di Firestore
              // Ini bisa jadi owner pertama kali — handle di onboarding
              setUser(null);
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
            setUser(null);
          }
        } else {
          setFirebaseUid(null);
          setUser(null);
        }
      },
    );

    return () => unsubscribe();
  }, [setUser, setFirebaseUid]);

  return <>{children}</>;
}
