"use client";

import { formatRupiah } from "@/lib/utils";

interface ReceiptData {
  orderId: string;
  storeName: string;
  storeAddress: string;
  storePhone: string;
  orderType: string;
  tableNumber: number | null;
  cashierName: string;
  items: {
    name: string;
    variant?: string;
    modifiers: { optionName: string; priceAdjustment: number }[];
    notes?: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
  subtotal: number;
  taxRate: number;
  taxMode: string;
  taxAmount: number;
  discountAmount: number;
  discountType: string | null;
  discountValue: number;
  loyaltyDiscount: number;
  loyaltyPointsEarned: number;
  loyaltyPointsRedeemed: number;
  total: number;
  paymentMethod: string;
  cashReceived: number;
  change: number;
  showLoyalty: boolean;
  receiptFooter: string;
}

interface ReceiptPrintProps {
  data: ReceiptData;
}

export function ReceiptPrint({ data }: ReceiptPrintProps) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const orderTypeLabel =
    data.orderType === "dine-in"
      ? "Makan Di Tempat"
      : data.orderType === "take-away"
        ? "Bungkus"
        : "Delivery";

  return (
    <div className="print-only w-[80mm] mx-auto font-mono text-[11px] leading-tight text-black">
      {/* Header */}
      <div className="text-center mb-2">
        <p className="font-bold text-sm">{data.storeName}</p>
        <p className="text-[10px]">{data.storeAddress}</p>
        {data.storePhone && (
          <p className="text-[10px]">Telp: {data.storePhone}</p>
        )}
      </div>

      <div className="border-t border-dashed border-black my-2" />

      {/* Order Info */}
      <div className="space-y-0.5 mb-2">
        <div className="flex justify-between">
          <span>No:</span>
          <span className="font-bold">{data.orderId}</span>
        </div>
        <div className="flex justify-between">
          <span>Tgl:</span>
          <span>
            {dateStr} {timeStr}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Kasir:</span>
          <span>{data.cashierName}</span>
        </div>
        <div className="flex justify-between">
          <span>Tipe:</span>
          <span>
            {orderTypeLabel}
            {data.tableNumber ? ` | Meja ${data.tableNumber}` : ""}
          </span>
        </div>
      </div>

      <div className="border-t border-dashed border-black my-2" />

      {/* Items */}
      <div className="space-y-2 mb-2">
        {data.items.map((item, idx) => (
          <div key={idx}>
            <div className="flex justify-between">
              <span className="font-bold">
                {item.quantity}x {item.name}
                {item.variant ? ` (${item.variant})` : ""}
              </span>
              <span>{formatRupiah(item.subtotal)}</span>
            </div>
            {item.modifiers
              .filter((m) => m.priceAdjustment > 0)
              .map((m, mi) => (
                <div
                  key={mi}
                  className="pl-4 flex justify-between text-[10px] text-gray-600"
                >
                  <span>+ {m.optionName}</span>
                  <span>{formatRupiah(m.priceAdjustment)}</span>
                </div>
              ))}
            {item.modifiers
              .filter((m) => m.priceAdjustment === 0)
              .map((m, mi) => (
                <div key={mi} className="pl-4 text-[10px] text-gray-600">
                  • {m.optionName}
                </div>
              ))}
            {item.notes && (
              <div className="pl-4 text-[10px] text-gray-500 italic">
                📝 {item.notes}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-black my-2" />

      {/* Totals */}
      <div className="space-y-0.5">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatRupiah(data.subtotal)}</span>
        </div>

        {data.discountAmount > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>
              Diskon
              {data.discountType === "percentage"
                ? ` ${data.discountValue}%`
                : ""}
            </span>
            <span>-{formatRupiah(data.discountAmount)}</span>
          </div>
        )}

        {data.taxRate > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>
              PPN {data.taxRate}%{data.taxMode === "included" ? " (incl.)" : ""}
            </span>
            <span>
              {data.taxMode === "included" ? "" : ""}
              {formatRupiah(data.taxAmount)}
            </span>
          </div>
        )}

        {data.showLoyalty && data.loyaltyPointsRedeemed > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>Loyalty ({data.loyaltyPointsRedeemed} poin)</span>
            <span>-{formatRupiah(data.loyaltyDiscount)}</span>
          </div>
        )}

        <div className="border-t border-dashed border-black my-2" />

        <div className="flex justify-between font-bold text-sm">
          <span>TOTAL</span>
          <span>{formatRupiah(data.total)}</span>
        </div>

        <div className="border-t border-dashed border-black my-2" />

        {data.paymentMethod === "cash" && (
          <>
            <div className="flex justify-between">
              <span>Tunai</span>
              <span>{formatRupiah(data.cashReceived)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Kembalian</span>
              <span>{formatRupiah(data.change)}</span>
            </div>
          </>
        )}

        {data.paymentMethod !== "cash" && (
          <div className="flex justify-between">
            <span className="capitalize">
              {data.paymentMethod === "qris" ? "QRIS" : data.paymentMethod}
            </span>
            <span>{formatRupiah(data.total)}</span>
          </div>
        )}
      </div>

      <div className="border-t border-dashed border-black my-2" />

      {data.showLoyalty &&
        (data.loyaltyPointsEarned > 0 || data.loyaltyPointsRedeemed > 0) && (
          <>
            <div className="space-y-0.5">
              {data.loyaltyPointsEarned > 0 && (
                <div className="flex justify-between">
                  <span>Poin didapat</span>
                  <span>{data.loyaltyPointsEarned} poin</span>
                </div>
              )}
              {data.loyaltyPointsRedeemed > 0 && (
                <div className="flex justify-between">
                  <span>Poin dipakai</span>
                  <span>{data.loyaltyPointsRedeemed} poin</span>
                </div>
              )}
            </div>
            <div className="border-t border-dashed border-black my-2" />
          </>
        )}

      {/* Footer */}
      <div className="text-center">
        {data.receiptFooter.split("\n").map((line, i) => (
          <p key={i} className="text-[10px]">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
