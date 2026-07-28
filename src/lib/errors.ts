import { FirebaseError } from 'firebase/app';

const firebaseMessages: Record<string, string> = {
  'auth/invalid-credential': 'Email atau password salah.',
  'auth/too-many-requests': 'Terlalu banyak percobaan. Coba lagi beberapa saat.',
  'auth/network-request-failed': 'Koneksi ke Firebase gagal.',
  'permission-denied': 'Akses ditolak oleh aturan keamanan.',
  'firestore/permission-denied': 'Akses ditolak oleh aturan keamanan.',
  'firestore/unavailable': 'Layanan Firestore sedang tidak tersedia.',
  'firestore/aborted': 'Data berubah saat diproses. Silakan ulangi.',
  unavailable: 'Layanan sedang tidak tersedia. Coba lagi.',
  aborted: 'Data berubah saat diproses. Silakan ulangi.',
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    return firebaseMessages[error.code] ?? error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Terjadi kesalahan yang tidak diketahui.';
}
