/* eslint-disable @next/next/no-img-element */
'use client';

import { Coffee, Plus, Search } from 'lucide-react';

import { EmptyState } from '@/components/ui/states';
import { formatCurrency } from '@/lib/format';
import type { Product } from '@/types/models';

interface PosCatalogProps {
  categories: { id: string; name: string; isActive: boolean }[];
  categoryId: string;
  categoryMap: Map<string, string>;
  filteredProducts: Product[];
  search: string;
  onAddProduct: (product: Product) => void;
  onCategoryChange: (categoryId: string) => void;
  onSearchChange: (value: string) => void;
}

export function PosCatalog(props: PosCatalogProps) {
  const {
    categories,
    categoryId,
    categoryMap,
    filteredProducts,
    search,
    onAddProduct,
    onCategoryChange,
    onSearchChange,
  } = props;

  return (
    <section className="pos-catalog tactile-menu-board">
      <div className="board-topline">
        <div>
          <span>01 / MENU BOARD</span>
          <strong>Pilih produk untuk ditambahkan</strong>
        </div>
        <div className="board-doodle">tap menu ↘</div>
      </div>

      <div className="pos-command-bar tactile-command-bar">
        <label className="pos-search tactile-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Cari nama menu atau SKU"
            autoFocus
          />
          <kbd>⌘ K</kbd>
        </label>
        <div className="pos-result-count tactile-result-note">
          <strong>{String(filteredProducts.length).padStart(2, '0')}</strong>
          <span>menu tersedia</span>
        </div>
      </div>

      <div className="pos-category-strip tactile-category-strip">
        <button
          className={`pos-category ${categoryId === 'all' ? 'active' : ''}`}
          onClick={() => onCategoryChange('all')}
        >
          Semua menu
        </button>
        {categories.filter((item) => item.isActive).map((category) => (
          <button
            key={category.id}
            className={`pos-category ${categoryId === category.id ? 'active' : ''}`}
            onClick={() => onCategoryChange(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="card tactile-empty-board">
          <EmptyState
            title="Menu tidak ditemukan"
            description="Coba kategori atau kata pencarian lain."
          />
        </div>
      ) : (
        <div className="pos-product-grid tactile-product-grid">
          {filteredProducts.map((product, index) => {
            const outOfStock = product.trackStock && product.stockQty <= 0;

            return (
              <button
                key={product.id}
                className="pos-product-card tactile-product-card"
                disabled={outOfStock}
                onClick={() => onAddProduct(product)}
              >
                <div className="product-card-index">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <div className="pos-product-media tactile-product-media">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} />
                  ) : (
                    <Coffee size={31} />
                  )}
                </div>
                <div className="pos-product-info tactile-product-info">
                  <div className="product-meta-line">
                    <span>{categoryMap.get(product.categoryId) ?? 'Menu'}</span>
                    <small>{product.sku}</small>
                  </div>
                  <strong>{product.name}</strong>
                  <div className="product-price-line">
                    <b>{formatCurrency(product.price)}</b>
                    <span className="add-product"><Plus size={15} /></span>
                  </div>
                </div>
                <span className={`stock-pill tactile-stock-note ${outOfStock ? 'out' : ''}`}>
                  {product.trackStock
                    ? (outOfStock ? 'HABIS' : `${product.stockQty} READY`)
                    : 'READY'}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
