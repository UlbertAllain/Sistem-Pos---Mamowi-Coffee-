'use client';

import { Toaster } from 'sonner';
import { AuthProvider } from '@/features/auth/auth-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster position="top-right" richColors closeButton />
    </AuthProvider>
  );
}
