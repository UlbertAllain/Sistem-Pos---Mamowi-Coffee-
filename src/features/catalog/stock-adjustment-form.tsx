'use client';

import { FormEvent, useState } from 'react';
import { LoaderCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/errors';
import type { Product } from '@/types/models';
import { adjustProductStock } from './catalog-service';

export function StockAdjustmentForm({ storeId, product, onSaved, onCancel }: { storeId: string; product: Product; onSaved: () => void; onCancel: () => void }) {
  const [nextQty, setNextQty] = useState(String(product.stockQty));
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await adjustProductStock(storeId, product.id, Number(nextQty), note);
      onSaved();
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setSubmitting(false);
    }
  };

  return <form className="form-stack" onSubmit={handleSubmit}><div className="inline-alert inline-alert-warning">Stok saat ini: <strong>{product.stockQty}</strong>. Perubahan akan dicatat sebagai mutasi stok.</div><label className="field"><span>Stok setelah penyesuaian</span><input type="number" min="0" step="1" value={nextQty} onChange={(event) => setNextQty(event.target.value)} required /></label><label className="field"><span>Alasan</span><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Contoh: hasil stok opname" required /></label>{error ? <div className="inline-alert inline-alert-error">{error}</div> : null}<div className="form-actions"><Button variant="secondary" onClick={onCancel}>Batal</Button><Button type="submit" disabled={submitting}>{submitting ? <><LoaderCircle className="spin" size={16} /> Menyimpan...</> : 'Simpan penyesuaian'}</Button></div></form>;
}
