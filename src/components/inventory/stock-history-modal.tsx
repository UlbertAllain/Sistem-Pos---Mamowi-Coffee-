"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useStockTransactions } from "@/hooks/use-stock-transactions";
import { formatNumber } from "@/lib/utils";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { Ingredient, StockTransactionType } from "@/types";
import {
  ArrowDown,
  ArrowUp,
  RotateCcw,
  Trash2,
  Package,
  History,
} from "lucide-react";

interface StockHistoryModalProps {
  ingredient: Ingredient | null;
  open: boolean;
  onClose: () => void;
}

const typeConfig: Record<
  StockTransactionType,
  { label: string; color: string; icon: typeof ArrowDown }
> = {
  in: {
    label: "Masuk",
    color: "text-success-600 bg-success-50",
    icon: ArrowDown,
  },
  out: {
    label: "Keluar",
    color: "text-danger-600 bg-danger-50",
    icon: ArrowUp,
  },
  adjustment: {
    label: "Penyesuaian",
    color: "text-info-600 bg-info-50",
    icon: RotateCcw,
  },
  waste: {
    label: "Waste",
    color: "text-warning-600 bg-warning-50",
    icon: Trash2,
  },
  initial: {
    label: "Stok Awal",
    color: "text-espresso-600 bg-espresso-50",
    icon: Package,
  },
};

export function StockHistoryModal({
  ingredient,
  open,
  onClose,
}: StockHistoryModalProps) {
  const { transactions, isLoading } = useStockTransactions(
    ingredient?.id ?? null,
    30,
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Riwayat Stok
          </DialogTitle>
          <DialogDescription>
            {ingredient?.name} — 30 transaksi terakhir
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <p className="py-8 text-center text-sm text-espresso-400">
              Belum ada riwayat
            </p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => {
                const config = typeConfig[tx.type];
                const Icon = config.icon;
                const isOut = tx.type === "out" || tx.type === "waste";
                const notes = tx.notes != null ? String(tx.notes) : null;

                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 rounded-lg border border-espresso-100 p-3"
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.color}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {config.label}
                        </Badge>
                        <span className="text-[11px] text-espresso-400">
                          {format(tx.createdAt, "dd MMM yyyy, HH:mm", {
                            locale: idLocale,
                          })}
                        </span>
                      </div>
                      {notes && (
                        <p className="mt-0.5 text-xs text-espresso-500 truncate">
                          {notes}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className={`text-sm font-bold ${isOut ? "text-danger-600" : "text-success-600"}`}
                      >
                        {isOut ? "-" : "+"}
                        {formatNumber(tx.quantity)} {tx.unit}
                      </p>
                      <p className="text-[10px] text-espresso-400">
                        {formatNumber(tx.previousStock)} →{" "}
                        {formatNumber(tx.newStock)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
