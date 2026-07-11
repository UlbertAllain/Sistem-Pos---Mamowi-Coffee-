"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Ban, Eye, Printer, Receipt, Search } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { COLLECTIONS, STORE_ID } from "@/constants";
import { db } from "@/lib/firebase";
import { formatRupiah } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types";
import { useSettings } from "@/hooks/use-settings";
import { useAuthStore } from "@/stores/auth-store";
import { ReceiptPrint } from "@/components/pos/receipt";
import { toast } from "sonner";

const statusVariant: Record<
  OrderStatus,
  "default" | "secondary" | "success" | "warning" | "destructive" | "info"
> = {
  new: "info",
  held: "warning",
  pending_payment: "warning",
  paid: "success",
  completed: "default",
  voided: "destructive",
};

const statusLabel: Record<OrderStatus, string> = {
  new: "Baru",
  held: "Hold",
  pending_payment: "Menunggu Bayar",
  paid: "Dibayar",
  completed: "Selesai",
  voided: "Void",
};

function mapOrder(raw: Record<string, unknown>, id: string): Order {
  const timestamps = raw.timestamps as Record<string, { toDate?: () => Date }>;
  return {
    id,
    ...raw,
    timestamps: {
      createdAt: timestamps?.createdAt?.toDate?.() || new Date(),
      heldAt: timestamps?.heldAt?.toDate?.() || null,
      recalledAt: timestamps?.recalledAt?.toDate?.() || null,
      paidAt: timestamps?.paidAt?.toDate?.() || null,
      completedAt: timestamps?.completedAt?.toDate?.() || null,
      voidedAt: timestamps?.voidedAt?.toDate?.() || null,
    },
  } as Order;
}

