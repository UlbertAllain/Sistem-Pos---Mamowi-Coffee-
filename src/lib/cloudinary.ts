import { getPublicEnv } from '@/lib/env';

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

interface CloudinaryUploadResponse {
  secure_url?: unknown;
  error?: { message?: unknown };
}

export async function uploadProductImage(file: File): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Format gambar harus JPG, PNG, atau WebP.');
  }
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
    throw new Error('Ukuran gambar harus lebih dari 0 dan maksimal 5 MB.');
  }

  const env = getPublicEnv();
  if (!env.cloudinaryCloudName || !env.cloudinaryUploadPreset) {
    throw new Error('Cloudinary belum dikonfigurasi. Isi cloud name dan unsigned upload preset.');
  }

  const body = new FormData();
  body.append('file', file);
  body.append('upload_preset', env.cloudinaryUploadPreset);
  body.append('folder', `mamowi/${env.storeId}/products`);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(env.cloudinaryCloudName)}/image/upload`,
    { method: 'POST', body },
  );
  const payload = await response.json() as CloudinaryUploadResponse;
  if (!response.ok || typeof payload.secure_url !== 'string') {
    const message = typeof payload.error?.message === 'string'
      ? payload.error.message
      : 'Upload gambar ke Cloudinary gagal.';
    throw new Error(message);
  }
  return payload.secure_url;
}
