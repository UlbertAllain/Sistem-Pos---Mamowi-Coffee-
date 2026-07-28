'use client';

import { FormEvent, useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/errors';
import type { PaymentMethod } from '@/types/models';
import { savePaymentMethod } from './settings-service';

export function PaymentMethodForm({ storeId, method, onSaved, onCancel }: { storeId: string; method?: PaymentMethod | null; onSaved: () => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'cash' | 'non_cash'>('cash');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(method?.name ?? '');
    setType(method?.type ?? 'cash');
    setIsActive(method?.isActive ?? true);
    setError(null);
  }, [method]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await savePaymentMethod(storeId, { name, type, isActive }, method?.id);
      onSaved();
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setSubmitting(false);
    }
  };

  return <form className="form-stack" onSubmit={handleSubmit}><label className="field"><span>Nama metode</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Contoh: Tunai atau QRIS" required /></label><label className="field"><span>Jenis</span><select value={type} onChange={(event) => setType(event.target.value as 'cash' | 'non_cash')}><option value="cash">Tunai</option><option value="non_cash">Non-tunai</option></select></label><label className="switch-row"><input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} /><div><strong>Metode aktif</strong><span>Metode aktif dapat dipilih saat checkout.</span></div></label>{error ? <div className="inline-alert inline-alert-error">{error}</div> : null}<div className="form-actions"><Button variant="secondary" onClick={onCancel}>Batal</Button><Button type="submit" disabled={submitting}>{submitting ? <><LoaderCircle className="spin" size={16} /> Menyimpan...</> : 'Simpan metode'}</Button></div></form>;
}
