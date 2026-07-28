'use client';

import { CreditCard, Pencil, Plus, Save } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { PageHeader } from '@/components/ui/page-header';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { useAuth } from '@/features/auth/auth-context';
import { PaymentMethodForm } from '@/features/settings/payment-method-form';
import { saveSettings, savePaymentMethod } from '@/features/settings/settings-service';
import { useSettings } from '@/features/settings/use-settings';
import { getErrorMessage } from '@/lib/errors';
import type { PaymentMethod } from '@/types/models';

export default function SettingsPage() {
  const { profile, isAdmin } = useAuth();
  const state = useSettings(profile?.storeId);
  const [storeName, setStoreName] = useState('Mamowi Coffee');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [receiptFooter, setReceiptFooter] = useState('Terima kasih. Sampai jumpa kembali.');
  const [maxDiscount, setMaxDiscount] = useState('0');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [methodOpen, setMethodOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);

  useEffect(() => {
    if (!state.settings) return;
    setStoreName(state.settings.storeName);
    setAddress(state.settings.address);
    setPhone(state.settings.phone);
    setReceiptFooter(state.settings.receiptFooter);
    setMaxDiscount(String(state.settings.maxDiscount));
    setLowStockThreshold(String(state.settings.lowStockThreshold));
  }, [state.settings]);

  if (!profile) return null;
  if (!isAdmin) return <ErrorState message="Halaman ini hanya dapat diakses owner atau manager." />;

  const submitSettings = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      await saveSettings(profile.storeId, { storeName, address, phone, receiptFooter, maxDiscount: Number(maxDiscount), lowStockThreshold: Number(lowStockThreshold) });
      toast.success('Pengaturan toko berhasil disimpan.');
    } catch (cause) {
      setFormError(getErrorMessage(cause));
    } finally {
      setSaving(false);
    }
  };

  const toggleMethod = async (method: PaymentMethod) => {
    try {
      await savePaymentMethod(profile.storeId, { name: method.name, type: method.type, isActive: !method.isActive }, method.id);
      toast.success(`Metode ${method.isActive ? 'dinonaktifkan' : 'diaktifkan'}.`);
    } catch (cause) {
      toast.error(getErrorMessage(cause));
    }
  };

  return <><PageHeader eyebrow="Konfigurasi" title="Pengaturan" description="Atur identitas struk, batas diskon, peringatan stok, dan metode pembayaran." />{state.loading ? <LoadingState label="Memuat pengaturan..." /> : state.error ? <ErrorState message={state.error} /> : <div className="settings-grid"><section className="card"><div className="card-header"><div><h2>Informasi toko</h2><p>Informasi ini tampil pada struk.</p></div></div><div className="card-body"><form className="form-stack" onSubmit={submitSettings}><div className="form-grid"><label className="field"><span>Nama toko</span><input value={storeName} onChange={(event) => setStoreName(event.target.value)} required /></label><label className="field"><span>Nomor telepon</span><input value={phone} onChange={(event) => setPhone(event.target.value)} /></label><label className="field field-full"><span>Alamat</span><textarea value={address} onChange={(event) => setAddress(event.target.value)} /></label><label className="field"><span>Batas diskon per transaksi</span><input type="number" min="0" step="1" value={maxDiscount} onChange={(event) => setMaxDiscount(event.target.value)} required /></label><label className="field"><span>Batas stok rendah</span><input type="number" min="0" step="1" value={lowStockThreshold} onChange={(event) => setLowStockThreshold(event.target.value)} required /></label><label className="field field-full"><span>Footer struk</span><textarea value={receiptFooter} onChange={(event) => setReceiptFooter(event.target.value)} /></label></div>{formError ? <div className="inline-alert inline-alert-error">{formError}</div> : null}<div className="form-actions"><Button type="submit" disabled={saving}><Save size={16} /> {saving ? 'Menyimpan...' : 'Simpan pengaturan'}</Button></div></form></div></section><aside className="card"><div className="card-header"><div><h2>Metode pembayaran</h2><p>Tunai dan non-tunai yang tersedia.</p></div><Button size="sm" onClick={() => { setEditingMethod(null); setMethodOpen(true); }}><Plus size={15} /> Tambah</Button></div><div className="card-body">{state.paymentMethods.length === 0 ? <div className="state-panel" style={{ minHeight: 180 }}><CreditCard size={27} /><strong>Belum ada metode</strong><p>Tambahkan minimal satu metode agar checkout dapat digunakan.</p></div> : <div className="payment-list">{state.paymentMethods.map((method) => <div className="payment-row" key={method.id}><div className="stat-icon" style={{ margin: 0 }}><CreditCard size={16} /></div><div><strong>{method.name}</strong><span>{method.type === 'cash' ? 'Tunai' : 'Non-tunai'}</span></div><span className={`badge ${method.isActive ? 'badge-success' : 'badge-neutral'}`}>{method.isActive ? 'Aktif' : 'Nonaktif'}</span><button className="icon-button" onClick={() => { setEditingMethod(method); setMethodOpen(true); }} title="Edit"><Pencil size={16} /></button><Button size="sm" variant="ghost" onClick={() => toggleMethod(method)}>{method.isActive ? 'Nonaktifkan' : 'Aktifkan'}</Button></div>)}</div>}</div></aside></div>}<Modal open={methodOpen} title={editingMethod ? 'Edit metode pembayaran' : 'Tambah metode pembayaran'} onClose={() => setMethodOpen(false)} width="sm"><PaymentMethodForm storeId={profile.storeId} method={editingMethod} onCancel={() => setMethodOpen(false)} onSaved={() => { setMethodOpen(false); toast.success('Metode pembayaran berhasil disimpan.'); }} /></Modal></>;
}
