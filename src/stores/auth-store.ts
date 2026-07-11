import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, UserRole } from "@/types";
import { ROLE_PERMISSIONS } from "@/constants";

interface AuthState {
  user: User | null;
  firebaseUid: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setUser: (user: User | null) => void;
  setFirebaseUid: (uid: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;

  hasRole: (roles: UserRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      firebaseUid: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        }),

      setFirebaseUid: (firebaseUid) => set({ firebaseUid }),

      setLoading: (isLoading) => set({ isLoading }),

      logout: () =>
        set({
          user: null,
          firebaseUid: null,
          isAuthenticated: false,
          isLoading: false,
        }),

      hasRole: (roles) => {
        const { user } = get();
        if (!user) return false;
        if (user.role === "owner") return true;
        return roles.includes(user.role);
      },

      hasPermission: (permission) => {
        const { user } = get();
        if (!user) return false;
        if (user.role === "owner") return true;
        const permissions = ROLE_PERMISSIONS[user.role] || [];
        return permissions.includes("*") || permissions.includes(permission);
      },
    }),
    {
      name: "koffee-auth",
      partialize: (state) => ({
        user: state.user,
        firebaseUid: state.firebaseUid,
      }),
    },
  ),
);
