"use client";

import { useState, useEffect } from "react";
import { Clock, CheckCircle2, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Order, CartItem } from "@/types";
import { ORDER_TYPES } from "@/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface KDSOrderCardProps {
  order: Order;
  onUpdateItem: (itemId: string, status: CartItem["status"]) => void;
  onComplete: () => void;
}

function getTimerColor(minutes: number): string {
  if (minutes < 5) return "text-success-600 bg-success-50";
  if (minutes < 10) return "text-warning-600 bg-warning-50";
  return "text-danger-600 bg-danger-50 animate-pulse";
}

export function KDSOrderCard({
  order,
  onUpdateItem,
  onComplete,
}: KDSOrderCardProps) {
  const [elapsed, setElapsed] = useState(0);

  // Timer: update setiap 5 detik
  useEffect(() => {
    const start = (order.timestamps.paidAt || new Date()).getTime();
    const tick = () => setElapsed((Date.now() - start) / 60000);
    tick();
    const interval = setInterval(tick, 5000);
    return () => clearInterval(interval);
  }, [order.timestamps.paidAt]);

  const orderType = ORDER_TYPES.find((o) => o.value === order.orderType);
  const allReady = order.items.every(
    (i) => i.status === "ready" || i.status === "served",
  );

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border-2 p-4 transition-all duration-300",
        allReady
          ? "border-success-300 bg-success-50/40 ring-1 ring-success-200"
          : "border-espresso-200 bg-white shadow-sm",
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xl font-black tabular-nums text-espresso-900">
            #{order.orderNumber}
          </span>
          <Badge variant="secondary" className="text-[10px]">
            {orderType?.icon} {orderType?.label}
          </Badge>
          {order.tableNumber && (
            <Badge variant="outline" className="text-[10px]">
              Meja {order.tableNumber}
            </Badge>
          )}
        </div>

        {/* Timer */}
        <div
          className={cn(
            "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums",
            getTimerColor(elapsed),
          )}
        >
          <Clock className="h-3.5 w-3.5" />
          {Math.floor(elapsed)}m
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 space-y-2">
        {order.items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "flex items-start justify-between rounded-lg border p-2.5 transition-colors",
              item.status === "ready"
                ? "border-success-200 bg-success-50"
                : item.status === "preparing"
                  ? "border-info-200 bg-info-50"
                  : "border-espresso-100 bg-espresso-50/50",
            )}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-espresso-900">
                {item.quantity}x {item.name}
                {item.variant && (
                  <span className="ml-1 text-xs font-normal text-espresso-500">
                    ({item.variant.name})
                  </span>
                )}
              </p>

              {/* Modifiers */}
              <div className="mt-1 flex flex-wrap gap-1">
                {item.modifiers.map((m) => (
                  <span
                    key={`${m.groupId}-${m.optionId}`}
                    className="rounded border border-white bg-white/80 px-1.5 py-0.5 text-[10px] text-espresso-600 shadow-sm"
                  >
                    {m.optionName}
                  </span>
                ))}
                {item.notes && (
                  <span className="rounded border border-danger-200 bg-white px-1.5 py-0.5 text-[10px] italic text-danger-600">
                    📝 {item.notes}
                  </span>
                )}
              </div>
            </div>

            {/* Action Button */}
            <div className="ml-3 shrink-0">
              {item.status === "pending" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-info-600 hover:bg-info-100"
                  onClick={() => onUpdateItem(item.id, "preparing")}
                  title="Mulai buat"
                >
                  <PlayCircle className="h-5 w-5" />
                </Button>
              )}
              {item.status === "preparing" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-success-600 hover:bg-success-100"
                  onClick={() => onUpdateItem(item.id, "ready")}
                  title="Sudah jadi"
                >
                  <CheckCircle2 className="h-5 w-5" />
                </Button>
              )}
              {item.status === "ready" && (
                <div className="flex h-9 w-9 items-center justify-center text-success-500">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Complete Button */}
      {allReady && (
        <Button
          className="mt-3 h-11 w-full bg-success-600 text-base font-bold hover:bg-success-700"
          onClick={onComplete}
        >
          <CheckCircle2 className="mr-2 h-5 w-5" />
          Selesai Disajikan
        </Button>
      )}
    </div>
  );
}
