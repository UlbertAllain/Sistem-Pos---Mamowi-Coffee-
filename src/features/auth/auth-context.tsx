'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';

import { getErrorMessage } from '@/lib/errors';
import type { UserProfile } from '@/types/models';
import { loadUserProfile, login, logout, observeAuth } from './auth-service';

interface AuthContextValue {
  firebaseUser: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const unsubscribe = observeAuth(
      async (user) => {
        if (!active) return;

        setLoading(true);
        setError(null);
        setFirebaseUser(user);
        setProfile(null);

        if (!user) {
          setLoading(false);
          return;
        }

        try {
          const nextProfile = await loadUserProfile(user);
          if (active) setProfile(nextProfile);
        } catch (cause) {
          if (active) setError(getErrorMessage(cause));
          try {
            await logout();
          } catch {
            // Keep the profile-loading error because it is the actionable failure.
          }
        } finally {
          if (active) setLoading(false);
        }
      },
      (cause) => {
        if (!active) return;
        setFirebaseUser(null);
        setProfile(null);
        setError(getErrorMessage(cause));
        setLoading(false);
      },
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    await login(email, password);
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    await logout();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    firebaseUser,
    profile,
    loading,
    error,
    signIn,
    signOut,
    isAdmin: profile?.role === 'owner' || profile?.role === 'manager',
  }), [error, firebaseUser, loading, profile, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth harus dipakai di dalam AuthProvider.');
  return context;
}
