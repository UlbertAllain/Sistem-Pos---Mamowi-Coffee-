/* eslint-disable @next/next/no-img-element */
'use client';

import { Archive, ImageIcon, PackagePlus, Pencil, Search, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { useAuth } from '@/features/auth/auth-context';
import { archiveProduct } from '@/features/catalog/catalog-service';
import { ProductForm } from '@/features/catalog/product-form';
import { StockAdjustmentForm } from '@/features/catalog/stock-adjustment-form';
import { useCatalog } from '@/features/catalog/use-catalog';
import { getErrorMessage } from '@/lib/errors';
import { formatCurrency } from '@/lib/format';
import type { Product } from '@/types/models';

export default function ProductsPage() {
  const { profile, isAdmin } = useAuth();
  const { categories, products, loading, error } = useCatalog(profile?.storeId);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'archived'>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [adjusting, setAdjusting] = useState<Product | null>(null);

  const categoryMap = useMemo(() => new Map(categories.map((category) => [category.id, category.name])), [categories]);
  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesStatus = status === 'all' || (status === 'active' ? product.isActive : !product.isActive);
      const matchesKeyword = !keyword || `${product.name} ${product.sku}`.toLowerCase().includes(keyword);
      return matchesStatus && matchesKeyword;
    });
  }, [products, search, status]);

  if (!profile) return null;
  if (!isAdmin) return <ErrorState message="Halaman ini hanya dapat diakses owner atau manager." />;

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (product: Product) => { setEditing(product); setFormOpen(true); };
  const handleArchive = async (product: Product) => {
    if (!window.confirm(`Arsipkan produk ${product.name}?`)) return;
    try {
      await archiveProduct(profile.storeId, product.id);
      toast.success('Produk berhasil diarsipkan.');
    } catch (cause) {
      toast.error(getErrorMessage(cause));
    }
  };

  return (
    <>
      <PageHeader eyebrow="Master data" title="Produk" description="Kelola harga jual, kategori, status, dan stok produk yang tersedia pada kasir." actions={<Button onClick={openCreate}><PackagePlus size={17} /> Tambah produk</Button>} />
      <div className="toolbar"><label className="search-field"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama atau SKU..." /></label><div className="filter-chips">{(['all', 'active', 'archived'] as const).map((value) => <button key={value} className={`filter-chip ${status === value ? 'filter-chip-active' : ''}`} onClick={() => setStatus(value)}>{value === 'all' ? 'Semua' : value === 'active' ? 'Aktif' : 'Diarsipkan'}</button>)}</div></div>
      <section className="card">
        {loading ? <LoadingState label="Memuat produk..." /> : error ? <ErrorState message={error} /> : filtered.length === 0 ? <EmptyState title="Produk tidak ditemukan" description="Tambahkan produk baru atau ubah kata pencarian." /> : <div className="table-wrap"><table><thead><tr><th>Produk</th><th>Kategori</th><th>Harga</th><th>Stok</th><th>Status</th><th aria-label="Aksi" /></tr></thead><tbody>{filtered.map((product) => <tr key={product.id}><td><div className="product-cell"><div className="product-thumb">{product.imageUrl ? <img src={product.imageUrl} alt="" /> : <ImageIcon size={18} />}</div><div><strong>{product.name}</strong><span>{product.sku}</span></div></div></td><td>{categoryMap.get(product.categoryId) ?? '-'}</td><td className="numeric">{formatCurrency(product.price)}</td><td>{product.trackStock ? <span className={`badge ${product.stockQty <= 5 ? 'badge-warning' : 'badge-neutral'}`}>{product.stockQty}</span> : <span className="badge badge-neutral">Tidak dilacak</span>}</td><td><span className={`badge ${product.isActive ? 'badge-success' : 'badge-neutral'}`}>{product.isActive ? 'Aktif' : 'Arsip'}</span></td><td><div className="table-actions">{product.trackStock ? <button className="icon-button" onClick={() => setAdjusting(product)} title="Sesuaikan stok"><SlidersHorizontal size={17} /></button> : null}<button className="icon-button" onClick={() => openEdit(product)} title="Edit"><Pencil size={17} /></button>{product.isActive ? <button className="icon-button" onClick={() => handleArchive(product)} title="Arsipkan"><Archive size={17} /></button> : null}</div></td></tr>)}</tbody></table></div>}
      </section>
      <Modal open={formOpen} title={editing ? 'Edit produk' : 'Tambah produk'} description="Harga dan stok wajib berupa bilangan bulat." onClose={() => setFormOpen(false)}><ProductForm key={editing?.id ?? 'new'} storeId={profile.storeId} categories={categories} product={editing} onCancel={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); toast.success('Produk berhasil disimpan.'); }} /></Modal>
      <Modal open={Boolean(adjusting)} title="Penyesuaian stok" description={adjusting?.name} onClose={() => setAdjusting(null)} width="sm">{adjusting ? <StockAdjustmentForm storeId={profile.storeId} product={adjusting} onCancel={() => setAdjusting(null)} onSaved={() => { setAdjusting(null); toast.success('Stok berhasil disesuaikan.'); }} /> : null}</Modal>
    </>
  );
}
