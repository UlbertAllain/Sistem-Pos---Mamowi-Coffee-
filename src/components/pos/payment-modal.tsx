"use client";

import { useCallback, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@radix-ui/react-separator";
import { usePOSStore } from "@/stores/pos-store";
import { useSettings } from "@/hooks/use-settings";
import { useCreateOrder } from "@/hooks/use-orders";
import { useInventoryActions } from "@/hooks/use-inventory-actions";
import { useAuthStore } from "@/stores/auth-store";
import { formatRupiah, cn, parseRupiahToNumber } from "@/lib/utils";
import { useCustomerActions } from "@/hooks/use-customer-actions";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/constants";
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { PAYMENT_METHODS, QUICK_CASH_AMOUNTS } from "@/constants";
import type { PaymentMethod, PaymentRecord } from "@/types";
import { QRCodeSVG } from "qrcode.react";
import {
  Check,
  CreditCard,
  Smartphone,
  Wallet,
  Banknote,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { ReceiptPrint } from "./receipt";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentModal({ open, onClose, onSuccess }: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [cashReceived, setCashReceived] = useState("");
  const [isExact, setIsExact] = useState(false);
  const [cardDigits, setCardDigits] = useState("");
  const [ewalletRef, setEwalletRef] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<{
    id: string;
    total: number;
    loyaltyPointsEarned: number;
    loyaltyPointsRedeemed: number;
  } | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [qrTimestamp, setQrTimestamp] = useState(0);

  useEffect(() => {
    if (!open) return;
    // Avoid setState in effect body: run in microtask
    Promise.resolve().then(() => setQrTimestamp(Date.now()));
  }, [open]);

  const {
    items,
    orderType,
    tableNumber,
    customerName,
    customerPhone,
    customerId,
    getSubtotal,
    getDiscountAmount,
    getTaxAmount,
    getTotal,
    discountType,
    discountValue,
    orderNotes,
    clearCart,
    redeemedPoints,
    setRedeemedPoints,
    selectedCustomer,
  } = usePOSStore();
  const { settings } = useSettings();
  const { create } = useCreateOrder();
  const { deductFromRecipe } = useInventoryActions();
  const { user } = useAuthStore();
  const { processLoyalty } = useCustomerActions();

  const [activeShiftId, setActiveShiftId] = useState<string | null>(null);

  const ensureActiveShift = useCallback(async () => {
    if (!user) return null;

    const snap = await getDocs(
      query(
        collection(db, COLLECTIONS.shifts),
        where("status", "==", "active"),
        where("userId", "==", user.uid),
        orderBy("startTime", "desc"),
        limit(1),
      ),
    );

    const existing = snap.docs[0];
    if (existing) return existing.id;

    return null;
  }, [user]);

  useEffect(() => {
    if (!open) return;

    const loadActiveShift = async () => {
      try {
        const shiftId = await ensureActiveShift();
        setActiveShiftId(shiftId);
      } catch (error) {
        console.error("Active shift lookup error:", error);
        setActiveShiftId(null);
      }
    };

    void loadActiveShift();
  }, [ensureActiveShift, open]);

  const taxRate = settings?.tax.enabled ? settings.tax.rate : 0;
  const taxMode = settings?.tax.mode || "included";
  const subtotal = getSubtotal();
  const discountAmount = getDiscountAmount();
  const taxAmount = getTaxAmount(taxRate, taxMode);
  const totalBeforeLoyalty = getTotal(taxRate, taxMode);
  const loyaltyRedemptionRate = settings?.loyalty?.redemptionRate || 50;
  const maxRedeemablePoints =
    loyaltyRedemptionRate > 0
      ? Math.floor(totalBeforeLoyalty / loyaltyRedemptionRate)
      : 0;
  const appliedRedeemedPoints = customerId
    ? Math.min(
        redeemedPoints,
        selectedCustomer?.loyalty.points ?? redeemedPoints,
        maxRedeemablePoints,
      )
    : 0;
  const loyaltyDiscount = appliedRedeemedPoints * loyaltyRedemptionRate;
  const total = Math.max(0, totalBeforeLoyalty - loyaltyDiscount);

  const cashReceivedNum = parseRupiahToNumber(cashReceived);
  const change = isExact ? 0 : cashReceivedNum - total;
  const canPayCash = isExact || cashReceivedNum >= total;

  const handlePay = async () => {
    if (items.length === 0) return;
    setIsProcessing(true);

    let payments: PaymentRecord[] = [];

    if (method === "cash") {
      if (!canPayCash) {
        toast.error("Uang diterima kurang");
        setIsProcessing(false);
        return;
      }
      payments = [
        {
          method: "cash",
          amount: total,
          received: isExact ? total : cashReceivedNum,
          change: isExact ? 0 : change,
        },
      ];
    } else if (method === "card") {
      if (!cardDigits || cardDigits.length < 4) {
        toast.error("Masukkan 4 digit terakhir kartu");
        setIsProcessing(false);
        return;
      }
      payments = [{ method: "card", amount: total, lastDigits: cardDigits }];
    } else {
      payments = [
        { method, amount: total, reference: ewalletRef || undefined },
      ];
    }

    try {
      const shiftId = activeShiftId ?? (await ensureActiveShift());
      if (!shiftId) {
        toast.error("Buka shift terlebih dahulu sebelum checkout");
        return;
      }
      setActiveShiftId(shiftId);

      const order = await create({
        orderType,
        tableNumber,
        customerName,
        customerPhone,
        customerId,
        items: items.map((i) => ({ ...i })),
        subtotal,
        taxRate,
        taxAmount,
        discountType,
        discountValue,
        discountAmount,
        totalAmount: total,
        payments,
        loyaltyPointsEarned: 0,
        loyaltyPointsRedeemed: appliedRedeemedPoints,
        shiftId,
        notes: orderNotes,
      });

      if (order) {
        await deductFromRecipe(
          order.items.map((item) => ({
            menuItemId: item.menuItemId,
            name: item.name,
            quantity: item.quantity,
            recipe: item.recipe || [],
          })),
          order.id,
        );

        let loyaltyPointsEarned = 0;
        let loyaltyPointsRedeemed = appliedRedeemedPoints;

        if (customerId) {
          const loyaltyRes = await processLoyalty({
            customerId,
            orderAmount: total,
            orderId: order.id,
            pointsToRedeem: appliedRedeemedPoints,
          });

          if (loyaltyRes) {
            loyaltyPointsEarned = loyaltyRes.earned;
            loyaltyPointsRedeemed = loyaltyRes.redeemed;
            await setDoc(
              doc(db, COLLECTIONS.orders, order.id),
              {
                loyaltyPointsEarned: loyaltyRes.earned,
                loyaltyPointsRedeemed: loyaltyRes.redeemed,
              },
              { merge: true },
            );
          }
        }

        setCompletedOrder({
          id: order.id,
          total,
          loyaltyPointsEarned,
          loyaltyPointsRedeemed,
        });
        setShowReceipt(true);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinish = () => {
    clearCart();
    setCompletedOrder(null);
    setShowReceipt(false);
    setCashReceived("");
    setIsExact(false);
    setCardDigits("");
    setEwalletRef("");
    setMethod("cash");
    setRedeemedPoints(0);
    onSuccess();
    onClose();
  };

  const receiptData = completedOrder
    ? {
        orderId: completedOrder.id,
        storeName: settings?.name || "KOFFEE POS",
        storeAddress: settings?.address || "",
        storePhone: settings?.phone || "",
        orderType,
        tableNumber,
        cashierName: user?.displayName || "",
        items: items.map((i) => ({
          name: i.name,
          variant: i.variant?.name,
          modifiers: i.modifiers,
          notes: i.notes,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          subtotal: i.subtotal,
        })),
        subtotal,
        taxRate,
        taxMode,
        taxAmount,
        discountAmount,
        discountType,
        discountValue,
        loyaltyDiscount,
        loyaltyPointsEarned: completedOrder.loyaltyPointsEarned,
        loyaltyPointsRedeemed: completedOrder.loyaltyPointsRedeemed,
        total: completedOrder.total,
        paymentMethod: method,
        cashReceived: isExact ? total : cashReceivedNum,
        change: isExact ? 0 : change,
        showLoyalty: settings?.receipt.showLoyalty ?? true,
        receiptFooter: settings?.receipt.footer || "",
      }
    : null;

  if (showReceipt && receiptData) {
    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent size="sm" className="flex flex-col items-center">
          <div className="py-4 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-success-50">
              <Check className="h-7 w-7 text-success-600" />
            </div>
            <h3 className="text-lg font-bold text-espresso-900">
              Pembayaran Berhasil!
            </h3>
            <p className="text-sm text-espresso-500">
              Pesanan #{receiptData.orderId}
            </p>
          </div>

          <ReceiptPrint data={receiptData} />

          <div className="flex w-full gap-2 mt-4">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4" />
              Cetak
            </Button>
            <Button className="flex-1 gap-2" onClick={handleFinish}>
              Selesai
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const paymentIcons: Record<PaymentMethod, typeof Banknote> = {
    cash: Banknote,
    qris: Smartphone,
    card: CreditCard,
    ewallet: Wallet,
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Pembayaran</DialogTitle>
          <DialogDescription>
            Total:{" "}
            <strong className="text-espresso-900 text-base">
              {formatRupiah(total)}
            </strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Payment Method Tabs */}
          <div className="grid grid-cols-4 gap-2">
            {PAYMENT_METHODS.map((pm) => {
              const Icon = paymentIcons[pm.value as PaymentMethod];
              return (
                <button
                  key={pm.value}
                  onClick={() => setMethod(pm.value as PaymentMethod)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border-2 py-3 transition-all",
                    method === pm.value
                      ? "border-espresso-600 bg-espresso-50"
                      : "border-espresso-200 hover:border-espresso-300",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      method === pm.value
                        ? "text-espresso-700"
                        : "text-espresso-400",
                    )}
                  />
                  <span
                    className={cn(
                      "text-xs font-medium",
                      method === pm.value
                        ? "text-espresso-800"
                        : "text-espresso-500",
                    )}
                  >
                    {pm.label}
                  </span>
                </button>
              );
            })}
          </div>

          <Separator className="bg-espresso-100" />

          {/* Cash Payment */}
          {method === "cash" && (
            <div className="space-y-3">
              <Input
                label="Uang Diterima"
                placeholder="Masukkan jumlah"
                value={cashReceived}
                onChange={(e) => {
                  setCashReceived(e.target.value);
                  setIsExact(false);
                }}
                prefix={<span className="text-xs font-medium">Rp</span>}
                inputMode="numeric"
                disabled={isExact}
              />
              <button
                onClick={() => {
                  setIsExact(true);
                  setCashReceived("");
                }}
                className={cn(
                  "rounded-lg border-2 px-3 py-2 text-xs font-medium transition-all",
                  isExact
                    ? "border-espresso-600 bg-espresso-50 text-espresso-800"
                    : "border-espresso-200 text-espresso-500 hover:border-espresso-300",
                )}
              >
                ✓ Uang Pas
              </button>
              <div className="flex flex-wrap gap-2">
                {QUICK_CASH_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => {
                      setCashReceived(String(amt));
                      setIsExact(false);
                    }}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                      cashReceived === String(amt) && !isExact
                        ? "border-espresso-600 bg-espresso-600 text-white"
                        : "border-espresso-200 text-espresso-600 hover:border-espresso-300",
                    )}
                  >
                    {formatRupiah(amt)}
                  </button>
                ))}
              </div>
              {canPayCash && !isExact && cashReceivedNum > 0 && (
                <div
                  className={cn(
                    "rounded-lg p-3",
                    change >= 0 ? "bg-success-50" : "bg-danger-50",
                  )}
                >
                  <div className="flex justify-between text-sm">
                    <span
                      className={
                        change >= 0 ? "text-success-700" : "text-danger-700"
                      }
                    >
                      Kembalian
                    </span>
                    <span
                      className={cn(
                        "font-bold tabular-nums",
                        change >= 0 ? "text-success-700" : "text-danger-700",
                      )}
                    >
                      {formatRupiah(Math.max(0, change))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* QRIS Payment */}
          {method === "qris" && (
            <div className="flex flex-col items-center space-y-4 py-4">
              <div className="rounded-xl border-2 border-dashed border-espresso-300 p-4">
                <QRCodeSVG
                  value={`KOFFEE-POS-QRIS-${total}-${qrTimestamp}`}
                  size={200}
                  level="M"
                  includeMargin
                />
              </div>
              <p className="text-sm text-espresso-500 text-center">
                Tunjukkan QR code ini ke pelanggan
                <br />
                <span className="text-xs">
                  Pastikan pelanggan sudah transfer sebelum konfirmasi
                </span>
              </p>
              <Input
                placeholder="No. referensi (opsional)"
                value={ewalletRef}
                onChange={(e) => setEwalletRef(e.target.value)}
                className="max-w-xs"
              />
            </div>
          )}

          {/* Card Payment */}
          {method === "card" && (
            <div className="space-y-3 py-4">
              <Input
                label="4 Digit Terakhir Kartu"
                placeholder="Masukkan 4 digit"
                value={cardDigits}
                onChange={(e) =>
                  setCardDigits(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                inputMode="numeric"
                maxLength={4}
                prefix={<CreditCard className="h-4 w-4" />}
              />
              <p className="text-xs text-espresso-400">
                Geser kartu di mesin EDC, lalu masukkan 4 digit terakhir kartu
                sebagai referensi.
              </p>
            </div>
          )}

          {/* E-Wallet Payment */}
          {method === "ewallet" && (
            <div className="flex flex-col items-center space-y-4 py-4">
              <div className="rounded-xl border-2 border-dashed border-espresso-300 p-4">
                <QRCodeSVG
                  value={`KOFFEE-POS-EWALLET-${total}-${qrTimestamp}`}
                  size={200}
                  level="M"
                  includeMargin
                />
              </div>
              <p className="text-sm text-espresso-500 text-center">
                Scan QR atau buka aplikasi e-wallet
                <br />
                <span className="text-xs">
                  Pastikan pembayaran sudah berhasil sebelum konfirmasi
                </span>
              </p>
              <Input
                placeholder="No. referensi (opsional)"
                value={ewalletRef}
                onChange={(e) => setEwalletRef(e.target.value)}
                className="max-w-xs"
              />
            </div>
          )}
        </div>

        <div className="border-t border-espresso-100 pt-4">
          <Button
            className="w-full h-12 text-base gap-2"
            onClick={handlePay}
            disabled={method === "cash" ? !canPayCash : false}
            loading={isProcessing}
          >
            {method === "cash" &&
              !isExact &&
              change >= 0 &&
              `Konfirmasi — Kembalian ${formatRupiah(change)}`}
            {method === "cash" && isExact && "Konfirmasi — Uang Pas"}
            {method === "cash" && !canPayCash && "Uang Kurang"}
            {method === "qris" && "Konfirmasi Pembayaran QRIS"}
            {method === "card" && "Konfirmasi Pembayaran Kartu"}
            {method === "ewallet" && "Konfirmasi Pembayaran E-Wallet"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
