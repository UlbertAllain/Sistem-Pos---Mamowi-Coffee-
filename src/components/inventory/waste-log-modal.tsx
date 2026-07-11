"use client";

import { useState } from "react";
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
import type { Ingredient } from "@/types";
import { useInventoryActions } from "@/hooks/use-inventory-actions";

interface WasteLogModalProps {
  ingredient: Ingredient | null;
  open: boolean;
  onClose: () => void;
}

export function WasteLogModal({
  ingredient,
  open,
  onClose,
}: WasteLogModalProps) {
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { recordTransaction } = useInventoryActions();

  const handleSave = async () => {
    if (!ingredient) return;
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      alert("Masukkan jumlah yang valid");
      return;
    }
    if (!reason.trim()) {
      alert("Alasan waste wajib diisi");
      return;
    }

    setLoading(true);
    const success = await recordTransaction({
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      type: "waste",
      quantity: qty,
      unit: ingredient.unit,
      referenceType: "waste",
      notes: `Waste: ${reason}`,
    });

    if (success) {
      setQuantity("");
      setReason("");
      onClose();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle className="text-danger-600">Catat Waste</DialogTitle>
          <DialogDescription>
            {ingredient?.name} — Stok saat ini:{" "}
            <strong>
              {ingredient?.currentStock} {ingredient?.unit}
            </strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Input
            label="Jumlah Waste"
            type="number"
            placeholder="Masukkan jumlah"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            inputMode="decimal"
            suffix={ingredient?.unit}
          />
          <Input
            label="Alasan *"
            placeholder="contoh: Tumpah, expired, salah racik..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button variant="destructive" onClick={handleSave} loading={loading}>
            Catat Waste
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
