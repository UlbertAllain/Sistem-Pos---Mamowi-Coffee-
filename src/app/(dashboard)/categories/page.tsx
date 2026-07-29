'use client';

import { Archive, Pencil, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { useAuth } from '@/features/auth/auth-context';
import { CategoryForm } from '@/features/catalog/category-form';
import { archiveCategory } from '@/features/catalog/catalog-service';
import { useCatalog } from '@/features/catalog/use-catalog';
import { getErrorMessage } from '@/lib/errors';
import type { Category } from '@/types/models';

export default function CategoriesPage() {
  const { profile, isAdmin } = useAuth();
  const { categories, products, loading, error } = useCatalog(profile?.storeId);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const filtered = useMemo(() => categories.filter((item) => item.name.toLowerCase().includes(search.trim().toLowerCase())), [categories, search]);
  const productCount = useMemo(() => products.reduce((map, product) => map.set(product.categoryId, (map.get(product.categoryId) ?? 0) + 1), new Map<string, number>()), [products]);
  if (!profile) return null;
  if (!isAdmin) return <ErrorState message="Halaman ini hanya dapat diakses owner atau manager." />;

  const handleArchive = async (category: Category) => {
    if (!window.confirm(`Arsipkan kategori ${category.name}?`)) return;
    try { await archiveCategory(profile.storeId, category.id); toast.success('Kategori berhasil diarsipkan.'); }
    catch (cause) { toast.error(getErrorMessage(cause)); }
  };

  return <><PageHeader eyebrow="Master data" title="Kategori" description="Gunakan kategori seperlunya agar kasir dapat menemukan produk dengan cepat." actions={<Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus size={17} /> Tambah kategori</Button>} /><div className="toolbar"><label className="search-field"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari kategori..." /></label></div><section className="card">{loading ? <LoadingState label="Memuat kategori..." /> : error ? <ErrorState message={error} /> : filtered.length === 0 ? <EmptyState title="Kategori belum tersedia" description="Buat kategori pertama untuk mengelompokkan produk." /> : <div className="table-wrap"><table><thead><tr><th>Nama</th><th>Jumlah produk</th><th>Status</th><th aria-label="Aksi" /></tr></thead><tbody>{filtered.map((category) => <tr key={category.id}><td><strong>{category.name}</strong></td><td>{productCount.get(category.id) ?? 0}</td><td><span className={`badge ${category.isActive ? 'badge-success' : 'badge-neutral'}`}>{category.isActive ? 'Aktif' : 'Arsip'}</span></td><td><div className="table-actions"><button className="icon-button" onClick={() => { setEditing(category); setFormOpen(true); }} title="Edit"><Pencil size={17} /></button>{category.isActive ? <button className="icon-button" onClick={() => handleArchive(category)} title="Arsipkan"><Archive size={17} /></button> : null}</div></td></tr>)}</tbody></table></div>}</section><Modal open={formOpen} title={editing ? 'Edit kategori' : 'Tambah kategori'} onClose={() => setFormOpen(false)} width="sm"><CategoryForm key={editing?.id ?? 'new'} storeId={profile.storeId} category={editing} onCancel={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); toast.success('Kategori berhasil disimpan.'); }} /></Modal></>;
}
