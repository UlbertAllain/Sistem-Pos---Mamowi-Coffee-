"use client";

import { useState } from "react";
import {
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { Pencil, Plus, Search, UserCheck, UserX, Users } from "lucide-react";
import { toast } from "sonner";

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
import { COLLECTIONS, LOYALTY_TIERS } from "@/constants";
import { useCustomerActions } from "@/hooks/use-customer-actions";
import { useCustomers } from "@/hooks/use-customers";
import { db } from "@/lib/firebase";
import { formatRupiah } from "@/lib/utils";
import type { Customer } from "@/types";

type CustomerForm = {
  id?: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
};

const emptyForm: CustomerForm = {
  name: "",
  phone: "",
  email: "",
  notes: "",
};

export default function CustomersPage() {
  const { customers, isLoading } = useCustomers();
  const { createCustomer } = useCustomerActions();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const filtered = customers.filter((customer) => {
    const keyword = search.toLowerCase();
    return (
      customer.name.toLowerCase().includes(keyword) ||
      customer.phone.includes(search) ||
      customer.email?.toLowerCase().includes(keyword) ||
      customer.loyalty.cardNumber.toLowerCase().includes(keyword)
    );
  });

  const totalPoints = filtered.reduce(
    (sum, customer) => sum + customer.loyalty.points,
    0,
  );
  const totalSpent = filtered.reduce(
    (sum, customer) => sum + customer.loyalty.totalSpent,
    0,
  );

  const openCreate = () => {
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setForm({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email || "",
      notes: customer.notes || "",
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Nama dan nomor telepon wajib diisi");
      return;
    }

    setSaving(true);
    try {
      if (!form.id) {
        const created = await createCustomer({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
        });

        if (created && form.notes.trim()) {
          await setDoc(
            doc(db, COLLECTIONS.customers, created.id),
            { notes: form.notes.trim(), updatedAt: serverTimestamp() },
            { merge: true },
          );
        }
      } else {
        await setDoc(
          doc(db, COLLECTIONS.customers, form.id),
          {
            name: form.name.trim(),
            phone: form.phone.trim(),
            email: form.email.trim() || null,
            notes: form.notes.trim() || null,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
        toast.success("Pelanggan diperbarui");
      }
      setOpen(false);
    } catch (error) {
      console.error("Save customer error:", error);
      toast.error("Gagal menyimpan pelanggan");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (customer: Customer) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.customers, customer.id), {
        isActive: !customer.isActive,
        updatedAt: serverTimestamp(),
      });
      toast.success(
        customer.isActive
          ? `${customer.name} dinonaktifkan`
          : `${customer.name} diaktifkan`,
      );
    } catch (error) {
      console.error("Toggle customer error:", error);
      toast.error("Gagal mengubah status pelanggan");
    }
  };

  const tierBadge = (tier: string) => {
    const config = LOYALTY_TIERS.find((item) => item.value === tier);
    if (!config) return null;
    return (
      <Badge
        className="text-[10px]"
        style={{
          backgroundColor: `${config.color}20`,
          borderColor: config.color,
          color: config.color,
        }}
      >
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Pelanggan"
        description="Database pelanggan dan status loyalty"
      >
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Tambah Pelanggan
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <Input
          placeholder="Cari nama, telepon, email, kartu..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          prefix={<Search className="h-4 w-4" />}
          className="max-w-md"
        />
        <div className="flex gap-4 text-sm text-espresso-500">
          <span>{filtered.length} pelanggan</span>
          <span>{totalPoints} poin aktif</span>
          <span>{formatRupiah(totalSpent)} total belanja</span>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-espresso-100 text-left text-xs font-medium uppercase text-espresso-500">
                <th className="px-4 py-3">Pelanggan</th>
                <th className="px-4 py-3">Kartu</th>
                <th className="px-4 py-3">Loyalty</th>
                <th className="px-4 py-3">Kunjungan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index} className="border-b border-espresso-50">
                    {Array.from({ length: 6 }).map((__, cell) => (
                      <td key={cell} className="px-4 py-3">
                        <Skeleton className="h-5 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-espresso-400"
                  >
                    Belum ada pelanggan
                  </td>
                </tr>
              ) : (
                filtered.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-espresso-50 hover:bg-espresso-50/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-espresso-50">
                          <Users className="h-5 w-5 text-espresso-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-espresso-900">
                            {customer.name}
                          </p>
                          <p className="text-xs text-espresso-400">
                            {customer.phone}
                            {customer.email ? ` - ${customer.email}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-espresso-500">
                      {customer.loyalty.cardNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {tierBadge(customer.loyalty.tier)}
                        <span className="font-semibold">
                          {customer.loyalty.points} pts
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-espresso-400">
                        {formatRupiah(customer.loyalty.totalSpent)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-espresso-600">
                      {customer.loyalty.totalVisits}x
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={customer.isActive ? "success" : "secondary"}
                      >
                        {customer.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => openEdit(customer)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => toggleActive(customer)}
                          title={customer.isActive ? "Nonaktifkan" : "Aktifkan"}
                        >
                          {customer.isActive ? (
                            <UserX className="h-4 w-4 text-danger-500" />
                          ) : (
                            <UserCheck className="h-4 w-4 text-success-500" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={(nextOpen) => setOpen(nextOpen)}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Edit Pelanggan" : "Tambah Pelanggan"}
            </DialogTitle>
            <DialogDescription>
              Pelanggan dapat dipilih di POS untuk earn dan redeem poin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 px-6 py-2">
            <Input
              label="Nama"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
            />
            <Input
              label="No. Telepon"
              value={form.phone}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  phone: event.target.value.replace(/\D/g, "").slice(0, 13),
                }))
              }
              inputMode="numeric"
            />
            <Input
              label="Email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
            />
            <Input
              label="Catatan"
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} loading={saving}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
