import { getFirebaseAuth } from '@/lib/firebase/client';

interface ApiErrorPayload {
  error?: { message?: string };
}

export async function authenticatedJson<T>(url: string, init: RequestInit): Promise<T> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error('Sesi login tidak ditemukan.');
  const token = await user.getIdToken();

  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
    cache: 'no-store',
  });

  const payload = await response.json().catch(() => ({})) as ApiErrorPayload & T;
  if (!response.ok) {
    throw new Error(payload.error?.message ?? 'Permintaan ke server gagal.');
  }
  return payload as T;
}
