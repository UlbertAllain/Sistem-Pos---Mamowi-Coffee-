'use client';

import { ChangeEvent, FormEvent, useState } from 'react';
import { LoaderCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/errors';
import { uploadProductImage } from '@/lib/cloudinary';
import type { Category, Product } from '@/types/models';
import { saveProduct } from './catalog-service';

interface ProductFormProps {
  storeId: string;
  categories: Category[];
  product?: Product | null;
  onSaved: () => void;
  onCancel: () => void;
}

export function ProductForm({
  storeId,
  categories,
  product,
  onSaved,
  onCancel,
}: ProductFormProps) {
  const defaultCategoryId = product?.categoryId
    ?? categories.find((item) => item.isActive)?.id
    ?? '';
  const [name, setName] = useState(product?.name ?? '');
  const [sku, setSku] = useState(product?.sku ?? '');
  const [categoryId, setCategoryId] = useState(defaultCategoryId);
  const [price, setPrice] = useState(product ? String(product.price) : '');
  const [stockQty, setStockQty] = useState(product ? String(product.stockQty) : '0');
  const [trackStock, setTrackStock] = useState(product?.trackStock ?? true);
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      setImageUrl(await uploadProductImage(file));
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await saveProduct(
        storeId,
        {
          name,
          sku,
          categoryId,
          price: Number(price),
          stockQty: trackStock ? Number(stockQty) : 0,
          trackStock,
          isActive,
          imageUrl,
        },
        product?.id,
      );
      onSaved();
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="form-stack" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label className="field">
          <span>Nama produk</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Contoh: Es Kopi Susu"
            required
          />
        </label>
        <label className="field">
          <span>SKU {product ? '(tidak dapat diubah)' : ''}</span>
          <input
            value={sku}
            onChange={(event) => setSku(event.target.value.toUpperCase())}
            placeholder="KOPI-001"
            disabled={Boolean(product)}
            required
          />
        </label>
        <label className="field">
          <span>Kategori</span>
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            required
          >
            <option value="">Pilih kategori</option>
            {categories
              .filter((item) => item.isActive || item.id === product?.categoryId)
              .map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
          </select>
        </label>
        <label className="field">
          <span>Harga (Rupiah)</span>
          <input
            type="number"
            min="0"
            step="1"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="18000"
            required
          />
        </label>
        <label className="field">
          <span>
            {product ? 'Stok saat ini (ubah lewat penyesuaian stok)' : 'Stok awal'}
          </span>
          <input
            type="number"
            min="0"
            step="1"
            value={stockQty}
            onChange={(event) => setStockQty(event.target.value)}
            disabled={Boolean(product) || !trackStock}
            required={!product && trackStock}
          />
        </label>
        <label className="field">
          <span>Gambar produk</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageUpload}
            disabled={uploading}
          />
          <small>
            {uploading
              ? 'Mengunggah gambar...'
              : 'JPG, PNG, atau WebP; maksimal 5 MB. Cloudinary bersifat opsional.'}
          </small>
        </label>
        <label className="field">
          <span>URL gambar</span>
          <input
            type="url"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="https://..."
          />
        </label>
      </div>

      <label className="switch-row">
        <input
          type="checkbox"
          checked={trackStock}
          onChange={(event) => setTrackStock(event.target.checked)}
        />
        <div>
          <strong>Pantau stok</strong>
          <span>Nonaktifkan untuk jasa atau produk tanpa batas stok.</span>
        </div>
      </label>
      <label className="switch-row">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(event) => setIsActive(event.target.checked)}
        />
        <div>
          <strong>Produk aktif</strong>
          <span>Produk aktif tampil pada halaman kasir.</span>
        </div>
      </label>

      {error ? <div className="inline-alert inline-alert-error">{error}</div> : null}

      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onCancel}>Batal</Button>
        <Button type="submit" disabled={submitting || uploading}>
          {submitting ? (
            <><LoaderCircle className="spin" size={16} /> Menyimpan...</>
          ) : 'Simpan produk'}
        </Button>
      </div>
    </form>
  );
}
