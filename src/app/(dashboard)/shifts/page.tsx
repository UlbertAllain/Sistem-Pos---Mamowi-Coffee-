"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Banknote,
  Clock,
  DoorClosed,
  DoorOpen,
  Receipt,
  TrendingUp,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ROLE_LABELS } from "@/constants";
import { formatRupiah, parseRupiahToNumber } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useActiveShift, useShiftActions, useShifts } from "@/hooks/use-shifts";
import type { Shift } from "@/types";

function getDurationText(start: Date, end: Date | null, now: number) {
  const endTime = end?.getTime() || now || start.getTime();
  const duration = Math.max(0, Math.round((endTime - start.getTime()) / 60000));
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  return `${hours}j ${minutes}m`;
}

function OpenShiftDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { openShift } = useShiftActions();
  const [openingCash, setOpeningCash] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const submit = async () => {
    const amount = parseRupiahToNumber(openingCash);
    setIsSaving(true);
    const shiftId = await openShift({ openingCash: amount, notes });
    setIsSaving(false);
    if (shiftId) {
      setOpeningCash("");
      setNotes("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Buka Shift</DialogTitle>
          <DialogDescription>
            Masukkan modal awal kas sebelum mulai transaksi.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Input
            label="Modal Awal"
            value={openingCash}
            onChange={(event) => setOpeningCash(event.target.value)}
            prefix={<span className="text-xs font-medium">Rp</span>}
            inputMode="numeric"
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-espresso-700">
              Catatan
            </label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              className="w-full rounded-lg border border-espresso-200 bg-white px-3 py-2 text-sm text-espresso-900 focus:border-espresso-500 focus:outline-none focus:ring-2 focus:ring-espresso-500/20"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={submit} loading={isSaving}>
            <DoorOpen className="h-4 w-4" />
            Buka Shift
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CloseShiftDialog({
  shift,
  open,
  onOpenChange,
}: {
  shift: Shift;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { closeShift } = useShiftActions();
  const [closingCash, setClosingCash] = useState(
    String(shift.expectedCash ?? shift.openingCash),
  );
  const [notes, setNotes] = useState(shift.notes || "");
  const [isSaving, setIsSaving] = useState(false);

  const expectedCash = shift.expectedCash ?? shift.openingCash;
  const closingCashAmount = parseRupiahToNumber(closingCash);
  const difference = closingCashAmount - expectedCash;

  const submit = async () => {
    setIsSaving(true);
    const ok = await closeShift({
      shiftId: shift.id,
      closingCash: closingCashAmount,
      expectedCash,
      notes,
    });
    setIsSaving(false);
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Tutup Shift</DialogTitle>
          <DialogDescription>
            Cocokkan uang fisik di kas dengan kas sistem.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-lg bg-espresso-50 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-espresso-500">Kas sistem</span>
              <span className="font-bold tabular-nums">
                {formatRupiah(expectedCash)}
              </span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-espresso-500">Transaksi</span>
              <span>{shift.totalTransactions} transaksi</span>
            </div>
          </div>
          <Input
            label="Uang Fisik di Kas"
            value={closingCash}
            onChange={(event) => setClosingCash(event.target.value)}
            prefix={<span className="text-xs font-medium">Rp</span>}
            inputMode="numeric"
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-espresso-700">
              Catatan Tutup Shift
            </label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              className="w-full rounded-lg border border-espresso-200 bg-white px-3 py-2 text-sm text-espresso-900 focus:border-espresso-500 focus:outline-none focus:ring-2 focus:ring-espresso-500/20"
            />
          </div>
          <div className="flex justify-between rounded-lg border border-espresso-100 p-3 text-sm">
            <span className="text-espresso-500">Selisih</span>
            <span
              className={`font-bold tabular-nums ${
                difference < 0 ? "text-danger-600" : "text-success-600"
              }`}
            >
              {formatRupiah(difference)}
            </span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={submit} loading={isSaving}>
            <DoorClosed className="h-4 w-4" />
            Tutup Shift
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ShiftsPage() {
  const { user } = useAuthStore();
  const { shifts, isLoading } = useShifts();
  const { shift: activeShift } = useActiveShift(user?.uid);
  const [currentTime, setCurrentTime] = useState(0);
  const [dateFilter, setDateFilter] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [openDialog, setOpenDialog] = useState(false);
  const [closeDialog, setCloseDialog] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setCurrentTime(Date.now()));
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const filtered = useMemo(
    () =>
      shifts.filter((shift) => {
        if (!dateFilter) return true;
        const shiftDate = shift.startTime.toISOString().split("T")[0];
        return shiftDate === dateFilter;
      }),
    [dateFilter, shifts],
  );

  const totalRevenue = filtered.reduce(
    (sum, shift) => sum + (shift.totalRevenue || 0),
    0,
  );
  const totalTx = filtered.reduce(
    (sum, shift) => sum + (shift.totalTransactions || 0),
    0,
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Shift"
        description="Buka tutup shift kasir dan audit kas harian"
      >
        {activeShift ? (
          <Button variant="destructive" onClick={() => setCloseDialog(true)}>
            <DoorClosed className="h-4 w-4" />
            Tutup Shift
          </Button>
        ) : (
          <Button onClick={() => setOpenDialog(true)}>
            <DoorOpen className="h-4 w-4" />
            Buka Shift
          </Button>
        )}
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Shift Saya
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeShift ? (
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-espresso-400">Mulai</p>
                  <p className="font-semibold">
                    {format(activeShift.startTime, "HH:mm", {
                      locale: idLocale,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-espresso-400">Durasi</p>
                  <p className="font-semibold">
                    {getDurationText(
                      activeShift.startTime,
                      activeShift.endTime,
                      currentTime,
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-espresso-400">Kas Sistem</p>
                  <p className="font-semibold tabular-nums">
                    {formatRupiah(
                      activeShift.expectedCash ?? activeShift.openingCash,
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-espresso-200 p-4 text-sm text-espresso-500">
                Belum ada shift aktif. Buka shift sebelum melakukan checkout.
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <TrendingUp className="h-5 w-5 text-success-600" />
            <div>
              <p className="text-xs text-espresso-500">Pendapatan Filter</p>
              <p className="font-bold tabular-nums">
                {formatRupiah(totalRevenue)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Receipt className="h-5 w-5 text-info-600" />
            <div>
              <p className="text-xs text-espresso-500">Transaksi Filter</p>
              <p className="font-bold tabular-nums">{totalTx}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <Input
          label="Filter Tanggal"
          type="date"
          value={dateFilter}
          onChange={(event) => setDateFilter(event.target.value)}
          className="w-44"
        />
        <p className="text-sm text-espresso-500">
          {filtered.length} shift ditemukan
        </p>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-espresso-400">
              Belum ada data shift
            </CardContent>
          </Card>
        ) : (
          filtered.map((shift) => {
            const expectedCash = shift.expectedCash ?? shift.openingCash;
            const difference =
              shift.cashDifference ??
              (shift.closingCash === null ? null : shift.closingCash - expectedCash);

            return (
              <Card key={shift.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-espresso-50">
                        <Banknote className="h-5 w-5 text-espresso-500" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-espresso-900">
                            {shift.userName}
                          </p>
                          <Badge variant="secondary" className="text-[10px]">
                            {ROLE_LABELS[shift.role]}
                          </Badge>
                          <Badge
                            variant={
                              shift.status === "active"
                                ? "success"
                                : "secondary"
                            }
                            className="text-[10px]"
                          >
                            {shift.status === "active" ? "Aktif" : "Selesai"}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-espresso-400">
                          {format(shift.startTime, "dd MMM yyyy, HH:mm", {
                            locale: idLocale,
                          })}
                          {" - "}
                          {shift.endTime
                            ? format(shift.endTime, "HH:mm", {
                                locale: idLocale,
                              })
                            : "sekarang"}
                          {" | "}
                          {getDurationText(
                            shift.startTime,
                            shift.endTime,
                            currentTime,
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-5 lg:min-w-[620px]">
                      <div>
                        <p className="text-xs text-espresso-400">Modal</p>
                        <p className="font-semibold tabular-nums">
                          {formatRupiah(shift.openingCash)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-espresso-400">Revenue</p>
                        <p className="font-semibold tabular-nums">
                          {formatRupiah(shift.totalRevenue)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-espresso-400">Kas Sistem</p>
                        <p className="font-semibold tabular-nums">
                          {formatRupiah(expectedCash)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-espresso-400">Kas Tutup</p>
                        <p className="font-semibold tabular-nums">
                          {shift.closingCash === null
                            ? "-"
                            : formatRupiah(shift.closingCash)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-espresso-400">Selisih</p>
                        <p
                          className={`font-semibold tabular-nums ${
                            difference === null
                              ? "text-espresso-400"
                              : difference < 0
                                ? "text-danger-600"
                                : "text-success-600"
                          }`}
                        >
                          {difference === null ? "-" : formatRupiah(difference)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <OpenShiftDialog open={openDialog} onOpenChange={setOpenDialog} />
      {activeShift && (
        <CloseShiftDialog
          key={activeShift.id}
          shift={activeShift}
          open={closeDialog}
          onOpenChange={setCloseDialog}
        />
      )}
    </div>
  );
}
