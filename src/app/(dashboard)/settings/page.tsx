"use client";

import { useMemo, useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import {
  Building2,
  Calculator,
  Clock,
  Plus,
  ReceiptText,
  Save,
  Settings,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { STORE_ID } from "@/constants";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { useSettings } from "@/hooks/use-settings";
import type { DaySchedule, StoreSettings, TableConfig } from "@/types";

type EditableSettings = Omit<StoreSettings, "id" | "createdAt" | "updatedAt">;

const DAYS: { key: string; label: string }[] = [
  { key: "monday", label: "Senin" },
  { key: "tuesday", label: "Selasa" },
  { key: "wednesday", label: "Rabu" },
  { key: "thursday", label: "Kamis" },
  { key: "friday", label: "Jumat" },
  { key: "saturday", label: "Sabtu" },
  { key: "sunday", label: "Minggu" },
];

const defaultSchedule = DAYS.reduce<Record<string, DaySchedule>>(
  (acc, day) => {
    acc[day.key] = { open: "08:00", close: "22:00", isOpen: true };
    return acc;
  },
  {},
);

const defaultSettings: EditableSettings = {
  storeId: STORE_ID,
  name: "KOFFEE POS",
  tagline: "Coffee shop point of sale",
  address: "",
  phone: "",
  email: "",
  website: "",
  operatingHours: defaultSchedule,
  timezone: "Asia/Jakarta",
  tables: [
    { number: 1, capacity: 2, area: "indoor", isActive: true },
    { number: 2, capacity: 2, area: "indoor", isActive: true },
    { number: 3, capacity: 4, area: "indoor", isActive: true },
    { number: 4, capacity: 4, area: "outdoor", isActive: true },
  ],
  tax: {
    enabled: true,
    rate: 10,
    mode: "included",
  },
  receipt: {
    header: "Terima kasih sudah berkunjung",
    footer: "Simpan struk ini sebagai bukti pembayaran",
    showLoyalty: true,
    printerWidth: 80,
    printMode: "browser",
  },
  orderPrefix: "KOF",
  orderNumberReset: "daily",
  loyalty: {
    enabled: true,
    pointsPerThousand: 1,
    redemptionRate: 50,
    tiers: {
      bronze: { minPoints: 0, multiplier: 1 },
      silver: { minPoints: 500, multiplier: 1.2 },
      gold: { minPoints: 2000, multiplier: 1.5 },
      platinum: { minPoints: 5000, multiplier: 2 },
    },
  },
  logo: "",
  primaryColor: "#8b5e34",
};

function mergeSettings(settings: StoreSettings | null): EditableSettings {
  if (!settings) return defaultSettings;

  return {
    ...defaultSettings,
    ...settings,
    storeId: settings.storeId || STORE_ID,
    operatingHours: {
      ...defaultSchedule,
      ...(settings.operatingHours || {}),
    },
    tax: {
      ...defaultSettings.tax,
      ...(settings.tax || {}),
    },
    receipt: {
      ...defaultSettings.receipt,
      ...(settings.receipt || {}),
    },
    loyalty: {
      ...defaultSettings.loyalty,
      ...(settings.loyalty || {}),
      tiers: {
        ...defaultSettings.loyalty.tiers,
        ...(settings.loyalty?.tiers || {}),
      },
    },
    tables: settings.tables?.length ? settings.tables : defaultSettings.tables,
  };
}

function ToggleButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border px-3 py-2 text-xs font-medium transition-all",
        active
          ? "border-espresso-600 bg-espresso-600 text-white"
          : "border-espresso-200 bg-white text-espresso-600 hover:border-espresso-300",
      )}
    >
      {children}
    </button>
  );
}

