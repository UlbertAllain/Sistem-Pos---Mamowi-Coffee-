import assert from 'node:assert/strict';
import test from 'node:test';

import { calculateSalesSummary } from '../../src/features/reports/report-domain.ts';
import type { Order } from '../../src/types/models.ts';

function order(overrides: Partial<Order>): Order {
  return {
    id: '1', schemaVersion: 2, sequence: 1, storeId: 'mamowi', orderNumber: 'MW-1', cashierId: 'u1', cashierName: 'Kasir',
    requestFingerprint: 'x', items: [{ productId: 'p1', sku: 'P1', name: 'Kopi', unitPrice: 10000, quantity: 2, lineTotal: 20000, trackStock: true }],
    subtotal: 20000, discount: 2000, total: 18000, paid: 20000, change: 2000,
    paymentMethodId: 'cash', paymentMethodName: 'Tunai', status: 'paid', paymentStatus: 'paid',
    ...overrides,
  };
}

test('laporan mengecualikan transaksi void dari omzet', () => {
  const summary = calculateSalesSummary([order({ id: 'paid' }), order({ id: 'void', status: 'voided', paymentStatus: 'refunded' })]);
  assert.equal(summary.netSales, 18000);
  assert.equal(summary.transactionCount, 1);
  assert.equal(summary.itemsSold, 2);
});

test('laporan mengurutkan produk berdasarkan quantity', () => {
  const second = order({
    id: '2',
    items: [{ productId: 'p2', sku: 'P2', name: 'Teh', unitPrice: 5000, quantity: 5, lineTotal: 25000, trackStock: true }],
    subtotal: 25000, discount: 0, total: 25000, paid: 25000, change: 0,
  });
  const summary = calculateSalesSummary([order({}), second]);
  assert.equal(summary.topProducts[0]?.name, 'Teh');
  assert.equal(summary.netSales, 43000);
});
