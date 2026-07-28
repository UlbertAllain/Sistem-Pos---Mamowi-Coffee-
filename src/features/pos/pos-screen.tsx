/* eslint-disable @next/next/no-img-element */
'use client';

import { Timestamp } from 'firebase/firestore';
import {
  ArrowUpRight,
  BadgeCheck,
  Coffee,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  WalletCards,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { Receipt } from '@/features/orders/receipt';
import { MAX_DISTINCT_PRODUCTS_PER_ORDER } from '@/lib/constraints';
import { getErrorMessage } from '@/lib/errors';
import { formatCurrency } from '@/lib/format';
import { createId } from '@/lib/id';
import type { Order, PaymentMethod, Product, StoreSettings, UserProfile } from '@/types/models';
import { calculateCart, type CalculatedCart, type SellableProduct } from './cart-domain';
import { useCartStore } from './cart-store';
import { checkout } from './checkout-service';

interface PosScreenProps {
  profile: UserProfile;
  products: Product[];
  categories: { id: string; name: string; isActive: boolean }[];
  paymentMethods: PaymentMethod[];
  settings: StoreSettings | null;
  loading: boolean;
  error: string | null;
}

function sellableMap(products: Product[]): Map<string, SellableProduct> {
  return new Map(products.map((product) => [product.id, {
    id: product.id,
    sku: product.sku,
    name: product.name,
    price: product.price,
    stockQty: product.stockQty,
    trackStock: product.trackStock,
    isActive: product.isActive,
  }]));
}

export function PosScreen(props: PosScreenProps) {
  const { profile, products, categories, paymentMethods, settings, loading, error } = props;
  const { lines, discount, addProduct, setQuantity, removeProduct, setDiscount, clear } = useCartStore();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedMethodId, setSelectedMethodId] = useState('');
  const [cashPaid, setCashPaid] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );
  const productsForCart = useMemo(() => sellableMap(products), [products]);
  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );
  const activeMethods = useMemo(
    () => paymentMethods.filter((method) => method.isActive),
    [paymentMethods],
  );
  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return products.filter((product) => product.isActive
      && (categoryId === 'all' || product.categoryId === categoryId)
      && (!keyword || `${product.name} ${product.sku}`.toLowerCase().includes(keyword)));
  }, [categoryId, products, search]);

  let calculated: CalculatedCart | null = null;
  let cartError: string | null = null;

  try {
    if (lines.length) {
      calculated = calculateCart(
        lines,
        productsForCart,
        discount,
        settings?.maxDiscount ?? 0,
      );
    }
  } catch (cause) {
    cartError = getErrorMessage(cause);
  }

  const cartItems = lines.flatMap((line) => {
    const product = productById.get(line.productId);
    return product ? [{ line, product }] : [];
  });
  const cartCount = cartItems.reduce((totalItems, item) => totalItems + item.line.quantity, 0);
  const selectedMethod = activeMethods.find((method) => method.id === selectedMethodId);
  const total = calculated?.total ?? 0;
  const paid = selectedMethod?.type === 'cash' ? Number(cashPaid || 0) : total;
  const paymentReady = selectedMethod?.type === 'cash'
    ? Number.isSafeInteger(paid) && paid >= total
    : Boolean(selectedMethod) && Number.isSafeInteger(total);
  const change = paymentReady ? Math.max(0, paid - total) : 0;
  const quickCash = [...new Set(
    [10000, 20000, 50000, 100000]
      .map((unit) => Math.ceil(total / unit) * unit)
      .filter((value) => value >= total && value > 0),
  )];

  const addToCart = (product: Product) => {
    if (
      !lines.some((line) => line.productId === product.id)
      && lines.length >= MAX_DISTINCT_PRODUCTS_PER_ORDER
    ) {
      toast.error(`Maksimal ${MAX_DISTINCT_PRODUCTS_PER_ORDER} jenis produk per transaksi.`);
      return;
    }

    addProduct(product);
  };

  const openPayment = () => {
    if (!calculated || cartError) return;

    const method = activeMethods[0];
    if (!method) {
      toast.error('Belum ada metode pembayaran aktif.');
      return;
    }

    setSelectedMethodId(method.id);
    setCashPaid(method.type === 'cash' ? String(calculated.total) : '');
    setCheckoutError(null);
    setPendingOrderId(createId('ord'));
    setPaymentOpen(true);
  };

  const closePayment = () => {
    if (submitting) return;

    setPaymentOpen(false);
    setPendingOrderId(null);
    setCheckoutError(null);
  };

  const handleCheckout = async () => {
    if (!calculated || !selectedMethod || !pendingOrderId) return;

    setSubmitting(true);
    setCheckoutError(null);

    try {
      const result = await checkout({
        orderId: pendingOrderId,
        storeId: profile.storeId,
        items: lines,
        discount,
        paid: selectedMethod.type === 'cash' ? Number(cashPaid) : calculated.total,
        paymentMethodId: selectedMethod.id,
      });

      const receiptOrder: Order = {
        id: result.orderId,
        schemaVersion: 2,
        sequence: result.sequence,
        storeId: result.storeId,
        orderNumber: result.orderNumber,
        cashierId: result.cashierId,
        cashierName: result.cashierName,
        requestFingerprint: '',
        items: result.items,
        subtotal: result.subtotal,
        discount: result.discount,
        total: result.total,
        paid: result.paid,
        change: result.change,
        paymentMethodId: result.paymentMethodId,
        paymentMethodName: result.paymentMethodName,
        status: 'paid',
        paymentStatus: 'paid',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      clear();
      setCompletedOrder(receiptOrder);
      setPaymentOpen(false);
      setPendingOrderId(null);
      toast.success(`Transaksi ${result.orderNumber} berhasil.`);
    } catch (cause) {
      setCheckoutError(getErrorMessage(cause));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState label="Menyiapkan menu kasir..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <>
      <div className="pos-workspace tactile-pos-workspace">
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
                onChange={(event) => setSearch(event.target.value)}
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
              onClick={() => setCategoryId('all')}
            >
              Semua menu
            </button>
            {categories.filter((item) => item.isActive).map((category) => (
              <button
                key={category.id}
                className={`pos-category ${categoryId === category.id ? 'active' : ''}`}
                onClick={() => setCategoryId(category.id)}
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
                    onClick={() => addToCart(product)}
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
                      <button onClick={() => setQuantity(product.id, line.quantity - 1)}>
                        <Minus size={14} />
                      </button>
                      <span>{line.quantity}</span>
                      <button
                        onClick={() => setQuantity(product.id, line.quantity + 1)}
                        disabled={product.trackStock && line.quantity >= product.stockQty}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button
                      className="cart-remove"
                      onClick={() => removeProduct(product.id)}
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
                onChange={(event) => setDiscount(Number(event.target.value))}
                disabled={!lines.length}
              />
              <small>Maks. {formatCurrency(settings?.maxDiscount ?? 0)}</small>
            </label>

            {cartError ? <div className="inline-alert inline-alert-error">{cartError}</div> : null}

            <div className="pos-grand-total tactile-grand-total">
              <span>Total pembayaran</span>
              <strong>{formatCurrency(total)}</strong>
            </div>

            <Button size="lg" disabled={!calculated || Boolean(cartError)} onClick={openPayment}>
              <WalletCards size={18} />
              Bayar sekarang
              <ArrowUpRight size={16} />
            </Button>

            {cartItems.length ? (
              <button
                className="clear-cart"
                onClick={() => window.confirm('Kosongkan keranjang?') && clear()}
              >
                Kosongkan pesanan
              </button>
            ) : null}
          </div>
        </aside>
      </div>

      <Modal
        open={paymentOpen}
        title="Selesaikan pembayaran"
        description="Pilih metode dan pastikan nominal sudah benar."
        onClose={closePayment}
        width="sm"
      >
        <div className="payment-total-card tactile-payment-total">
          <span>Total tagihan</span>
          <strong>{formatCurrency(total)}</strong>
        </div>

        <div className="form-stack">
          <div className="payment-method-grid tactile-payment-methods">
            {activeMethods.map((method) => (
              <button
                key={method.id}
                className={`payment-method ${selectedMethodId === method.id ? 'payment-method-active' : ''}`}
                onClick={() => {
                  setSelectedMethodId(method.id);
                  setCashPaid(method.type === 'cash' ? String(total) : '');
                }}
              >
                <WalletCards size={18} />
                <strong>{method.name}</strong>
                <span>{method.type === 'cash' ? 'Tunai' : 'Non-tunai'}</span>
              </button>
            ))}
          </div>

          {selectedMethod?.type === 'cash' ? (
            <>
              <label className="field">
                <span>Uang diterima</span>
                <input
                  className="payment-input"
                  type="number"
                  min={total}
                  value={cashPaid}
                  onChange={(event) => setCashPaid(event.target.value)}
                />
              </label>
              <div className="quick-cash">
                {quickCash.map((value) => (
                  <button key={value} onClick={() => setCashPaid(String(value))}>
                    {formatCurrency(value)}
                  </button>
                ))}
              </div>
              <div className="change-card tactile-change-card">
                <span>Kembalian</span>
                <strong>{formatCurrency(change)}</strong>
              </div>
            </>
          ) : (
            <div className="inline-alert inline-alert-warning">
              Pastikan pembayaran non-tunai sudah berhasil sebelum transaksi diselesaikan.
            </div>
          )}

          {checkoutError ? (
            <div className="inline-alert inline-alert-error">{checkoutError}</div>
          ) : null}

          <div className="form-actions">
            <Button variant="secondary" onClick={closePayment} disabled={submitting}>
              Batal
            </Button>
            <Button onClick={handleCheckout} disabled={submitting || !paymentReady}>
              {submitting ? 'Memproses...' : (
                <>
                  <BadgeCheck size={18} />
                  Konfirmasi pembayaran
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(completedOrder)}
        title="Pembayaran berhasil"
        description={completedOrder?.orderNumber}
        onClose={() => setCompletedOrder(null)}
        width="sm"
      >
        {completedOrder ? <Receipt order={completedOrder} settings={settings} /> : null}
      </Modal>
    </>
  );
}
