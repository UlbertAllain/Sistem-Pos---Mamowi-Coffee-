import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { z } from 'zod';

import { getPublicEnv } from '@/lib/env';
import { getFirebaseAuth, getFirebaseDb } from '@/lib/firebase/client';
import { firestorePaths } from '@/lib/firebase/paths';
import type { UserProfile } from '@/types/models';

const userProfileSchema = z.object({
  storeId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['owner', 'manager', 'cashier']),
  isActive: z.boolean(),
});

export async function login(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
}

export async function logout(): Promise<void> {
  await signOut(getFirebaseAuth());
}

export function observeAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(getFirebaseAuth(), callback);
}

export async function loadUserProfile(user: User): Promise<UserProfile> {
  const { storeId } = getPublicEnv();
  const db = getFirebaseDb();
  const profileRef = doc(db, firestorePaths.user(storeId, user.uid));
  const snapshot = await getDoc(profileRef);

  if (!snapshot.exists()) {
    throw new Error('Akun belum terdaftar sebagai pengguna toko.');
  }

  const parsed = userProfileSchema.safeParse(snapshot.data());
  if (!parsed.success) {
    throw new Error('Data profil pengguna tidak valid.');
  }
  if (!parsed.data.isActive) {
    throw new Error('Akun ini sudah dinonaktifkan.');
  }
  if (parsed.data.storeId !== storeId) {
    throw new Error('Akun tidak terhubung ke toko ini.');
  }

  await updateDoc(profileRef, {
    lastLogin: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { id: snapshot.id, ...parsed.data };
}
