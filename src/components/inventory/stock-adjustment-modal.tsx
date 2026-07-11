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

interface StockAdjustmentModalProps {
  ingredient: Ingredient | null;
  open: boolean;
  onClose: () => void;
  mode: "in" | "out" | "adjustment";
}

export function StockAdjustmentModal({
  ingredient,
  open,
  onClose,
  mode,
}: StockAdjustmentModalProps) {
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const { recordTransaction } = useInventoryActions();

  const modeLabels = {
    in: "Stok Masuk",
    out: "Stok Keluar",
    adjustment: "Penyesuaian Stok",
  };

  const modeColors = {
    in: "text-success-600",
    out: "text-danger-600",
    adjustment: "text-info-600",
  };

  const handleSave = async () => {
    if (!ingredient) return;
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      alert("Masukkan jumlah yang valid");
      return;
    }

    setLoading(true);
    const success = await recordTransaction({
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      type: mode === "adjustment" ? "adjustment" : mode,
      quantity: qty,
      unit: ingredient.unit,
      referenceType: mode === "adjustment" ? "adjustment" : `manual_${mode}`,
      notes: notes || undefined,
    });

    if (success) {
      setQuantity("");
      setNotes("");
      onClose();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle className={modeColors[mode]}>
            {modeLabels[mode]}
          </DialogTitle>
          <DialogDescription>
            {ingredient?.name} — Stok saat ini:{" "}
            <strong>
              {ingredient?.currentStock} {ingredient?.unit}
            </strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Input
            label="Jumlah"
            type="number"
            placeholder="Masukkan jumlah"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            inputMode="decimal"
            suffix={ingredient?.unit}
          />
          <Input
            label="Catatan"
            placeholder="Opsional"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button
            onClick={handleSave}
            loading={loading}
            variant={mode === "out" ? "destructive" : "default"}
          >
            {modeLabels[mode]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
