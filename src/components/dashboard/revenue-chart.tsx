"use client";

import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatRupiah } from "@/lib/utils";

interface RevenueChartProps {
  data: { hour: string; revenue: number; orders: number }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-espresso-200 bg-espresso-50/50">
        <p className="text-sm text-espresso-400">
          Belum ada data penjualan hari ini
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#e0cba8"
          vertical={false}
        />
        <XAxis
          dataKey="hour"
          tick={{ fontSize: 10, fill: "#a87640" }}
          axisLine={false}
          tickLine={false}
          interval={1}
        />
        <YAxis
          tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 10, fill: "#a87640" }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip
          formatter={(value) => {
            const v = typeof value === "number" ? value : Number(value);
            if (!Number.isFinite(v)) return ["Rp0", "Pendapatan"] as const;
            return [formatRupiah(v), "Pendapatan"] as const;
          }}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e0cba8",
            fontSize: "12px",
          }}
        />
        <Bar dataKey="revenue" fill="#a87640" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
