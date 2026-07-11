"use client";

import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Monitor } from "lucide-react";
import { useKDSOrders } from "@/hooks/use-kds-orders";
import { useKDSActions } from "@/hooks/use-kds-actions";
import { useKDSSound } from "@/hooks/use-kds-sound";
import { KDSOrderCard } from "@/components/kds/kds-order-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Order, OrderType, CartItem } from "@/types";

type Column = "pending" | "preparing" | "ready";

function getOrderColumn(order: Order): Column {
  const statuses = order.items.map((i) => i.status);
  if (statuses.every((s) => s === "ready" || s === "served")) return "ready";
  if (statuses.some((s) => s === "preparing" || s === "ready"))
    return "preparing";
  return "pending";
}

export default function KDSPage() {
  const { orders } = useKDSOrders();
  const { updateItemStatus, completeOrder } = useKDSActions();
  const { playNewOrder, playReady } = useKDSSound();

  const [soundOn, setSoundOn] = useState(true);
  const [filterType, setFilterType] = useState<OrderType | "all">("all");

  const prevOrderIdsRef = useRef<Set<string>>(new Set());
  const prevReadyCountsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!soundOn) return;

    const currentIds = new Set(orders.map((o) => o.id));
    const prevIds = prevOrderIdsRef.current;

    const newOrders = orders.filter((o) => !prevIds.has(o.id));
    if (newOrders.length > 0) {
      playNewOrder();
    }

    const currentReadyCounts = new Map<string, number>();
    let totalNewReady = 0;

    orders.forEach((o) => {
      const count = o.items.filter((i) => i.status === "ready").length;
      currentReadyCounts.set(o.id, count);
      const prevCount = prevReadyCountsRef.current.get(o.id) || 0;
      if (count > prevCount) {
        totalNewReady += count - prevCount;
      }
    });

    if (totalNewReady > 0 && prevReadyCountsRef.current.size > 0) {
      playReady();
    }

    prevOrderIdsRef.current = currentIds;
    prevReadyCountsRef.current = currentReadyCounts;
  }, [orders, soundOn, playNewOrder, playReady]);

  const filteredOrders =
    filterType === "all"
      ? orders
      : orders.filter((o) => o.orderType === filterType);

  const pendingOrders = filteredOrders.filter(
    (o) => getOrderColumn(o) === "pending",
  );
  const preparingOrders = filteredOrders.filter(
    (o) => getOrderColumn(o) === "preparing",
  );
  const readyOrders = filteredOrders.filter(
    (o) => getOrderColumn(o) === "ready",
  );

  const columns: {
    id: Column;
    label: string;
    count: number;
    borderColor: string;
    orders: Order[];
  }[] = [
    {
      id: "pending",
      label: "Pending",
      count: pendingOrders.length,
      borderColor: "border-t-warning-500",
      orders: pendingOrders,
    },
    {
      id: "preparing",
      label: "Preparing",
      count: preparingOrders.length,
      borderColor: "border-t-info-500",
      orders: preparingOrders,
    },
    {
      id: "ready",
      label: "Ready",
      count: readyOrders.length,
      borderColor: "border-t-success-500",
      orders: readyOrders,
    },
  ];

  const totalItems = orders.reduce((s, o) => s + o.items.length, 0);

  const filterOptions: { value: OrderType | "all"; label: string }[] = [
    { value: "all", label: "Semua" },
    { value: "dine-in", label: "🪑 Dine-in" },
    { value: "take-away", label: "🛍️ Bungkus" },
    { value: "delivery", label: "🛵 Delivery" },
  ];

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-4 lg:-m-6 flex-col overflow-hidden bg-espresso-50">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-espresso-200 bg-white px-6 py-3">
        <div className="flex items-center gap-4">
          <h1 className="flex items-center gap-2 text-xl font-bold text-espresso-900">
            <Monitor className="h-6 w-6" />
            Kitchen Display
          </h1>
          <div className="flex gap-1.5">
            {filterOptions.map((type) => (
              <button
                key={type.value}
                onClick={() => setFilterType(type.value)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                  filterType === type.value
                    ? "bg-espresso-600 text-white"
                    : "bg-espresso-100 text-espresso-600 hover:bg-espresso-200",
                )}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-3 text-sm text-espresso-500 sm:flex">
            <span>
              <strong className="text-espresso-800">{orders.length}</strong>{" "}
              pesanan
            </span>
            <span>
              <strong className="text-espresso-800">{totalItems}</strong> item
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundOn(!soundOn)}
            className={
              soundOn
                ? "text-success-600 hover:bg-success-50"
                : "text-espresso-400"
            }
            title={soundOn ? "Matikan suara" : "Nyalakan suara"}
          >
            {soundOn ? (
              <Volume2 className="h-5 w-5" />
            ) : (
              <VolumeX className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 grid grid-cols-3 gap-4 overflow-hidden p-4">
        {columns.map((col) => (
          <div
            key={col.id}
            className={cn(
              "flex flex-col rounded-xl border-t-4 bg-white shadow-sm",
              col.borderColor,
            )}
          >
            <div className="flex items-center justify-between border-b border-espresso-100 px-4 py-3">
              <h2 className="font-bold text-espresso-800">{col.label}</h2>
              <Badge
                variant="secondary"
                className="flex h-6 w-6 items-center justify-center rounded-full p-0 text-xs font-bold"
              >
                {col.count}
              </Badge>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-3 no-scrollbar">
              {col.orders.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-espresso-300">
                  Kosong
                </div>
              ) : (
                col.orders.map((order) => (
                  <KDSOrderCard
                    key={order.id}
                    order={order}
                    onUpdateItem={(
                      itemId: string,
                      status: CartItem["status"],
                    ) => updateItemStatus(order.id, itemId, status)}
                    onComplete={() => completeOrder(order.id)}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
