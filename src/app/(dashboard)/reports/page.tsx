'use client';

import { Download, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { useAuth } from '@/features/auth/auth-context';
import { useOrdersRange } from '@/features/orders/use-orders';
import { calculateSalesSummary } from '@/features/reports/report-domain';
import {
  formatCurrency,
  formatDateTime,
  getJakartaMonthStartInputValue,
  parseJakartaDateInput,
  toDateInputValue,
} from '@/lib/format';

function csvCell(value: string | number): string {
  const text = String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export default function ReportsPage() {
  const { profile } = useAuth();
  const [fromValue, setFromValue] = useState(getJakartaMonthStartInputValue());
  const [toValue, setToValue] = useState(toDateInputValue(new Date()));
  const from = parseJakartaDateInput(fromValue, false);
  const to = parseJakartaDateInput(toValue, true);
  const { orders, loading, error, reload } = useOrdersRange(profile?.storeId, from, to);
  const summary = useMemo(() => calculateSalesSummary(orders), [orders]);
  const maxProductQty = summary.topProducts[0]?.quantity ?? 1;
  const paymentBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    for (const order of orders.filter((item) => item.status === 'paid')) {
      const current = map.get(order.paymentMethodName) ?? { count: 0, total: 0 };
      current.count += 1;
      current.total += order.total;
      map.set(order.paymentMethodName, current);
    }
    return [...map.entries()].sort((left, right) => right[1].total - left[1].total);
  }, [orders]);

  if (!profile) return null;

  const exportCsv = () => {
    const header = ['Nomor', 'Tanggal', 'Kasir', 'Metode', 'Subtotal', 'Diskon', 'Total', 'Status'];
    const rows = orders.map((order) => [order.orderNumber, formatDateTime(order.createdAt), order.cashierName, order.paymentMethodName, order.subtotal, order.discount, order.total, order.status]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `laporan-mamowi-${fromValue}-${toValue}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return <><PageHeader eyebrow="Analisis penjualan" title="Laporan" description="Semua nilai dihitung dari transaksi berstatus dibayar; transaksi void tetap terlihat di detail tetapi tidak masuk omzet." actions={<div className="page-actions"><Button variant="ghost" onClick={reload} disabled={loading}><RefreshCw size={16} /> Muat ulang</Button><Button variant="secondary" onClick={exportCsv} disabled={orders.length === 0}><Download size={16} /> Export CSV</Button></div>} /><div className="report-filters"><label className="field"><span>Dari tanggal</span><input type="date" required value={fromValue} max={toValue} onChange={(event) => { if (event.target.value) setFromValue(event.target.value); }} /></label><label className="field"><span>Sampai tanggal</span><input type="date" required value={toValue} min={fromValue} onChange={(event) => { if (event.target.value) setToValue(event.target.value); }} /></label></div>{loading ? <LoadingState label="Menghitung laporan..." /> : error ? <ErrorState message={error} /> : <><section className="report-grid"><article className="card report-card"><span>Penjualan bersih</span><strong>{formatCurrency(summary.netSales)}</strong></article><article className="card report-card"><span>Transaksi berhasil</span><strong>{summary.transactionCount}</strong></article><article className="card report-card"><span>Rata-rata transaksi</span><strong>{formatCurrency(summary.averageTransaction)}</strong></article><article className="card report-card"><span>Penjualan kotor</span><strong>{formatCurrency(summary.grossSales)}</strong></article><article className="card report-card"><span>Total diskon</span><strong>{formatCurrency(summary.discounts)}</strong></article><article className="card report-card"><span>Item terjual</span><strong>{summary.itemsSold}</strong></article></section><div className="content-grid"><section className="card"><div className="card-header"><div><h2>Produk terlaris</h2><p>Diurutkan berdasarkan jumlah item terjual.</p></div></div><div className="card-body">{summary.topProducts.length === 0 ? <EmptyState title="Belum ada penjualan" description="Tidak ada transaksi dibayar pada rentang tanggal ini." /> : <div className="bar-list">{summary.topProducts.slice(0, 10).map((product) => <div className="bar-item" key={product.productId}><div className="bar-label"><strong>{product.name}</strong><span>{product.quantity} item · {formatCurrency(product.revenue)}</span></div><div className="bar-track"><div className="bar-fill" style={{ width: `${Math.max(4, product.quantity / maxProductQty * 100)}%` }} /></div></div>)}</div>}</div></section><aside className="card"><div className="card-header"><div><h2>Metode pembayaran</h2><p>Distribusi nilai transaksi.</p></div></div><div className="card-body">{paymentBreakdown.length === 0 ? <p>Belum ada data.</p> : <div className="list-stack">{paymentBreakdown.map(([name, data]) => <div className="list-row" key={name}><div className="list-row-main"><strong>{name}</strong><span>{data.count} transaksi</span></div><div className="list-row-value"><strong>{formatCurrency(data.total)}</strong></div></div>)}</div>}</div></aside></div></>}</>;
}
