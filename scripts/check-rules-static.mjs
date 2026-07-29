import { readFile } from 'node:fs/promises';

const finalRules = await readFile('firestore.rules', 'utf8');
const migrationRules = await readFile('firestore.rules.migration', 'utf8');
const migrationBlock = `      // TEMPORARY: only for the controlled legacy migration window.\n      match /menu_items/{legacyItemId} {\n        allow read: if isAdmin(storeId);\n        allow write: if false;\n      }\n\n      match /menu_categories/{legacyCategoryId} {\n        allow read: if isAdmin(storeId);\n        allow write: if false;\n      }\n\n`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertBalanced(source, label) {
  const pairs = new Map([['}', '{'], [')', '('], [']', '[']]);
  const stack = [];
  let quote = null;
  let escaped = false;
  let lineComment = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (lineComment) {
      if (char === '\n') lineComment = false;
      continue;
    }
    if (!quote && char === '/' && next === '/') {
      lineComment = true;
      index += 1;
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === "'" || char === '"') {
      quote = char;
      continue;
    }
    if (['{', '(', '['].includes(char)) stack.push(char);
    else if (pairs.has(char)) assert(stack.pop() === pairs.get(char), `${label}: pasangan karakter tidak seimbang.`);
  }
  assert(!quote, `${label}: string literal belum ditutup.`);
  assert(stack.length === 0, `${label}: kurung atau brace belum ditutup.`);
}

assertBalanced(finalRules, 'firestore.rules');
assertBalanced(migrationRules, 'firestore.rules.migration');
assert(!finalRules.includes('match /menu_items/'), 'Rules final masih membuka collection legacy.');
assert(migrationRules.includes(migrationBlock), 'Rules migrasi kehilangan blok legacy read-only.');
assert(migrationRules.replace(migrationBlock, '') === finalRules, 'Rules migrasi berbeda di luar blok legacy.');
assert(finalRules.includes('match /orders/{orderId}'), 'Rules order tidak ditemukan.');
assert(finalRules.includes('match /stock_movements/{movementId}'), 'Rules stock movement tidak ditemukan.');
assert(finalRules.includes('match /counters/{counterId}'), 'Rules counter tidak ditemukan.');
assert(finalRules.match(/match \/orders\/\{orderId\}[\s\S]*?allow write: if false;/), 'Client masih dapat menulis order.');
assert(finalRules.match(/match \/stock_movements\/\{movementId\}[\s\S]*?allow write: if false;/), 'Client masih dapat menulis movement.');
assert(finalRules.match(/match \/counters\/\{counterId\}[\s\S]*?allow write: if false;/), 'Client masih dapat menulis counter.');
assert(finalRules.includes('request.resource.data.stockQty == resource.data.stockQty'), 'Update stok langsung dari client belum diblokir.');
assert(finalRules.length < 7000, 'Rules V5 masih terlalu kompleks.');
process.stdout.write('Static Firestore Rules audit V5 lulus: mutation sensitif hanya melalui server Admin.\n');
