import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let cachedApp: App | null = null;
let cachedAuth: Auth | null = null;
let cachedDb: Firestore | null = null;

function requiredServerEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Environment variable server ${name} belum diisi.`);
  return value;
}

function getAdminApp(): App {
  if (cachedApp) return cachedApp;
  const existing = getApps()[0];
  if (existing) {
    cachedApp = existing;
    return existing;
  }

  const projectId = requiredServerEnv('FIREBASE_ADMIN_PROJECT_ID');
  const clientEmail = requiredServerEnv('FIREBASE_ADMIN_CLIENT_EMAIL');
  const privateKey = requiredServerEnv('FIREBASE_ADMIN_PRIVATE_KEY').replace(/\\n/g, '\n');

  cachedApp = initializeApp({
    projectId,
    credential: cert({ projectId, clientEmail, privateKey }),
  });
  return cachedApp;
}

export function getAdminAuth(): Auth {
  if (!cachedAuth) cachedAuth = getAuth(getAdminApp());
  return cachedAuth;
}

export function getAdminDb(): Firestore {
  if (!cachedDb) {
    cachedDb = getFirestore(getAdminApp());
    cachedDb.settings({ ignoreUndefinedProperties: true });
  }
  return cachedDb;
}
