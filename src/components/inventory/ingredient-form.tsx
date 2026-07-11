"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Ingredient } from "@/types";
import { INGREDIENT_CATEGORY_LABELS } from "@/constants";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/constants";
import { toast } from "sonner";

interface IngredientFormProps {
  ingredient: Ingredient | null;
  open: boolean;
  onClose: () => void;
}

type IngredientFormState = {
  name: string;
  description: string;
  category: string;
  unit: string;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  costPerUnit: number;
  supplier: string;
  supplierCode: string;
};

const EMPTY_STATE: IngredientFormState = {
  name: "",
  description: "",
  category: "coffee-beans",
  unit: "gram",
  currentStock: 0,
  minStockLevel: 0,
  maxStockLevel: 0,
  costPerUnit: 0,
  supplier: "",
  supplierCode: "",
};

export function IngredientForm({
  ingredient,
  open,
  onClose,
}: IngredientFormProps) {
  const isEdit = !!ingredient;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<IngredientFormState>(EMPTY_STATE);

  const initialState = useMemo<IngredientFormState>(() => {
    if (!ingredient) return EMPTY_STATE;

    return {
      name: ingredient.name,
      description: ingredient.description || "",
      category: ingredient.category,
      unit: ingredient.unit,
      currentStock: ingredient.currentStock,
      minStockLevel: ingredient.minStockLevel,
      maxStockLevel: ingredient.maxStockLevel,
      costPerUnit: ingredient.costPerUnit,
      supplier: ingredient.supplier || "",
      supplierCode: ingredient.supplierCode || "",
    };
  }, [ingredient]);

  useEffect(() => {
    if (!open) return;
    // Defer state update to avoid react-hooks/set-state-in-effect error
    Promise.resolve().then(() => setForm(initialState));
  }, [open, initialState]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Nama bahan baku wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const id =
        ingredient?.id ||
        `ing-${form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

      const data = {
        storeId: "default",
        name: form.name.trim(),
        description: form.description.trim() || null,
        category: form.category,
        unit: form.unit,
        currentStock: form.currentStock,
        minStockLevel: form.minStockLevel,
        maxStockLevel: form.maxStockLevel,
        costPerUnit: form.costPerUnit,
        supplier: form.supplier.trim() || null,
        supplierCode: form.supplierCode.trim() || null,
        isActive: true,
        lowStockAlert: form.currentStock <= form.minStockLevel,
        updatedAt: serverTimestamp(),
      };

      if (!isEdit) {
        Object.assign(data, { createdAt: serverTimestamp() });
      }

      await setDoc(doc(db, COLLECTIONS.ingredients, id), data, { merge: true });

      toast.success(
        isEdit ? "Bahan baku diperbarui" : "Bahan baku ditambahkan",
      );
      onClose();
    } catch (error) {
      console.error("Save ingredient error:", error);
      toast.error("Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  };

  const update = (
    key: keyof IngredientFormState,
    value: IngredientFormState[keyof IngredientFormState],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Bahan Baku" : "Tambah Bahan Baku"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Ubah informasi bahan baku"
              : "Masukkan data bahan baku baru"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">
          <Input
            label="Nama Bahan *"
            placeholder="contoh: Biji Arabica"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="col-span-2"
          />

          <Input
            label="Deskripsi"
            placeholder="Opsional"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            className="col-span-2"
          />

          <div className="col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-espresso-700">
              Kategori
            </label>
            <select
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              className="flex h-10 w-full rounded-lg border border-espresso-200 bg-white px-3 py-2 text-sm text-espresso-900 focus:border-espresso-500 focus:outline-none focus:ring-2 focus:ring-espresso-500/20"
            >
              {Object.entries(INGREDIENT_CATEGORY_LABELS).map(
                ([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </div>

          <Input
            label="Satuan"
            placeholder="gram, ml, piece..."
            value={form.unit}
            onChange={(e) => update("unit", e.target.value)}
          />

          <Input
            label="Stok Saat Ini"
            type="number"
            placeholder="0"
            value={String(form.currentStock)}
            onChange={(e) =>
              update("currentStock", parseFloat(e.target.value) || 0)
            }
            inputMode="numeric"
          />

          <Input
            label="Stok Minimum (Alert)"
            type="number"
            placeholder="0"
            value={String(form.minStockLevel)}
            onChange={(e) =>
              update("minStockLevel", parseFloat(e.target.value) || 0)
            }
            inputMode="numeric"
          />

          <Input
            label="Stok Maksimum"
            type="number"
            placeholder="0"
            value={String(form.maxStockLevel)}
            onChange={(e) =>
              update("maxStockLevel", parseFloat(e.target.value) || 0)
            }
            inputMode="numeric"
          />

          <Input
            label="Harga per Satuan (Rp)"
            type="number"
            placeholder="0"
            value={String(form.costPerUnit)}
            onChange={(e) =>
              update("costPerUnit", parseFloat(e.target.value) || 0)
            }
            inputMode="decimal"
            prefix="Rp"
          />

          <Input
            label="Kode Supplier"
            placeholder="Opsional"
            value={form.supplierCode}
            onChange={(e) => update("supplierCode", e.target.value)}
          />

          <Input
            label="Nama Supplier"
            placeholder="Opsional"
            value={form.supplier}
            onChange={(e) => update("supplier", e.target.value)}
            className="col-span-2"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={handleSave} loading={loading}>
            {isEdit ? "Simpan Perubahan" : "Tambah"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
