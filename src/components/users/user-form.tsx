"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS, ROLE_LABELS } from "@/constants";
import type { User, UserRole } from "@/types";
import { toast } from "sonner";

interface UserFormProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
}

export function UserForm({ user, open, onClose }: UserFormProps) {
  const isEdit = !!user;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    role: "cashier" as UserRole,
    pin: "",
    isActive: true,
  });

  useEffect(() => {
    queueMicrotask(() => {
      if (!user) {
        setForm({
          displayName: "",
          email: "",
          role: "cashier",
          pin: "",
          isActive: true,
        });
        return;
      }

      setForm({
        displayName: user.displayName,
        email: user.email || "",
        role: user.role,
        pin: "",
        isActive: user.isActive,
      });
    });
  }, [user]);

  const update = (key: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (!form.displayName.trim()) {
      toast.error("Nama wajib diisi");
      return;
    }
    if (
      !isEdit &&
      !form.pin &&
      form.role !== "owner" &&
      form.role !== "manager"
    ) {
      toast.error("PIN wajib diisi untuk kasir/barista baru");
      return;
    }

    setLoading(true);
    try {
      const id = user?.uid || `user-${Date.now()}`;
      const data: Record<string, unknown> = {
        uid: id,
        storeId: "default",
        displayName: form.displayName.trim(),
        email: form.email.trim() || null,
        role: form.role,
        isActive: form.isActive,
        updatedAt: serverTimestamp(),
      };

      // Only set PIN if creating new user or if PIN field is filled
      if (!isEdit && form.pin) {
        data.pin = form.pin;
      } else if (isEdit && form.pin) {
        data.pin = form.pin;
      }
      // If editing and PIN is empty, don't include it in update (keep existing)

      if (!isEdit) {
        data.createdAt = serverTimestamp();
      }

      await setDoc(doc(db, COLLECTIONS.users, id), data, { merge: true });
      toast.success(isEdit ? "Pengguna diperbarui" : "Pengguna ditambahkan");
      onClose();
    } catch (error) {
      console.error("Save user error:", error);
      toast.error("Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  };

  const roleOptions: { value: UserRole; label: string }[] = [
    { value: "manager", label: ROLE_LABELS.manager },
    { value: "cashier", label: ROLE_LABELS.cashier },
    { value: "barista", label: ROLE_LABELS.barista },
    { value: "viewer", label: ROLE_LABELS.viewer },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Pengguna" : "Tambah Pengguna"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Ubah data pengguna"
              : "Pengguna kasir/barista cukup dengan PIN, tidak perlu akun Firebase Auth."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Input
            label="Nama Lengkap *"
            placeholder="Nama pengguna"
            value={form.displayName}
            onChange={(e) => update("displayName", e.target.value)}
          />
          <Input
            label="Email (opsional)"
            placeholder="email@koffee.id"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-espresso-700">
              Role *
            </label>
            <select
              value={form.role}
              onChange={(e) => update("role", e.target.value)}
              className="flex h-10 w-full rounded-lg border border-espresso-200 bg-white px-3 py-2 text-sm text-espresso-900 focus:border-espresso-500 focus:outline-none focus:ring-2 focus:ring-espresso-500/20"
            >
              {roleOptions.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            label={isEdit ? "PIN (kosongkan jika tidak diubah)" : "PIN *"}
            placeholder={isEdit ? "Kosongkan = tidak ubah" : "4-6 digit PIN"}
            value={form.pin}
            onChange={(e) =>
              update("pin", e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            inputMode="numeric"
            maxLength={6}
          />
          {!isEdit && (
            <p className="text-[11px] text-espresso-400">
              Simpan ID pengguna ini. Digunakan untuk login PIN di halaman
              kasir.
            </p>
          )}

          {isEdit && (
            <div className="flex items-center gap-3 rounded-lg border border-espresso-200 p-3">
              <label className="text-sm font-medium text-espresso-700 flex-1">
                Status Aktif
              </label>
              <button
                type="button"
                onClick={() => update("isActive", !form.isActive)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${form.isActive ? "bg-success-500" : "bg-espresso-200"}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${form.isActive ? "translate-x-5" : "translate-x-0.5"}`}
                />
              </button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={handleSave} loading={loading}>
            {isEdit ? "Simpan" : "Tambah"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
