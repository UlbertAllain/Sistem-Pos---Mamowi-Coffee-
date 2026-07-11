"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import type { CartItem as CartItemType } from "@/types";

interface CartItemRowProps {
  item: CartItemType;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}

export function CartItemRow({
  item,
  onIncrement,
  onDecrement,
  onRemove,
}: CartItemRowProps) {
  return (
    <div className="group flex gap-3 rounded-lg p-2 transition-colors hover:bg-espresso-50">
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight text-espresso-900 truncate">
              {item.name}
            </p>
            {item.variant && (
              <p className="text-xs text-espresso-500">{item.variant.name}</p>
            )}
          </div>
          <p className="shrink-0 text-sm font-bold tabular-nums text-espresso-800">
            {formatRupiah(item.subtotal)}
          </p>
        </div>

        {/* Modifiers */}
        {item.modifiers.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {item.modifiers.map((m) => (
              <span
                key={`${m.groupId}-${m.optionId}`}
                className="inline-flex items-center gap-0.5 rounded bg-espresso-100 px-1.5 py-0.5 text-[10px] text-espresso-600"
              >
                {m.optionName}
                {m.priceAdjustment > 0 && (
                  <span>+{formatRupiah(m.priceAdjustment)}</span>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Notes */}
        {item.notes && (
          <p className="mt-1 text-[11px] italic text-espresso-400">
            📝 {item.notes}
          </p>
        )}

        {/* Quantity Controls */}
        <div className="mt-2 flex items-center gap-2">
          <div className="inline-flex items-center rounded-md border border-espresso-200 bg-white">
            <button
              onClick={onDecrement}
              className="flex h-7 w-7 items-center justify-center text-espresso-500 hover:bg-espresso-50 rounded-l-md transition-colors"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="flex h-7 w-8 items-center justify-center border-x border-espresso-200 text-xs font-bold tabular-nums">
              {item.quantity}
            </span>
            <button
              onClick={onIncrement}
              className="flex h-7 w-7 items-center justify-center text-espresso-500 hover:bg-espresso-50 rounded-r-md transition-colors"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          <button
            onClick={onRemove}
            className="flex h-7 items-center gap-1 rounded-md px-2 text-[11px] text-danger-500 hover:bg-danger-50 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}
