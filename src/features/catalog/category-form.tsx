'use client';

import { FormEvent, useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/errors';
import type { Category } from '@/types/models';
import { saveCategory } from './catalog-service';

interface CategoryFormProps {
  storeId: string;
  category?: Category | null;
  onSaved: () => void;
  onCancel: () => void;
}

export function CategoryForm({ storeId, category, onSaved, onCancel }: CategoryFormProps) {
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(category?.name ?? '');
    setIsActive(category?.isActive ?? true);
    setError(null);
  }, [category]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await saveCategory(storeId, { name, isActive }, category?.id);
      onSaved();
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="form-stack" onSubmit={handleSubmit}>
      <label className="field"><span>Nama kategori</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Contoh: Coffee" required /></label>
      <label className="switch-row"><input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} /><div><strong>Kategori aktif</strong><span>Kategori nonaktif tidak tampil pada halaman kasir.</span></div></label>
      {error ? <div className="inline-alert inline-alert-error">{error}</div> : null}
      <div className="form-actions"><Button variant="secondary" onClick={onCancel}>Batal</Button><Button type="submit" disabled={submitting}>{submitting ? <><LoaderCircle className="spin" size={16} /> Menyimpan...</> : 'Simpan kategori'}</Button></div>
    </form>
  );
}
