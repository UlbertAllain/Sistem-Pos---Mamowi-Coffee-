export interface PublicEnv {
  firebaseApiKey: string;
  firebaseAuthDomain: string;
  firebaseProjectId: string;
  firebaseStorageBucket: string;
  firebaseMessagingSenderId: string;
  firebaseAppId: string;
  storeId: string;
  appCheckSiteKey?: string;
  cloudinaryCloudName?: string;
  cloudinaryUploadPreset?: string;
}

let cachedEnv: PublicEnv | null = null;

function required(value: string | undefined, name: string): string {
  const normalized = value?.trim();
  if (!normalized) {
    throw new Error(`Environment variable ${name} belum diisi.`);
  }
  return normalized;
}

export function getPublicEnv(): PublicEnv {
  if (cachedEnv) return cachedEnv;

  cachedEnv = {
    firebaseApiKey: required(process.env.NEXT_PUBLIC_FIREBASE_API_KEY, 'NEXT_PUBLIC_FIREBASE_API_KEY'),
    firebaseAuthDomain: required(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    firebaseProjectId: required(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, 'NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
    firebaseStorageBucket: required(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
    firebaseMessagingSenderId: required(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
    firebaseAppId: required(process.env.NEXT_PUBLIC_FIREBASE_APP_ID, 'NEXT_PUBLIC_FIREBASE_APP_ID'),
    storeId: required(process.env.NEXT_PUBLIC_FIREBASE_STORE_ID, 'NEXT_PUBLIC_FIREBASE_STORE_ID'),
    appCheckSiteKey: process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY?.trim() || undefined,
    cloudinaryCloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim() || undefined,
    cloudinaryUploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim() || undefined,
  };

  return cachedEnv;
}
