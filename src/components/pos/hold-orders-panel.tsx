"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Trash2, RotateCcw } from "lucide-react";
import { useHoldOrdersStore, type HeldOrder } from "@/stores/hold-orders-store";
import { usePOSStore } from "@/stores/pos-store";
import { formatRupiah } from "@/lib/utils";
import { ORDER_TYPES } from "@/constants";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface HoldOrdersPanelProps {
  open: boolean;
  onClose: () => void;
}

export function HoldOrdersPanel({ open, onClose }: HoldOrdersPanelProps) {
  const { orders, remove, clearAll } = useHoldOrdersStore();
  const { setOrderType, setTableNumber, setCustomer, clearCart } =
    usePOSStore();

  const handleRecall = (held: HeldOrder) => {
    // Clear current cart first
    clearCart();
    // Restore state
    setOrderType(held.orderType);
    setTableNumber(held.tableNumber);
    setCustomer(held.customerName, held.customerPhone, held.customerId);
    // Restore items directly to store
    const store = usePOSStore.getState();
    held.items.forEach((item) => {
      store.addItem({
        menuItemId: item.menuItemId,
        name: item.name,
        image: item.image,
        basePrice:
          item.unitPrice -
          (item.variant?.priceAdjustment || 0) -
          item.modifiers.reduce((s, m) => s + m.priceAdjustment, 0),
        variant: item.variant,
        modifiers: item.modifiers,
        notes: item.notes,
        quantity: item.quantity,
      });
    });
    if (held.discountType && held.discountValue) {
      store.setDiscount(held.discountType, held.discountValue);
    }
    // Remove from hold
    remove(held.id);
    onClose();
  };

  const totalHeld = orders.length;
  const totalRevenue = orders.reduce(
    (s, o) => s + o.items.reduce((is, i) => is + i.subtotal, 0),
    0,
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pesanan Ditahan ({totalHeld})
          </DialogTitle>
          <div className="flex items-center gap-3 text-sm text-espresso-500">
            <span>
              Total:{" "}
              <strong className="text-espresso-800">
                {formatRupiah(totalRevenue)}
              </strong>
            </span>
            {totalHeld > 0 && (
              <button
                onClick={clearAll}
                className="text-danger-500 hover:underline text-xs"
              >
                Hapus Semua
              </button>
            )}
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto space-y-2 py-2">
          {orders.length === 0 ? (
            <p className="py-8 text-center text-sm text-espresso-400">
              Tidak ada pesanan ditahan
            </p>
          ) : (
            orders.map((held) => {
              const orderType = ORDER_TYPES.find(
                (o) => o.value === held.orderType,
              );
              const itemCount = held.items.reduce((s, i) => s + i.quantity, 0);
              const heldTotal = held.items.reduce((s, i) => s + i.subtotal, 0);

              return (
                <div
                  key={held.id}
                  className="flex items-start gap-3 rounded-lg border border-espresso-200 p-3 hover:border-espresso-300 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-[10px]">
                        {orderType?.icon} {orderType?.label}
                      </Badge>
                      {held.tableNumber && (
                        <Badge variant="outline" className="text-[10px]">
                          Meja {held.tableNumber}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-espresso-700">
                      {held.items
                        .map((i) => `${i.quantity}x ${i.name}`)
                        .join(", ")}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-espresso-400">
                      <span>{itemCount} item</span>
                      <span>
                        {formatDistanceToNow(new Date(held.heldAt), {
                          addSuffix: true,
                          locale: idLocale,
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <p className="text-sm font-bold tabular-nums">
                      {formatRupiah(heldTotal)}
                    </p>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-info-500 hover:text-info-600"
                        onClick={() => handleRecall(held)}
                        title="Panggil kembali"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-danger-500 hover:text-danger-600"
                        onClick={() => remove(held.id)}
                        title="Hapus"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
