"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useReports } from "@/hooks/use-reports";
import { formatRupiah } from "@/lib/utils";
import { ORDER_TYPES, PAYMENT_METHODS } from "@/constants";
import {
  CalendarDays,
  Download,
  Filter,
  DollarSign,
  ShoppingCart,
  Receipt,
} from "lucide-react";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = [
  "#a87640",
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
];

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [activeTab, setActiveTab] = useState<"sales" | "items" | "payments">(
    "sales",
  );

  const start = new Date(startDate);
  const end = new Date(endDate);
  const { orders, isLoading } = useReports(start, end);

  const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
  const totalOrders = orders.length;
  const totalCustomers = new Set(
    orders.flatMap((o) =>
      o.customerId ? [o.customerId] : o.customerName ? [o.customerName] : [],
    ),
  ).size;
  const avgPerOrder =
    totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  // Items breakdown
  const itemsMap: Record<
    string,
    { name: string; quantity: number; revenue: number }
  > = {};
  orders.forEach((o) => {
    (o.items || []).forEach((item) => {
      if (!itemsMap[item.name])
        itemsMap[item.name] = { name: item.name, quantity: 0, revenue: 0 };
      itemsMap[item.name].quantity += item.quantity;
      itemsMap[item.name].revenue += item.subtotal;
    });
  });
  const topItems = Object.values(itemsMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 15);

  // Payment breakdown
  const payMap: Record<string, { count: number; total: number }> = {};
  orders.forEach((o) => {
    (o.payments || []).forEach((p) => {
      if (!payMap[p.method]) payMap[p.method] = { count: 0, total: 0 };
      payMap[p.method].count += 1;
      payMap[p.method].total += p.amount;
    });
  });
  const paymentData = Object.entries(payMap).map(([method, data]) => ({
    name: PAYMENT_METHODS.find((m) => m.value === method)?.label || method,
    value: data.total,
    count: data.count,
  }));

  // Order type breakdown
  const typeMap: Record<string, { count: number; revenue: number }> = {};
  orders.forEach((o) => {
    if (!typeMap[o.orderType]) typeMap[o.orderType] = { count: 0, revenue: 0 };
    typeMap[o.orderType].count += 1;
    typeMap[o.orderType].revenue += o.totalAmount;
  });
  const typeData = Object.entries(typeMap).map(([type, data]) => ({
    name: ORDER_TYPES.find((t) => t.value === type)?.label || type,
    value: data.revenue,
    count: data.count,
  }));

  const exportCSV = () => {
    const header = "No,Order ID,Tanggal,Jenis,Total,Metode Bayar,Item\n";
    const rows = orders
      .map((o, i) => {
        const items = (o.items || [])
          .map((it) => `${it.quantity}x ${it.name}`)
          .join("; ");
        const payment = (o.payments || []).map((p) => p.method).join("; ");
        return `${i + 1},"${o.id}",${o.timestamps.paidAt?.toLocaleDateString("id-ID") || ""},${o.orderType},${o.totalAmount},"${payment}","${items}"`;
      })
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-${startDate}-to-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: "sales" as const, label: "Penjualan", icon: DollarSign },
    { id: "items" as const, label: "Per Item", icon: ShoppingCart },
    { id: "payments" as const, label: "Pembayaran", icon: Receipt },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Laporan"
        description="Analisis penjualan dan laporan bisnis"
      >
        <Button
          variant="outline"
          onClick={exportCSV}
          disabled={orders.length === 0}
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </PageHeader>

      {/* Date Filter */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 p-4">
          <div className="flex items-end gap-2">
            <Filter className="h-5 w-5 text-espresso-400 mb-2" />
            <Input
              label="Dari"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40"
            />
            <Input
              label="Sampai"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex gap-3 text-sm text-espresso-500 pb-0.5">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              {start.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}{" "}
              —{" "}
              {end.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-xl" />
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-espresso-500">Total Pendapatan</p>
                <p className="text-xl font-bold text-espresso-900 tabular-nums">
                  {formatRupiah(totalRevenue)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-espresso-500">Total Pesanan</p>
                <p className="text-xl font-bold text-espresso-900 tabular-nums">
                  {totalOrders}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-espresso-500">Pelanggan Unik</p>
                <p className="text-xl font-bold text-espresso-900 tabular-nums">
                  {totalCustomers}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-espresso-500">Rata-rata / Pesanan</p>
                <p className="text-xl font-bold text-espresso-900 tabular-nums">
                  {formatRupiah(avgPerOrder)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${activeTab === tab.id ? "bg-espresso-600 text-white" : "bg-white border border-espresso-200 text-espresso-600 hover:border-espresso-300"}`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sales Tab */}
          {activeTab === "sales" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Pendapatan per Jenis Pesanan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {typeData.length === 0 ? (
                    <p className="py-6 text-center text-sm text-espresso-400">
                      Tidak ada data
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={typeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          dataKey="value"
                          label={({ name, percent }) => {
                            const p = typeof percent === "number" ? percent : 0;
                            return `${name} ${(p * 100).toFixed(0)}%`;
                          }}
                        >
                          {typeData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => {
                            const v =
                              typeof value === "number" ? value : Number(value);
                            return formatRupiah(Number.isFinite(v) ? v : 0);
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Detail per Jenis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {typeData.map((t, i) => (
                      <div
                        key={t.name}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{
                              backgroundColor: COLORS[i % COLORS.length],
                            }}
                          />
                          <span className="text-sm font-medium">{t.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold tabular-nums">
                            {formatRupiah(t.value)}
                          </p>
                          <p className="text-[11px] text-espresso-400">
                            {t.count} pesanan
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Items Tab */}
          {activeTab === "items" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Menu Terlaris</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer
                  width="100%"
                  height={Math.max(300, topItems.length * 40)}
                >
                  <BarChart
                    data={topItems}
                    layout="vertical"
                    margin={{ left: 80, right: 20, top: 5, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e0cba8"
                      horizontal={false}
                    />
                    <XAxis type="number" tick={false} axisLine={false} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 11, fill: "#5f3f2a" }}
                      width={75}
                    />
                    <Tooltip
                      formatter={(value, name) => {
                        const v =
                          typeof value === "number" ? value : Number(value);
                        const safeName = typeof name === "string" ? name : "";
                        return [
                          formatRupiah(Number.isFinite(v) ? v : 0),
                          safeName,
                        ] as const;
                      }}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e0cba8",
                        fontSize: "12px",
                      }}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="#a87640"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Payments Tab */}
          {activeTab === "payments" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Distribusi Metode Pembayaran
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {paymentData.length === 0 ? (
                    <p className="py-6 text-center text-sm text-espresso-400">
                      Tidak ada data
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={paymentData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          dataKey="value"
                          label={({ name, percent }) => {
                            const p = typeof percent === "number" ? percent : 0;
                            return `${name} ${(p * 100).toFixed(0)}%`;
                          }}
                        >
                          {paymentData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => {
                            const v =
                              typeof value === "number" ? value : Number(value);
                            return formatRupiah(Number.isFinite(v) ? v : 0);
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Detail Pembayaran</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {paymentData.map((p, i) => {
                      const pct =
                        totalRevenue > 0
                          ? Math.round((p.value / totalRevenue) * 100)
                          : 0;
                      return (
                        <div key={p.name}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{
                                  backgroundColor: COLORS[i % COLORS.length],
                                }}
                              />
                              <span className="font-medium">{p.name}</span>
                            </div>
                            <span className="font-bold tabular-nums">
                              {formatRupiah(p.value)}
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-espresso-100 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: COLORS[i % COLORS.length],
                              }}
                            />
                          </div>
                          <p className="text-[11px] text-espresso-400">
                            {p.count} transaksi • {pct}%
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
