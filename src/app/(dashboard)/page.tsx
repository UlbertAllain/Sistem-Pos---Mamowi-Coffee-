"use client";

import { PageHeader } from "@/components/layout/page-header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { useIngredients } from "@/hooks/use-ingredients";
import { useAuthStore } from "@/stores/auth-store";
import { formatRupiah } from "@/lib/utils";
import { PAYMENT_METHODS } from "@/constants";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Receipt,
  Package,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { stats, topItems, paymentBreakdown, hourlyData, isLoading } =
    useDashboardStats();
  const { ingredients } = useIngredients();

  const lowStockCount = ingredients.filter((i) => i.lowStockAlert).length;

  const calcChange = (today: number, yesterday: number): number => {
    if (yesterday === 0) return today > 0 ? 100 : 0;
    return Math.round(((today - yesterday) / yesterday) * 100);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Dashboard" description="Memuat data..." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] w-full rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-[320px] lg:col-span-2 rounded-xl" />
          <Skeleton className="h-[320px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Dashboard"
        description={`Selamat datang, ${user?.displayName || "User"}! Berikut ringkasan hari ini.`}
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Pendapatan Hari Ini"
          value={formatRupiah(stats.todayRevenue)}
          change={calcChange(stats.todayRevenue, stats.yesterdayRevenue)}
          icon={DollarSign}
          iconBg="bg-success-50"
          iconColor="text-success-600"
        />
        <StatsCard
          label="Total Pesanan"
          value={String(stats.todayOrders)}
          change={calcChange(stats.todayOrders, stats.yesterdayOrders)}
          icon={ShoppingCart}
          iconBg="bg-info-50"
          iconColor="text-info-600"
        />
        <StatsCard
          label="Pelanggan"
          value={String(stats.todayCustomers)}
          change={calcChange(stats.todayCustomers, stats.yesterdayCustomers)}
          icon={Users}
          iconBg="bg-warning-50"
          iconColor="text-warning-600"
        />
        <StatsCard
          label="Rata-rata / Pesanan"
          value={formatRupiah(stats.avgPerOrder)}
          change={0}
          icon={Receipt}
          iconBg="bg-espresso-50"
          iconColor="text-espresso-600"
        />
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Pendapatan Hari Ini</CardTitle>
              <Badge variant="secondary">Hari Ini</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <RevenueChart data={hourlyData} />
          </CardContent>
        </Card>

        {/* Top Selling */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Menu Terlaris</CardTitle>
          </CardHeader>
          <CardContent>
            {topItems.length === 0 ? (
              <p className="py-8 text-center text-sm text-espresso-400">
                Belum ada data
              </p>
            ) : (
              <div className="space-y-4">
                {topItems.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-espresso-100 text-xs font-bold text-espresso-600">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">
                        {item.name}
                      </p>
                      <p className="text-xs text-espresso-400">
                        {item.quantity} terjual
                      </p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums">
                      {formatRupiah(item.revenue)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Metode Pembayaran</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentBreakdown.length === 0 ? (
              <p className="py-6 text-center text-sm text-espresso-400">
                Belum ada data
              </p>
            ) : (
              <div className="space-y-3">
                {paymentBreakdown.map((pm) => {
                  const total = paymentBreakdown.reduce(
                    (s, p) => s + p.total,
                    0,
                  );
                  const pct =
                    total > 0 ? Math.round((pm.total / total) * 100) : 0;
                  const methodLabel =
                    PAYMENT_METHODS.find((m) => m.value === pm.method)?.label ||
                    pm.method;

                  return (
                    <div key={pm.method}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-espresso-700 font-medium">
                          {methodLabel}
                        </span>
                        <span className="tabular-nums font-semibold">
                          {formatRupiah(pm.total)}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-espresso-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-espresso-600 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-espresso-400 mt-0.5">
                        {pm.count} transaksi • {pct}%
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Stok Rendah
              {lowStockCount > 0 && (
                <Badge variant="warning" className="text-[10px]">
                  {lowStockCount}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockCount === 0 ? (
              <p className="py-6 text-center text-sm text-espresso-400">
                Semua stok aman
              </p>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {ingredients
                  .filter((i) => i.lowStockAlert)
                  .slice(0, 8)
                  .map((ing) => (
                    <div
                      key={ing.id}
                      className="flex items-center justify-between rounded-lg bg-warning-50 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-espresso-800">
                          {ing.name}
                        </p>
                        <p className="text-[11px] text-espresso-500">
                          Min: {ing.minStockLevel} {ing.unit}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-warning-700 tabular-nums">
                        {ing.currentStock} {ing.unit}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
