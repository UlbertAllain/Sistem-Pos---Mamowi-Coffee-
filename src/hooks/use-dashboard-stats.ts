import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/constants";

interface DashboardStats {
  todayRevenue: number;
  yesterdayRevenue: number;
  todayOrders: number;
  yesterdayOrders: number;
  todayCustomers: number;
  yesterdayCustomers: number;
  avgPerOrder: number;
  lowStockCount: number;
}

interface TopSellingItem {
  name: string;
  quantity: number;
  revenue: number;
}

interface PaymentBreakdown {
  method: string;
  count: number;
  total: number;
}

interface HourlyData {
  hour: string;
  revenue: number;
  orders: number;
}

function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getEndOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topItems, setTopItems] = useState<TopSellingItem[]>([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdown[]>(
    [],
  );
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const now = new Date();
        const todayStart = Timestamp.fromDate(getStartOfDay(now));
        const todayEnd = Timestamp.fromDate(getEndOfDay(now));
        const yesterdayStart = Timestamp.fromDate(
          getStartOfDay(new Date(now.getTime() - 86400000)),
        );
        const yesterdayEnd = Timestamp.fromDate(
          getEndOfDay(new Date(now.getTime() - 86400000)),
        );

        const orderRef = collection(db, COLLECTIONS.orders);
        const qToday = query(
          orderRef,
          where("timestamps.paidAt", ">=", todayStart),
          where("timestamps.paidAt", "<=", todayEnd),
          where("status", "in", ["paid", "completed"]),
        );
        const qYesterday = query(
          orderRef,
          where("timestamps.paidAt", ">=", yesterdayStart),
          where("timestamps.paidAt", "<=", yesterdayEnd),
          where("status", "in", ["paid", "completed"]),
        );

        const [snapToday, snapYesterday] = await Promise.all([
          getDocs(qToday),
          getDocs(qYesterday),
        ]);

        const processOrders = (snap: Awaited<typeof snapToday>) => {
          let revenue = 0;
          let orders = 0;
          const customers = new Set<string>();
          const itemsMap: Record<
            string,
            { name: string; quantity: number; revenue: number }
          > = {};
          const payments: Record<string, { count: number; total: number }> = {};
          const hours: Record<number, { revenue: number; orders: number }> = {};

          snap.docs.forEach((d) => {
            const o = d.data();
            if (o.status === "voided") return;
            revenue += o.totalAmount || 0;
            orders += 1;
            if (o.customerId) customers.add(o.customerId);
            if (o.customerName) customers.add(o.customerName);
            (o.items || []).forEach(
              (item: { name: string; quantity: number; subtotal: number }) => {
                if (!itemsMap[item.name])
                  itemsMap[item.name] = {
                    name: item.name,
                    quantity: 0,
                    revenue: 0,
                  };
                itemsMap[item.name].quantity += item.quantity;
                itemsMap[item.name].revenue += item.subtotal || 0;
              },
            );
            (o.payments || []).forEach(
              (p: { method: string; amount: number }) => {
                if (!payments[p.method])
                  payments[p.method] = { count: 0, total: 0 };
                payments[p.method].count += 1;
                payments[p.method].total += p.amount || 0;
              },
            );

            const paidAt = o.timestamps?.paidAt?.toDate();
            if (paidAt) {
              const h = paidAt.getHours();
              if (!hours[h]) hours[h] = { revenue: 0, orders: 0 };
              hours[h].revenue += o.totalAmount || 0;
              hours[h].orders += 1;
            }
          });

          return {
            revenue,
            orders,
            customers: customers.size,
            itemsMap,
            payments,
            hours,
          };
        };

        const today = processOrders(snapToday);
        const yesterday = processOrders(snapYesterday);

        const top = Object.values(today.itemsMap)
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5);
        const payBreak = Object.entries(today.payments).map(
          ([method, data]) => ({ method, ...data }),
        );
        const hourly = Array.from({ length: 24 }, (_, i) => ({
          hour: `${String(i).padStart(2, "0")}:00`,
          revenue: today.hours[i]?.revenue || 0,
          orders: today.hours[i]?.orders || 0,
        })).filter((h) => h.revenue > 0 || h.orders > 0);

        setStats({
          todayRevenue: today.revenue,
          yesterdayRevenue: yesterday.revenue,
          todayOrders: today.orders,
          yesterdayOrders: yesterday.orders,
          todayCustomers: today.customers,
          yesterdayCustomers: yesterday.customers,
          avgPerOrder:
            today.orders > 0 ? Math.round(today.revenue / today.orders) : 0,
          lowStockCount: 0, // dihitung terpisah
        });
        setTopItems(top);
        setPaymentBreakdown(payBreak);
        setHourlyData(hourly);
      } catch (error) {
        console.error("Dashboard stats error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, topItems, paymentBreakdown, hourlyData, isLoading };
}
