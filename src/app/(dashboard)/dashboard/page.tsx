"use client";

import {
  AlertTriangle,
  Banknote,
  PackageCheck,
  ReceiptText,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { PageHeader } from "@/components/ui/page-header";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { useAuth } from "@/features/auth/auth-context";
import { useCatalog } from "@/features/catalog/use-catalog";
import { useRecentOrders } from "@/features/orders/use-orders";
import { calculateSalesSummary } from "@/features/reports/report-domain";
import { useSettings } from "@/features/settings/use-settings";
import {
  formatCurrency,
  formatDateTime,
  getJakartaDateKey,
} from "@/lib/format";

export default function DashboardPage() {
  const { profile } = useAuth();
  const catalog = useCatalog(profile?.storeId);
  const ordersState = useRecentOrders(profile?.storeId, 100);
  const settingsState = useSettings(profile?.storeId);

  const todayOrders = useMemo(() => {
    const today = getJakartaDateKey();
    return ordersState.orders.filter(
      (order) =>
        order.createdAt &&
        getJakartaDateKey(order.createdAt.toDate()) === today,
    );
  }, [ordersState.orders]);
  const summary = useMemo(
    () => calculateSalesSummary(todayOrders),
    [todayOrders],
  );
  const threshold = settingsState.settings?.lowStockThreshold ?? 5;
  const lowStockProducts = useMemo(
    () =>
      catalog.products
        .filter(
          (product) =>
            product.isActive &&
            product.trackStock &&
            product.stockQty <= threshold,
        )
        .sort((left, right) => left.stockQty - right.stockQty),
    [catalog.products, threshold],
  );

  if (!profile) return null;
  const loading =
    catalog.loading || ordersState.loading || settingsState.loading;
  const error = catalog.error ?? ordersState.error ?? settingsState.error;

  return (
    <>
      <PageHeader
        eyebrow="Ringkasan hari ini"
        title={`Halo, ${profile.name}`}
        description="Pantau penjualan dan stok yang memerlukan perhatian tanpa membuka modul yang tidak diperlukan."
        actions={
          <Link href="/pos" className="button button-primary button-md">
            Buka kasir
          </Link>
        }
      />
      {loading ? (
        <LoadingState label="Menyiapkan dashboard..." />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <>
          <section className="stats-grid">
            <article className="card stat-card">
              <div className="stat-icon">
                <Banknote size={19} />
              </div>
              <strong>{formatCurrency(summary.netSales)}</strong>
              <span>Penjualan bersih hari ini</span>
            </article>
            <article className="card stat-card">
              <div className="stat-icon">
                <ReceiptText size={19} />
              </div>
              <strong>{summary.transactionCount}</strong>
              <span>Transaksi berhasil</span>
            </article>
            <article className="card stat-card">
              <div className="stat-icon">
                <ShoppingBag size={19} />
              </div>
              <strong>{summary.itemsSold}</strong>
              <span>Item terjual</span>
            </article>
            <article className="card stat-card">
              <div className="stat-icon">
                <AlertTriangle size={19} />
              </div>
              <strong>{lowStockProducts.length}</strong>
              <span>Produk stok rendah</span>
            </article>
          </section>
          <div className="content-grid">
            <section className="card">
              <div className="card-header">
                <div>
                  <h2>Transaksi terbaru</h2>
                  <p>Aktivitas penjualan terakhir pada toko.</p>
                </div>
                <Link
                  href="/transactions"
                  className="button button-secondary button-sm"
                >
                  Lihat semua
                </Link>
              </div>
              <div className="card-body">
                {ordersState.orders.slice(0, 7).length === 0 ? (
                  <p>Belum ada transaksi.</p>
                ) : (
                  <div className="list-stack">
                    {ordersState.orders.slice(0, 7).map((order) => (
                      <div className="list-row" key={order.id}>
                        <div className="stat-icon" style={{ margin: 0 }}>
                          <ReceiptText size={16} />
                        </div>
                        <div className="list-row-main">
                          <strong>{order.orderNumber}</strong>
                          <span>
                            {order.cashierName} ·{" "}
                            {formatDateTime(order.createdAt)}
                          </span>
                        </div>
                        <div className="list-row-value">
                          <strong>{formatCurrency(order.total)}</strong>
                          <span
                            className={`badge ${order.status === "paid" ? "badge-success" : "badge-danger"}`}
                          >
                            {order.status === "paid" ? "Dibayar" : "Void"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
            <aside className="card">
              <div className="card-header">
                <div>
                  <h2>Stok rendah</h2>
                  <p>Batas saat ini: {threshold}</p>
                </div>
                <Link
                  href="/products"
                  className="button button-secondary button-sm"
                >
                  Kelola
                </Link>
              </div>
              <div className="card-body">
                {lowStockProducts.length === 0 ? (
                  <div className="state-panel" style={{ minHeight: 180 }}>
                    <PackageCheck size={27} />
                    <strong>Stok aman</strong>
                    <p>Tidak ada produk di bawah batas.</p>
                  </div>
                ) : (
                  <div className="list-stack">
                    {lowStockProducts.slice(0, 8).map((product) => (
                      <div className="list-row" key={product.id}>
                        <div className="list-row-main">
                          <strong>{product.name}</strong>
                          <span>{product.sku}</span>
                        </div>
                        <span
                          className={`badge ${product.stockQty === 0 ? "badge-danger" : "badge-warning"}`}
                        >
                          {product.stockQty}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </>
      )}
    </>
  );
}
