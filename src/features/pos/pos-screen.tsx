'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ErrorState, LoadingState } from '@/components/ui/states';
import { MAX_DISTINCT_PRODUCTS_PER_ORDER } from '@/lib/constraints';
import { getErrorMessage } from '@/lib/errors';
import { createId } from '@/lib/id';
import type { Order, PaymentMethod, Product, StoreSettings, UserProfile } from '@/types/models';
import { calculateCart, type CalculatedCart } from './cart-domain';
import { useCartStore } from './cart-store';
import { checkout } from './checkout-service';
import { PosCartPanel } from './pos-cart-panel';
import { PosCatalog } from './pos-catalog';
import { PosPaymentModals } from './pos-payment-modals';
import { createReceiptOrder, createSellableProductMap } from './pos-screen-helpers';

interface PosScreenProps {
  profile: UserProfile;
  products: Product[];
  categories: { id: string; name: string; isActive: boolean }[];
  paymentMethods: PaymentMethod[];
  settings: StoreSettings | null;
  loading: boolean;
  error: string | null;
}

export function PosScreen(props: PosScreenProps) {
  const { profile, products, categories, paymentMethods, settings, loading, error } = props;
  const cart = useCartStore();
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
  const productsForCart = useMemo(() => createSellableProductMap(products), [products]);
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
    if (cart.lines.length) {
      calculated = calculateCart(
        cart.lines,
        productsForCart,
        cart.discount,
        settings?.maxDiscount ?? 0,
      );
    }
  } catch (cause) {
    cartError = getErrorMessage(cause);
  }

  const cartItems = cart.lines.flatMap((line) => {
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
    const isNewProduct = !cart.lines.some((line) => line.productId === product.id);
    if (isNewProduct && cart.lines.length >= MAX_DISTINCT_PRODUCTS_PER_ORDER) {
      toast.error(`Maksimal ${MAX_DISTINCT_PRODUCTS_PER_ORDER} jenis produk per transaksi.`);
      return;
    }
    cart.addProduct(product);
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
        items: cart.lines,
        discount: cart.discount,
        paid: selectedMethod.type === 'cash' ? Number(cashPaid) : calculated.total,
        paymentMethodId: selectedMethod.id,
      });

      cart.clear();
      setCompletedOrder(createReceiptOrder(result));
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
        <PosCatalog
          categories={categories}
          categoryId={categoryId}
          categoryMap={categoryMap}
          filteredProducts={filteredProducts}
          search={search}
          onAddProduct={addToCart}
          onCategoryChange={setCategoryId}
          onSearchChange={setSearch}
        />
        <PosCartPanel
          calculated={calculated}
          cartCount={cartCount}
          cartError={cartError}
          cartItems={cartItems}
          discount={cart.discount}
          maxDiscount={settings?.maxDiscount ?? 0}
          total={total}
          onClear={cart.clear}
          onOpenPayment={openPayment}
          onRemoveProduct={cart.removeProduct}
          onSetDiscount={cart.setDiscount}
          onSetQuantity={cart.setQuantity}
        />
      </div>
      <PosPaymentModals
        activeMethods={activeMethods}
        cashPaid={cashPaid}
        change={change}
        checkoutError={checkoutError}
        completedOrder={completedOrder}
        paymentOpen={paymentOpen}
        paymentReady={paymentReady}
        quickCash={quickCash}
        selectedMethodId={selectedMethodId}
        settings={settings}
        submitting={submitting}
        total={total}
        onCashPaidChange={setCashPaid}
        onCheckout={handleCheckout}
        onCloseCompletedOrder={() => setCompletedOrder(null)}
        onClosePayment={closePayment}
        onMethodChange={(method) => {
          setSelectedMethodId(method.id);
          setCashPaid(method.type === 'cash' ? String(total) : '');
        }}
      />
    </>
  );
}
