'use client';

import { Ban, Eye, Search } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { useAuth } from '@/features/auth/auth-context';
import { Receipt } from '@/features/orders/receipt';
import { voidOrder } from '@/features/orders/orders-service';
import { useRecentOrders } from '@/features/orders/use-orders';
import { useSettings } from '@/features/settings/use-settings';
import { getErrorMessage } from '@/lib/errors';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { Order } from '@/types/models';

export default function TransactionsPage() {
  const { profile, isAdmin } = useAuth();
  const { orders, loading, error } = useRecentOrders(profile?.storeId, 250);
  const settings = useSettings(profile?.storeId);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'paid' | 'voided'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [voidTarget, setVoidTarget] = useState<Order | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [voiding, setVoiding] = useState(false);
  const [voidError, setVoidError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = status === 'all' || order.status === status;
      const matchesKeyword = !keyword || `${order.orderNumber} ${order.cashierName} ${order.paymentMethodName}`.toLowerCase().includes(keyword);
      return matchesStatus && matchesKeyword;
    });
  }, [orders, search, status]);

  if (!profile) return null;

  const submitVoid = async (event: FormEvent) => {
    event.preventDefault();
    if (!voidTarget) return;
    setVoiding(true);
    setVoidError(null);
    try {
      await voidOrder(profile.storeId, voidTarget.id, voidReason);
      setVoidTarget(null);
      setVoidReason('');
      toast.success('Transaksi dibatalkan dan stok dikembalikan.');
    } catch (cause) {
      setVoidError(getErrorMessage(cause));
    } finally {
      setVoiding(false);
    }
  };

  return <><PageHeader eyebrow="Riwayat" title="Transaksi" description="Lihat detail, cetak ulang struk, dan lakukan void penuh dengan jejak yang tetap tersimpan." /><div className="toolbar"><label className="search-field"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nomor, kasir, atau metode bayar..." /></label><div className="filter-chips">{(['all', 'paid', 'voided'] as const).map((value) => <button key={value} className={`filter-chip ${status === value ? 'filter-chip-active' : ''}`} onClick={() => setStatus(value)}>{value === 'all' ? 'Semua' : value === 'paid' ? 'Dibayar' : 'Void'}</button>)}</div></div><section className="card">{loading ? <LoadingState label="Memuat transaksi..." /> : error ? <ErrorState message={error} /> : filtered.length === 0 ? <EmptyState title="Transaksi tidak ditemukan" description="Belum ada transaksi atau filter terlalu spesifik." /> : <div className="table-wrap"><table><thead><tr><th>Nomor</th><th>Waktu</th><th>Kasir</th><th>Pembayaran</th><th>Total</th><th>Status</th><th aria-label="Aksi" /></tr></thead><tbody>{filtered.map((order) => <tr key={order.id}><td><strong>{order.orderNumber}</strong></td><td>{formatDateTime(order.createdAt)}</td><td>{order.cashierName}</td><td>{order.paymentMethodName}</td><td className="numeric">{formatCurrency(order.total)}</td><td><span className={`badge ${order.status === 'paid' ? 'badge-success' : 'badge-danger'}`}>{order.status === 'paid' ? 'Dibayar' : 'Void'}</span></td><td><div className="table-actions"><button className="icon-button" onClick={() => setSelectedOrder(order)} title="Lihat struk"><Eye size={17} /></button>{isAdmin && order.status === 'paid' ? <button className="icon-button" onClick={() => { setVoidTarget(order); setVoidReason(''); setVoidError(null); }} title="Void transaksi"><Ban size={17} /></button> : null}</div></td></tr>)}</tbody></table></div>}</section><Modal open={Boolean(selectedOrder)} title="Detail transaksi" description={selectedOrder?.orderNumber} onClose={() => setSelectedOrder(null)} width="sm">{selectedOrder ? <Receipt order={selectedOrder} settings={settings.settings} /> : null}</Modal><Modal open={Boolean(voidTarget)} title="Void transaksi" description={voidTarget ? `${voidTarget.orderNumber} · ${formatCurrency(voidTarget.total)}` : undefined} onClose={() => { if (!voiding) setVoidTarget(null); }} width="sm"><form className="form-stack" onSubmit={submitVoid}><div className="inline-alert inline-alert-warning">Void tidak menghapus histori. Status transaksi berubah menjadi void dan stok produk dikembalikan secara atomik.</div><label className="field"><span>Alasan void</span><textarea value={voidReason} onChange={(event) => setVoidReason(event.target.value)} placeholder="Contoh: kasir salah memilih produk" required /></label>{voidError ? <div className="inline-alert inline-alert-error">{voidError}</div> : null}<div className="form-actions"><Button variant="secondary" onClick={() => setVoidTarget(null)} disabled={voiding}>Batal</Button><Button variant="danger" type="submit" disabled={voiding}>{voiding ? 'Memproses...' : 'Void transaksi'}</Button></div></form></Modal></>;
}
