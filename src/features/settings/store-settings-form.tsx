'use client';

import { FormEvent, useState } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/errors';
import type { StoreSettings } from '@/types/models';
import { saveSettings } from './settings-service';

interface StoreSettingsFormProps {
  storeId: string;
  settings: StoreSettings;
}

export function StoreSettingsForm({ storeId, settings }: StoreSettingsFormProps) {
  const [storeName, setStoreName] = useState(settings.storeName);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [receiptFooter, setReceiptFooter] = useState(settings.receiptFooter);
  const [maxDiscount, setMaxDiscount] = useState(String(settings.maxDiscount));
  const [lowStockThreshold, setLowStockThreshold] = useState(String(settings.lowStockThreshold));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await saveSettings(storeId, {
        storeName,
        address,
        phone,
        receiptFooter,
        maxDiscount: Number(maxDiscount),
        lowStockThreshold: Number(lowStockThreshold),
      });
      toast.success('Pengaturan toko berhasil disimpan.');
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="form-stack" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label className="field">
          <span>Nama toko</span>
          <input value={storeName} onChange={(event) => setStoreName(event.target.value)} required />
        </label>
        <label className="field">
          <span>Nomor telepon</span>
          <input value={phone} onChange={(event) => setPhone(event.target.value)} />
        </label>
        <label className="field field-full">
          <span>Alamat</span>
          <textarea value={address} onChange={(event) => setAddress(event.target.value)} />
        </label>
        <label className="field">
          <span>Batas diskon per transaksi</span>
          <input
            type="number"
            min="0"
            step="1"
            value={maxDiscount}
            onChange={(event) => setMaxDiscount(event.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Batas stok rendah</span>
          <input
            type="number"
            min="0"
            step="1"
            value={lowStockThreshold}
            onChange={(event) => setLowStockThreshold(event.target.value)}
            required
          />
        </label>
        <label className="field field-full">
          <span>Footer struk</span>
          <textarea value={receiptFooter} onChange={(event) => setReceiptFooter(event.target.value)} />
        </label>
      </div>

      {error ? <div className="inline-alert inline-alert-error">{error}</div> : null}

      <div className="form-actions">
        <Button type="submit" disabled={saving}>
          <Save size={16} />
          {saving ? 'Menyimpan...' : 'Simpan pengaturan'}
        </Button>
      </div>
    </form>
  );
}