export default function OrdersPage() {
  const { settings } = useSettings();
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [voidOrder, setVoidOrder] = useState<Order | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [isVoiding, setIsVoiding] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  const canVoid = user?.role === "owner" || user?.role === "manager";

  useEffect(() => {
    const q = query(
      collection(db, COLLECTIONS.orders),
      orderBy("timestamps.paidAt", "desc"),
      limit(100),
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setOrders(
          snap.docs.map((docSnap) => mapOrder(docSnap.data(), docSnap.id)),
        );
        setIsLoading(false);
      },
      (error) => {
        console.error("Orders listener error:", error);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const filteredOrders = useMemo(() => {
    const keyword = search.toLowerCase();
    return orders.filter((order) => {
      return (
        order.id.toLowerCase().includes(keyword) ||
        order.customerName?.toLowerCase().includes(keyword) ||
        order.cashierName.toLowerCase().includes(keyword) ||
        order.payments.some((payment) => payment.method.includes(keyword))
      );
    });
  }, [orders, search]);

  const totalRevenue = filteredOrders.reduce(
    (sum, order) => sum + (order.status === "voided" ? 0 : order.totalAmount),
    0,
  );

  const buildReceiptData = (order: Order) => {
    const payment = order.payments[0];
    const cashPayment = order.payments.find((p) => p.method === "cash");
    const redemptionRate = settings?.loyalty?.redemptionRate || 50;

    return {
      orderId: order.id,
      storeName: settings?.name || "KOFFEE POS",
      storeAddress: settings?.address || "",
      storePhone: settings?.phone || "",
      orderType: order.orderType,
      tableNumber: order.tableNumber,
      cashierName: order.cashierName,
      items: order.items.map((item) => ({
        name: item.name,
        variant: item.variant?.name,
        modifiers: item.modifiers,
        notes: item.notes,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      })),
      subtotal: order.subtotal,
      taxRate: order.taxRate,
      taxMode: settings?.tax.mode || "included",
      taxAmount: order.taxAmount,
      discountAmount: order.discountAmount,
      discountType: order.discountType,
      discountValue: order.discountValue,
      loyaltyDiscount: order.loyaltyPointsRedeemed * redemptionRate,
      loyaltyPointsEarned: order.loyaltyPointsEarned,
      loyaltyPointsRedeemed: order.loyaltyPointsRedeemed,
      total: order.totalAmount,
      paymentMethod: payment?.method || "cash",
      cashReceived: cashPayment?.received || cashPayment?.amount || 0,
      change: cashPayment?.change || 0,
      showLoyalty: settings?.receipt.showLoyalty ?? true,
      receiptFooter: settings?.receipt.footer || "",
    };
  };

  const handlePrint = (order: Order) => {
    setReceiptOrder(order);
    window.setTimeout(() => window.print(), 50);
  };

  const handleVoidOrder = async () => {
    if (!voidOrder) return;
    if (!canVoid) {
      toast.error("Hanya owner atau manager yang bisa void order");
      return;
    }
    if (!voidReason.trim()) {
      toast.error("Alasan void wajib diisi");
      return;
    }

    setIsVoiding(true);
    try {
      await updateDoc(doc(db, COLLECTIONS.orders, voidOrder.id), {
        status: "voided",
        paymentStatus: "refunded",
        voidReason: voidReason.trim(),
        voidApprovedBy: user?.uid || null,
        "timestamps.voidedAt": serverTimestamp(),
      });

      if (voidOrder.shiftId) {
        const cashAmount = voidOrder.payments
          .filter((payment) => payment.method === "cash")
          .reduce((sum, payment) => sum + payment.amount, 0);

        await updateDoc(doc(db, COLLECTIONS.shifts, voidOrder.shiftId), {
          totalTransactions: increment(-1),
          totalRevenue: increment(-voidOrder.totalAmount),
          expectedCash: increment(-cashAmount),
        });
      }

      await addDoc(collection(db, COLLECTIONS.activityLogs), {
        storeId: STORE_ID,
        userId: user?.uid || "",
        userName: user?.displayName || "",
        action: "order.void",
        category: "orders",
        description: `Void order ${voidOrder.id}`,
        metadata: {
          orderId: voidOrder.id,
          reason: voidReason.trim(),
          amount: voidOrder.totalAmount,
        },
        createdAt: serverTimestamp(),
      });

      toast.success(`Order ${voidOrder.id} berhasil di-void`);
      setVoidOrder(null);
      setVoidReason("");
      if (selectedOrder?.id === voidOrder.id) setSelectedOrder(null);
    } catch (error) {
      console.error("Void order error:", error);
      toast.error("Gagal void order");
    } finally {
      setIsVoiding(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Pesanan"
        description="Riwayat transaksi, pembayaran, dan item pesanan"
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <Input
          placeholder="Cari nomor, pelanggan, kasir, pembayaran..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          prefix={<Search className="h-4 w-4" />}
          className="max-w-md"
        />
        <div className="flex gap-4 text-sm text-espresso-500">
          <span>{filteredOrders.length} pesanan</span>
          <span>{formatRupiah(totalRevenue)} pendapatan</span>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-espresso-100 text-left text-xs font-medium uppercase text-espresso-500">
                <th className="px-4 py-3">No Pesanan</th>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Pelanggan</th>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index} className="border-b border-espresso-50">
                    {Array.from({ length: 7 }).map((__, cell) => (
                      <td key={cell} className="px-4 py-3">
                        <Skeleton className="h-5 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-espresso-400"
                  >
                    Belum ada pesanan
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-espresso-50 hover:bg-espresso-50/50"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-espresso-900">
                      {order.id}
                    </td>
                    <td className="px-4 py-3 text-xs text-espresso-500">
                      {format(order.timestamps.paidAt || order.timestamps.createdAt, "dd MMM yyyy, HH:mm", {
                        locale: idLocale,
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-espresso-800">
                        {order.customerName || "Umum"}
                      </p>
                      <p className="text-xs text-espresso-400">
                        {order.cashierName}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-espresso-600">
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)} item
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[order.status]}>
                        {statusLabel[order.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-semibold tabular-nums">
                      {formatRupiah(order.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => setSelectedOrder(order)}
                          title="Lihat detail"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => handlePrint(order)}
                          title="Cetak ulang"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        {canVoid && order.status !== "voided" && (
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => setVoidOrder(order)}
                            title="Void order"
                          >
                            <Ban className="h-4 w-4 text-danger-500" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      >
        <DialogContent size="lg">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  {selectedOrder.id}
                </DialogTitle>
                <DialogDescription>
                  {selectedOrder.customerName || "Pelanggan umum"} -{" "}
                  {selectedOrder.payments.map((payment) => payment.method).join(", ")}
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[65vh] space-y-4 overflow-y-auto px-6 pb-6 pt-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-espresso-400">Kasir</p>
                    <p className="font-medium">{selectedOrder.cashierName}</p>
                  </div>
                  <div>
                    <p className="text-espresso-400">Shift</p>
                    <p className="font-mono text-xs">{selectedOrder.shiftId || "-"}</p>
                  </div>
                  <div>
                    <p className="text-espresso-400">Tipe</p>
                    <p className="font-medium">{selectedOrder.orderType}</p>
                  </div>
                  <div>
                    <p className="text-espresso-400">Meja</p>
                    <p className="font-medium">{selectedOrder.tableNumber || "-"}</p>
                  </div>
                  <div>
                    <p className="text-espresso-400">Status</p>
                    <Badge variant={statusVariant[selectedOrder.status]}>
                      {statusLabel[selectedOrder.status]}
                    </Badge>
                  </div>
                  {selectedOrder.voidReason && (
                    <div>
                      <p className="text-espresso-400">Alasan Void</p>
                      <p className="font-medium text-danger-600">
                        {selectedOrder.voidReason}
                      </p>
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-espresso-100">
                  {selectedOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between border-b border-espresso-50 px-3 py-2 last:border-b-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-espresso-900">
                          {item.quantity}x {item.name}
                        </p>
                        <p className="text-xs text-espresso-400">
                          {item.variant?.name || "Reguler"}
                          {item.notes ? ` - ${item.notes}` : ""}
                        </p>
                      </div>
                      <p className="text-sm font-semibold tabular-nums">
                        {formatRupiah(item.subtotal)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatRupiah(selectedOrder.subtotal)}</span>
                  </div>
                  {selectedOrder.discountAmount > 0 && (
                    <div className="flex justify-between text-success-700">
                      <span>Diskon</span>
                      <span>-{formatRupiah(selectedOrder.discountAmount)}</span>
                    </div>
                  )}
                  {selectedOrder.loyaltyPointsRedeemed > 0 && (
                    <div className="flex justify-between text-success-700">
                      <span>Loyalty dipakai</span>
                      <span>{selectedOrder.loyaltyPointsRedeemed} poin</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-espresso-900">
                    <span>Total</span>
                    <span>{formatRupiah(selectedOrder.totalAmount)}</span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => handlePrint(selectedOrder)}
                >
                  <Printer className="h-4 w-4" />
                  Cetak Ulang
                </Button>
                {canVoid && selectedOrder.status !== "voided" && (
                  <Button
                    variant="destructive"
                    onClick={() => setVoidOrder(selectedOrder)}
                  >
                    <Ban className="h-4 w-4" />
                    Void Order
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!voidOrder}
        onOpenChange={(open) => {
          if (!open) {
            setVoidOrder(null);
            setVoidReason("");
          }
        }}
      >
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Void Order</DialogTitle>
            <DialogDescription>
              Order akan ditandai void, pembayaran dianggap refund, dan rekap
              shift dikoreksi.
            </DialogDescription>
          </DialogHeader>
          {voidOrder && (
            <div className="space-y-4 px-6 py-2">
              <div className="rounded-lg bg-danger-50 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-danger-700">Order</span>
                  <span className="font-mono font-bold">{voidOrder.id}</span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-danger-700">Total</span>
                  <span className="font-bold">
                    {formatRupiah(voidOrder.totalAmount)}
                  </span>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-espresso-700">
                  Alasan Void
                </label>
                <textarea
                  value={voidReason}
                  onChange={(event) => setVoidReason(event.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-espresso-200 bg-white px-3 py-2 text-sm text-espresso-900 focus:border-espresso-500 focus:outline-none focus:ring-2 focus:ring-espresso-500/20"
                  placeholder="Contoh: salah input item, pembayaran dibatalkan..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setVoidOrder(null);
                setVoidReason("");
              }}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleVoidOrder}
              loading={isVoiding}
            >
              Void Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {receiptOrder && <ReceiptPrint data={buildReceiptData(receiptOrder)} />}
    </div>
  );
}
