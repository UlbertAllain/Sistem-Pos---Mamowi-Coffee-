import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const required = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_FIREBASE_STORE_ID',
  'FIREBASE_ADMIN_PROJECT_ID',
  'FIREBASE_ADMIN_CLIENT_EMAIL',
  'FIREBASE_ADMIN_PRIVATE_KEY',
];

try {
  const text = await readFile(resolve('.env.local'), 'utf8');
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
} catch {
  // Environment may come from hosting.
}

const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length) {
  console.error(`Environment belum lengkap:\n- ${missing.join('\n- ')}`);
  process.exit(1);
}

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim();
if (Boolean(cloudName) !== Boolean(uploadPreset)) {
  console.error('Cloudinary harus diisi berpasangan: cloud name dan upload preset.');
  process.exit(1);
}

const clientSources = await Promise.all([
  readFile(resolve('src/lib/firebase/client.ts'), 'utf8'),
  readFile(resolve('src/features/pos/checkout-service.ts'), 'utf8'),
  readFile(resolve('src/lib/api/client.ts'), 'utf8'),
]);
if (clientSources.some((text) => text.includes('firebase-admin'))) {
  console.error('Firebase Admin tidak boleh diimpor ke client bundle.');
  process.exit(1);
}

const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 20 || (major === 20 && minor < 9)) {
  console.error('Node.js minimal 20.9 diperlukan.');
  process.exit(1);
}
process.stdout.write('Preflight V5 lulus: Web SDK, Admin SDK, Node.js, dan Cloudinary valid.\n');
