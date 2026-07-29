import { z } from 'zod';

import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { firestorePaths } from '@/lib/firebase/paths';
import { HttpError } from './http';

const profileSchema = z.object({
  storeId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email().or(z.literal('')),
  role: z.enum(['owner', 'manager', 'cashier']),
  isActive: z.literal(true),
});

export type ServerUser = z.infer<typeof profileSchema> & { uid: string };

function bearerToken(request: Request): string {
  const authorization = request.headers.get('authorization') ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  if (!match?.[1]) throw new HttpError('Token autentikasi tidak ditemukan.', 401, 'UNAUTHENTICATED');
  return match[1];
}

export async function requireStoreUser(
  request: Request,
  storeId: string,
  allowedRoles: ServerUser['role'][] = ['owner', 'manager', 'cashier'],
): Promise<ServerUser> {
  let uid: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(bearerToken(request), true);
    uid = decoded.uid;
  } catch (cause) {
    if (cause instanceof HttpError) throw cause;
    throw new HttpError('Sesi login tidak valid atau sudah kedaluwarsa.', 401, 'INVALID_TOKEN');
  }

  const snapshot = await getAdminDb().doc(firestorePaths.user(storeId, uid)).get();
  if (!snapshot.exists) throw new HttpError('Profil pengguna tidak ditemukan.', 403, 'PROFILE_NOT_FOUND');

  const profile = profileSchema.safeParse(snapshot.data());
  if (!profile.success || profile.data.storeId !== storeId) {
    throw new HttpError('Profil pengguna tidak valid untuk toko ini.', 403, 'INVALID_PROFILE');
  }
  if (!allowedRoles.includes(profile.data.role)) {
    throw new HttpError('Kamu tidak memiliki izin untuk operasi ini.', 403, 'FORBIDDEN');
  }
  return { uid, ...profile.data };
}
