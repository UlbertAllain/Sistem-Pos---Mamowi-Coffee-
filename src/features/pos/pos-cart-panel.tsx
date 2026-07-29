/* eslint-disable @next/next/no-img-element */
'use client';

import { ArrowUpRight, Coffee, Minus, Plus, ShoppingBag, Trash2, WalletCards } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';
import type { Product } from '@/types/models';
import type { CalculatedCart, CartLine } from './cart-domain';

interface CartItem {
  line: CartLine;
  product: Product;
}

interface PosCartPanelProps {
  calculated: CalculatedCart | null;
  cartCount: number;
  cartError: string | null;
  cartItems: CartItem[];
  discount: number;
  maxDiscount: number;
  total: number;
  onClear: () => void;
  onOpenPayment: () => void;
  onRemoveProduct: (productId: string) => void;
  onSetDiscount: (discount: number) => void;
  onSetQuantity: (productId: string, quantity: number) => void;
}

export function PosCartPanel(props: PosCartPanelProps) {
  const {
    calculated,
    cartCount,
    cartError,
    cartItems,
    discount,
    maxDiscount,
    total,
    onClear,
    onOpenPayment,
    onRemoveProduct,
    onSetDiscount,
    onSetQuantity,
  } = props;

  return (
    <aside className="pos-cart-panel tactile-order-board">
      <div className="order-board-label">02 / ORDER BOARD</div>
      <div className="pos-cart-head tactile-cart-head">
        <div>
          <span className="eyebrow">PESANAN AKTIF</span>
          <h2>Current Order</h2>
        </div>
        <span className="cart-count tactile-cart-count">{cartCount} item</span>
      </div>

      <div className="pos-cart-body tactile-cart-body">
        {cartItems.length === 0 ? (
          <div className="pos-empty-cart tactile-empty-cart">
            <ShoppingBag size={30} />
            <strong>Keranjang masih kosong</strong>
            <p>Pilih menu dari papan sebelah kiri.</p>
            <div className="empty-cart-note">order muncul di sini ↗</div>
          </div>
        ) : (
          <div className="pos-cart-list tactile-cart-list">
            {cartItems.map(({ line, product }, index) => (
              <article className="pos-cart-item tactile-cart-item" key={product.id}>
                <span className="cart-item-index">{String(index + 1).padStart(2, '0')}</span>
                <div className="cart-thumb tactile-cart-thumb">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt="" />
                  ) : (
                    <Coffee size={18} />
                  )}
                </div>
                <div className="cart-item-copy">
                  <strong>{product.name}</strong>
                  <span>{formatCurrency(product.price)} / item</span>
                </div>
                <strong className="cart-line-total">
                  {formatCurrency(product.price * line.quantity)}
                </strong>
                <div className="cart-quantity tactile-quantity-control">
                  <button onClick={() => onSetQuantity(product.id, line.quantity - 1)}>
                    <Minus size={14} />
                  </button>
                  <span>{line.quantity}</span>
                  <button
                    onClick={() => onSetQuantity(product.id, line.quantity + 1)}
                    disabled={product.trackStock && line.quantity >= product.stockQty}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button
                  className="cart-remove"
                  onClick={() => onRemoveProduct(product.id)}
                  aria-label="Hapus"
                >
                  <Trash2 size={15} />
                </button>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="pos-cart-summary tactile-cart-summary">
        <div className="summary-row">
          <span>Subtotal</span>
          <strong>{formatCurrency(calculated?.subtotal ?? 0)}</strong>
        </div>

        <label className="discount-field tactile-discount-field">
          <span>Diskon</span>
          <input
            type="number"
            min="0"
            value={discount}
            onChange={(event) => onSetDiscount(Number(event.target.value))}
            disabled={!cartItems.length}
          />
          <small>Maks. {formatCurrency(maxDiscount)}</small>
        </label>

        {cartError ? <div className="inline-alert inline-alert-error">{cartError}</div> : null}

        <div className="pos-grand-total tactile-grand-total">
          <span>Total pembayaran</span>
          <strong>{formatCurrency(total)}</strong>
        </div>

        <Button size="lg" disabled={!calculated || Boolean(cartError)} onClick={onOpenPayment}>
          <WalletCards size={18} />
          Bayar sekarang
          <ArrowUpRight size={16} />
        </Button>

        {cartItems.length ? (
          <button
            className="clear-cart"
            onClick={() => window.confirm('Kosongkan keranjang?') && onClear()}
          >
            Kosongkan pesanan
          </button>
        ) : null}
      </div>
    </aside>
  );
}
