"use client";

import { useState } from "react";
import { ShoppingCart, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@radix-ui/react-separator";

import { ORDER_TYPES } from "@/constants";
import type { OrderType } from "@/types";
import { formatRupiah, cn } from "@/lib/utils";

import { usePOSStore } from "@/stores/pos-store";
import { useSettings } from "@/hooks/use-settings";
import { useHoldOrdersStore } from "@/stores/hold-orders-store";

import { HoldOrdersPanel } from "./hold-orders-panel";
import { CartItemRow } from "./cart-item";
import { CustomerLookupPanel } from "./customer-lookup-panel";
import { LoyaltyRedemption } from "./loyalty-redemption";

interface CartPanelProps {
  onPay: () => void;
}

export function CartPanel({ onPay }: CartPanelProps) {
  const {
    items,
    orderType,
    tableNumber,
    customerName,
    customerPhone,
    customerId,
    selectedCustomer,
    setOrderType,
    setTableNumber,
    setCustomer,
    incrementItem,
    decrementItem,
    removeItem,
    getSubtotal,
    getDiscountAmount,
    getTaxAmount,
    getTotal,
    getItemCount,
    setDiscount,
    clearDiscount,
    discountType,
    discountValue,
    setHeld,
    clearCart,
    orderNotes,
    redeemedPoints,
    setRedeemedPoints,
  } = usePOSStore();

  const { settings } = useSettings();
  const { add: holdOrder, orders: heldOrders } = useHoldOrdersStore();

  const [showHoldPanel, setShowHoldPanel] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [discType, setDiscType] = useState<"percentage" | "fixed">(
    "percentage",
  );
  const [discVal, setDiscVal] = useState("");

  const [showTableSelect, setShowTableSelect] = useState(false);
  const [showDeliveryInfo, setShowDeliveryInfo] = useState(false);
  const [tempCustomerName, setTempCustomerName] = useState("");
  const [tempCustomerPhone, setTempCustomerPhone] = useState("");

  const [showCustomerLookup, setShowCustomerLookup] = useState(false);
  const [showLoyaltyRedeem, setShowLoyaltyRedeem] = useState(false);
  const taxRate = settings?.tax.enabled ? settings.tax.rate : 0;
  const taxMode = settings?.tax.mode || "included";

  const subtotal = getSubtotal();
  const discountAmount = getDiscountAmount();

  const loyaltyDiscount =
    redeemedPoints * (settings?.loyalty?.redemptionRate || 50);

  const taxAmount = getTaxAmount(taxRate, taxMode);
  const totalBeforeLoyalty = getTotal(taxRate, taxMode);
  const total = Math.max(0, totalBeforeLoyalty - loyaltyDiscount);
  const itemCount = getItemCount();

  const tables = (settings?.tables || []).filter(
    (t: { isActive: boolean }) => t.isActive,
  );

  const handleHold = () => {
    if (items.length === 0) return;

    holdOrder({
      orderType: orderType as OrderType,
      tableNumber,
      customerName,
      customerPhone,
      customerId,
      items: [...items],
      discountType,
      discountValue,
      orderNotes,
    });

    setHeld();
    clearCart();
  };

  const handleApplyDiscount = () => {
    const val = parseFloat(discVal);
    if (isNaN(val) || val <= 0) return;
    if (discType === "percentage" && val > 100) return;

    setDiscount(discType, val);
    setShowDiscount(false);
    setDiscVal("");
  };

  const handleTableSelect = (num: number) => {
    setTableNumber(num);
    setShowTableSelect(false);
  };

  const handleSaveDelivery = () => {
    setCustomer(tempCustomerName || null, tempCustomerPhone || null, null);
    setShowDeliveryInfo(false);
  };

  const handleRedeemPoints = (pts: number) => {
    setRedeemedPoints(pts);
    setShowLoyaltyRedeem(false);
  };

  return (
    <>
      <div className="flex h-full flex-col border-l border-espresso-100 bg-white">
        {/* Order Meta */}
        <div className="space-y-3 border-b border-espresso-100 p-3">
          <div className="flex gap-1.5">
            {ORDER_TYPES.map((ot) => (
              <button
                key={ot.value}
                onClick={() => setOrderType(ot.value as OrderType)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium transition-all",
                  orderType === ot.value
                    ? "border-espresso-600 bg-espresso-600 text-white"
                    : "border-espresso-200 text-espresso-600 hover:border-espresso-300",
                )}
              >
                <span>{ot.icon}</span>
                <span className="hidden xl:inline">{ot.label}</span>
              </button>
            ))}
          </div>

          {orderType === "dine-in" && (
            <button
              onClick={() => setShowTableSelect(true)}
              className={cn(
                "w-full rounded-lg border px-3 py-2 text-left text-sm transition-all",
                tableNumber
                  ? "border-espresso-600 bg-espresso-50 font-medium text-espresso-800"
                  : "border-dashed border-espresso-300 text-espresso-400 hover:border-espresso-400",
              )}
            >
              {tableNumber ? `Meja ${tableNumber}` : "Pilih Meja..."}
            </button>
          )}

          {orderType === "delivery" && (
            <button
              onClick={() => {
                setTempCustomerName(customerName || "");
                setTempCustomerPhone(customerPhone || "");
                setShowDeliveryInfo(true);
              }}
              className={cn(
                "w-full rounded-lg border px-3 py-2 text-left text-sm transition-all",
                customerName
                  ? "border-espresso-600 bg-espresso-50 font-medium text-espresso-800"
                  : "border-dashed border-espresso-300 text-espresso-400 hover:border-espresso-400",
              )}
            >
              {customerName ? customerName : "Info Pelanggan..."}
            </button>
          )}

          {/* Customer Loyalty */}
          <button
            onClick={() => setShowCustomerLookup(true)}
            className={cn(
              "w-full rounded-lg border px-3 py-2 text-left text-sm transition-all flex items-center gap-2",
              customerId
                ? "border-espresso-600 bg-espresso-50 text-espresso-800"
                : "border-dashed border-espresso-300 text-espresso-400 hover:border-espresso-400",
            )}
          >
            <Users className="h-4 w-4 shrink-0" />
            {customerName ? (
              <span className="truncate">
                {customerName} —{" "}
                {redeemedPoints > 0
                  ? `${redeemedPoints} pts redeemed`
                  : "Loyalty"}
              </span>
            ) : (
              <span>Pelanggan / Loyalty</span>
            )}
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-3">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ShoppingCart className="h-12 w-12 text-espresso-200" />
              <p className="mt-3 text-sm text-espresso-400">Belum ada item</p>
              <p className="text-xs text-espresso-300">
                Pilih menu untuk memulai
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  onIncrement={() => incrementItem(item.id)}
                  onDecrement={() => decrementItem(item.id)}
                  onRemove={() => removeItem(item.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Totals & Actions */}
        <div className="border-t border-espresso-100 p-3 space-y-2">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-espresso-500">
              <span>Subtotal ({itemCount} item)</span>
              <span className="tabular-nums">{formatRupiah(subtotal)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-success-600">
                <span
                  className="cursor-pointer hover:underline"
                  onClick={clearDiscount}
                >
                  Diskon{" "}
                  {discountType === "percentage" ? `${discountValue}%` : ""} ✕
                </span>
                <span className="tabular-nums">
                  -{formatRupiah(discountAmount)}
                </span>
              </div>
            )}

            {redeemedPoints > 0 && (
              <div className="flex justify-between text-success-600">
                <span
                  className="cursor-pointer hover:underline"
                  onClick={() => setRedeemedPoints(0)}
                >
                  Loyalty ({redeemedPoints} pts) ✕
                </span>
                <span className="tabular-nums">
                  -{formatRupiah(loyaltyDiscount)}
                </span>
              </div>
            )}

            {taxRate > 0 && (
              <div className="flex justify-between text-espresso-500">
                <span>
                  PPN {taxRate}% {taxMode === "included" ? "(termasuk)" : ""}
                </span>
                <span className="tabular-nums">{formatRupiah(taxAmount)}</span>
              </div>
            )}

            <Separator className="bg-espresso-200" />

            <div className="flex justify-between text-lg font-bold text-espresso-900">
              <span>Total</span>
              <span className="tabular-nums">{formatRupiah(total)}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleHold}
              disabled={items.length === 0}
            >
              Hold
              {heldOrders.length > 0 && (
                <Badge
                  variant="warning"
                  className="ml-1 h-4 min-w-4 px-1 text-[10px]"
                >
                  {heldOrders.length}
                </Badge>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDiscType(
                  discountType === "percentage" ? "fixed" : "percentage",
                );
                setDiscVal("");
                setShowDiscount(true);
              }}
              disabled={items.length === 0}
            >
              Diskon
            </Button>

            <Button size="sm" onClick={onPay} disabled={items.length === 0}>
              Bayar
            </Button>
          </div>

          {customerId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowLoyaltyRedeem(true);
              }}
              disabled={!selectedCustomer}
              className="w-full text-xs text-espresso-400"
            >
              Redeem Poin Loyalty
            </Button>
          )}
        </div>
      </div>

      {/* Modals */}
      <Dialog open={showTableSelect} onOpenChange={setShowTableSelect}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Pilih Meja</DialogTitle>
            <DialogDescription>
              Pilih nomor meja untuk pesanan dine-in
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-4 gap-2 py-4">
            {tables.map(
              (t: { number: number; capacity: number; area: string }) => (
                <button
                  key={t.number}
                  onClick={() => handleTableSelect(t.number)}
                  className={cn(
                    "flex flex-col items-center rounded-lg border-2 p-3 transition-all",
                    tableNumber === t.number
                      ? "border-espresso-600 bg-espresso-50"
                      : "border-espresso-200 hover:border-espresso-300",
                  )}
                >
                  <span className="text-lg font-bold">{t.number}</span>
                  <span className="text-[10px] text-espresso-400">
                    {t.area} • {t.capacity} org
                  </span>
                </button>
              ),
            )}
          </div>

          {tableNumber && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setTableNumber(null)}>
                Hapus Pilihan
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showDeliveryInfo} onOpenChange={setShowDeliveryInfo}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Info Delivery</DialogTitle>
            <DialogDescription>
              Masukkan nama dan nomor telepon pelanggan
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Input
              label="Nama Pelanggan"
              placeholder="Masukkan nama"
              value={tempCustomerName}
              onChange={(e) => setTempCustomerName(e.target.value)}
            />

            <Input
              label="No. Telepon"
              placeholder="08xxxxxxxxxx"
              value={tempCustomerPhone}
              onChange={(e) =>
                setTempCustomerPhone(
                  e.target.value.replace(/\D/g, "").slice(0, 13),
                )
              }
              inputMode="numeric"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeliveryInfo(false)}
            >
              Batal
            </Button>
            <Button onClick={handleSaveDelivery} disabled={!tempCustomerName}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDiscount} onOpenChange={setShowDiscount}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Terapkan Diskon</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              {(["percentage", "fixed"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setDiscType(t)}
                  className={cn(
                    "flex-1 rounded-lg border-2 py-2 text-sm font-medium transition-all",
                    discType === t
                      ? "border-espresso-600 bg-espresso-50 text-espresso-800"
                      : "border-espresso-200 text-espresso-500 hover:border-espresso-300",
                  )}
                >
                  {t === "percentage" ? "Persen (%)" : "Nominal (Rp)"}
                </button>
              ))}
            </div>

            <Input
              type="number"
              placeholder={
                discType === "percentage" ? "Contoh: 10" : "Contoh: 5000"
              }
              value={discVal}
              onChange={(e) => setDiscVal(e.target.value)}
              suffix={discType === "percentage" ? "%" : "Rp"}
              inputMode="decimal"
            />

            {discVal &&
              !isNaN(parseFloat(discVal)) &&
              parseFloat(discVal) > 0 && (
                <div className="rounded-lg bg-espresso-50 p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-espresso-500">Potongan:</span>
                    <span className="font-bold text-success-600">
                      -
                      {formatRupiah(
                        discType === "percentage"
                          ? Math.round((subtotal * parseFloat(discVal)) / 100)
                          : parseFloat(discVal),
                      )}
                    </span>
                  </div>
                </div>
              )}
          </div>

          <DialogFooter>
            {discountAmount > 0 && (
              <Button
                variant="ghost"
                className="text-danger-500 hover:text-danger-600 hover:bg-danger-50"
                onClick={() => {
                  clearDiscount();
                  setShowDiscount(false);
                }}
              >
                Hapus Diskon
              </Button>
            )}

            <Button variant="outline" onClick={() => setShowDiscount(false)}>
              Batal
            </Button>

            <Button
              onClick={handleApplyDiscount}
              disabled={!discVal || parseFloat(discVal) <= 0}
            >
              Terapkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <HoldOrdersPanel
        open={showHoldPanel}
        onClose={() => setShowHoldPanel(false)}
      />
      <CustomerLookupPanel
        open={showCustomerLookup}
        onClose={() => setShowCustomerLookup(false)}
      />
      <LoyaltyRedemption
        customer={selectedCustomer}
        open={showLoyaltyRedeem}
        onClose={() => setShowLoyaltyRedeem(false)}
        onRedeem={handleRedeemPoints}
        redemptionRate={settings?.loyalty?.redemptionRate || 50}
        maxDiscountAmount={totalBeforeLoyalty}
      />
    </>
  );
}