function SettingsForm({ initial }: { initial: EditableSettings }) {
  const [form, setForm] = useState(initial);
  const [isSaving, setIsSaving] = useState(false);

  const activeTables = useMemo(
    () => form.tables.filter((table) => table.isActive).length,
    [form.tables],
  );

  const update = <K extends keyof EditableSettings>(
    key: K,
    value: EditableSettings[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateSchedule = (
    day: string,
    key: keyof DaySchedule,
    value: string | boolean,
  ) => {
    setForm((current) => ({
      ...current,
      operatingHours: {
        ...current.operatingHours,
        [day]: {
          ...current.operatingHours[day],
          [key]: value,
        },
      },
    }));
  };

  const updateTable = (
    index: number,
    key: keyof TableConfig,
    value: string | number | boolean,
  ) => {
    setForm((current) => ({
      ...current,
      tables: current.tables.map((table, i) =>
        i === index ? { ...table, [key]: value } : table,
      ),
    }));
  };

  const addTable = () => {
    setForm((current) => {
      const nextNumber =
        current.tables.reduce((max, table) => Math.max(max, table.number), 0) +
        1;
      return {
        ...current,
        tables: [
          ...current.tables,
          { number: nextNumber, capacity: 2, area: "indoor", isActive: true },
        ],
      };
    });
  };

  const removeTable = (index: number) => {
    setForm((current) => ({
      ...current,
      tables: current.tables.filter((_, i) => i !== index),
    }));
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Nama toko wajib diisi");
      return;
    }

    setIsSaving(true);
    try {
      await setDoc(
        doc(db, "stores", STORE_ID, "settings", "main"),
        {
          ...form,
          storeId: STORE_ID,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true },
      );
      toast.success("Pengaturan berhasil disimpan");
    } catch (error) {
      console.error("Save settings error:", error);
      toast.error("Gagal menyimpan pengaturan");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Building2 className="h-5 w-5 text-espresso-600" />
            <div>
              <p className="text-xs text-espresso-500">Toko</p>
              <p className="font-semibold text-espresso-900">{form.name}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Calculator className="h-5 w-5 text-info-600" />
            <div>
              <p className="text-xs text-espresso-500">Pajak</p>
              <p className="font-semibold text-espresso-900">
                {form.tax.enabled ? `${form.tax.rate}%` : "Nonaktif"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <ReceiptText className="h-5 w-5 text-success-600" />
            <div>
              <p className="text-xs text-espresso-500">Meja Aktif</p>
              <p className="font-semibold text-espresso-900">
                {activeTables} meja
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" />
                Profil Toko
              </CardTitle>
              <CardDescription>
                Data ini tampil di struk dan identitas sistem.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Input
                label="Nama Toko"
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
              />
              <Input
                label="Tagline"
                value={form.tagline || ""}
                onChange={(event) => update("tagline", event.target.value)}
              />
              <Input
                label="Telepon"
                value={form.phone}
                onChange={(event) => update("phone", event.target.value)}
              />
              <Input
                label="Email"
                type="email"
                value={form.email || ""}
                onChange={(event) => update("email", event.target.value)}
              />
              <Input
                label="Website"
                value={form.website || ""}
                onChange={(event) => update("website", event.target.value)}
              />
              <Input
                label="Timezone"
                value={form.timezone}
                onChange={(event) => update("timezone", event.target.value)}
              />
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-espresso-700">
                  Alamat
                </label>
                <textarea
                  value={form.address}
                  onChange={(event) => update("address", event.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-espresso-200 bg-white px-3 py-2 text-sm text-espresso-900 focus:border-espresso-500 focus:outline-none focus:ring-2 focus:ring-espresso-500/20"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                Jam Operasional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {DAYS.map((day) => {
                const schedule = form.operatingHours[day.key];
                return (
                  <div
                    key={day.key}
                    className="grid gap-2 rounded-lg border border-espresso-100 p-3 sm:grid-cols-[96px_1fr_1fr_96px] sm:items-center"
                  >
                    <p className="text-sm font-medium text-espresso-800">
                      {day.label}
                    </p>
                    <Input
                      type="time"
                      value={schedule.open}
                      disabled={!schedule.isOpen}
                      onChange={(event) =>
                        updateSchedule(day.key, "open", event.target.value)
                      }
                    />
                    <Input
                      type="time"
                      value={schedule.close}
                      disabled={!schedule.isOpen}
                      onChange={(event) =>
                        updateSchedule(day.key, "close", event.target.value)
                      }
                    />
                    <ToggleButton
                      active={schedule.isOpen}
                      onClick={() =>
                        updateSchedule(day.key, "isOpen", !schedule.isOpen)
                      }
                    >
                      {schedule.isOpen ? "Buka" : "Tutup"}
                    </ToggleButton>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ReceiptText className="h-4 w-4" />
                Meja
              </CardTitle>
              <CardDescription>
                Dipakai POS saat tipe pesanan dine-in.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {form.tables.map((table, index) => (
                <div
                  key={`${table.number}-${index}`}
                  className="grid gap-2 rounded-lg border border-espresso-100 p-3 md:grid-cols-[1fr_1fr_1fr_88px_40px] md:items-end"
                >
                  <Input
                    label="Nomor"
                    type="number"
                    min={1}
                    value={table.number}
                    onChange={(event) =>
                      updateTable(index, "number", Number(event.target.value))
                    }
                  />
                  <Input
                    label="Kapasitas"
                    type="number"
                    min={1}
                    value={table.capacity}
                    onChange={(event) =>
                      updateTable(index, "capacity", Number(event.target.value))
                    }
                  />
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-espresso-700">
                      Area
                    </label>
                    <div className="flex gap-1">
                      {(["indoor", "outdoor", "bar"] as const).map((area) => (
                        <ToggleButton
                          key={area}
                          active={table.area === area}
                          onClick={() => updateTable(index, "area", area)}
                        >
                          {area}
                        </ToggleButton>
                      ))}
                    </div>
                  </div>
                  <ToggleButton
                    active={table.isActive}
                    onClick={() =>
                      updateTable(index, "isActive", !table.isActive)
                    }
                  >
                    {table.isActive ? "Aktif" : "Nonaktif"}
                  </ToggleButton>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTable(index)}
                    title="Hapus meja"
                  >
                    <Trash2 className="h-4 w-4 text-danger-500" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addTable}>
                <Plus className="h-4 w-4" />
                Tambah Meja
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calculator className="h-4 w-4" />
                Pajak
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <ToggleButton
                  active={form.tax.enabled}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      tax: { ...current.tax, enabled: true },
                    }))
                  }
                >
                  Aktif
                </ToggleButton>
                <ToggleButton
                  active={!form.tax.enabled}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      tax: { ...current.tax, enabled: false },
                    }))
                  }
                >
                  Nonaktif
                </ToggleButton>
              </div>
              <Input
                label="Rate Pajak (%)"
                type="number"
                min={0}
                value={form.tax.rate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    tax: { ...current.tax, rate: Number(event.target.value) },
                  }))
                }
              />
              <div className="flex gap-2">
                <ToggleButton
                  active={form.tax.mode === "included"}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      tax: { ...current.tax, mode: "included" },
                    }))
                  }
                >
                  Termasuk Harga
                </ToggleButton>
                <ToggleButton
                  active={form.tax.mode === "added"}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      tax: { ...current.tax, mode: "added" },
                    }))
                  }
                >
                  Ditambahkan
                </ToggleButton>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ReceiptText className="h-4 w-4" />
                Struk
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Header Struk"
                value={form.receipt.header}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    receipt: {
                      ...current.receipt,
                      header: event.target.value,
                    },
                  }))
                }
              />
              <Input
                label="Footer Struk"
                value={form.receipt.footer}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    receipt: {
                      ...current.receipt,
                      footer: event.target.value,
                    },
                  }))
                }
              />
              <div className="flex gap-2">
                {[58, 80].map((width) => (
                  <ToggleButton
                    key={width}
                    active={form.receipt.printerWidth === width}
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        receipt: {
                          ...current.receipt,
                          printerWidth: width as 58 | 80,
                        },
                      }))
                    }
                  >
                    {width}mm
                  </ToggleButton>
                ))}
              </div>
              <ToggleButton
                active={form.receipt.showLoyalty}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    receipt: {
                      ...current.receipt,
                      showLoyalty: !current.receipt.showLoyalty,
                    },
                  }))
                }
              >
                {form.receipt.showLoyalty
                  ? "Loyalty tampil"
                  : "Loyalty disembunyikan"}
              </ToggleButton>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4" />
                Loyalty
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant={form.loyalty.enabled ? "success" : "secondary"}>
                  {form.loyalty.enabled ? "Aktif" : "Nonaktif"}
                </Badge>
                <ToggleButton
                  active={form.loyalty.enabled}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      loyalty: {
                        ...current.loyalty,
                        enabled: !current.loyalty.enabled,
                      },
                    }))
                  }
                >
                  Toggle
                </ToggleButton>
              </div>
              <Input
                label="Poin per Rp1.000"
                type="number"
                min={0}
                value={form.loyalty.pointsPerThousand}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    loyalty: {
                      ...current.loyalty,
                      pointsPerThousand: Number(event.target.value),
                    },
                  }))
                }
              />
              <Input
                label="Nilai 1 Poin (Rp)"
                type="number"
                min={1}
                value={form.loyalty.redemptionRate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    loyalty: {
                      ...current.loyalty,
                      redemptionRate: Number(event.target.value),
                    },
                  }))
                }
              />
            </CardContent>
          </Card>

          <div className="sticky bottom-4 rounded-xl border border-espresso-200 bg-white p-3 shadow-lg">
            <Button
              size="lg"
              className="w-full"
              onClick={save}
              loading={isSaving}
            >
              <Save className="h-4 w-4" />
              Simpan Pengaturan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { settings, isLoading } = useSettings();
  const merged = useMemo(() => mergeSettings(settings), [settings]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Pengaturan"
          description="Konfigurasi operasional toko"
        />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-[520px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan"
        description="Konfigurasi toko, pajak, struk, loyalty, dan meja"
      >
        <div className="hidden items-center gap-2 text-sm text-espresso-500 sm:flex">
          <Settings className="h-4 w-4" />
          <span>Store ID: {STORE_ID}</span>
        </div>
      </PageHeader>
      <SettingsForm key={settings?.updatedAt?.getTime?.() || "default"} initial={merged} />
    </div>
  );
}
