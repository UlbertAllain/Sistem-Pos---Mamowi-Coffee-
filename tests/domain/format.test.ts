import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseJakartaDateInput,
  toDateInputValue,
} from '../../src/lib/format.ts';

test('batas awal hari memakai zona Asia/Jakarta', () => {
  assert.equal(
    parseJakartaDateInput('2026-07-27', false).toISOString(),
    '2026-07-26T17:00:00.000Z',
  );
});

test('batas akhir hari memakai zona Asia/Jakarta', () => {
  assert.equal(
    parseJakartaDateInput('2026-07-27', true).toISOString(),
    '2026-07-27T16:59:59.999Z',
  );
});

test('tanggal input tidak bergantung pada timezone perangkat', () => {
  assert.equal(toDateInputValue(new Date('2026-07-26T17:00:00.000Z')), '2026-07-27');
});

test('tanggal kalender yang tidak nyata ditolak', () => {
  assert.throws(() => parseJakartaDateInput('2026-02-30', false), /tidak valid/);
});
