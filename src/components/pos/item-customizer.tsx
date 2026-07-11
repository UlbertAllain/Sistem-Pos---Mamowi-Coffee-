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
import { Separator } from "@radix-ui/react-separator";
import { Minus, Plus } from "lucide-react";
import { cn, formatRupiah } from "@/lib/utils";
import type {
  MenuItem,
  RecipeItem,
  Variant,
  SelectedModifier,
  ModifierGroup,
} from "@/types";
import Image from "next/image";
import { Coffee } from "lucide-react";

interface ItemCustomizerProps {
  item: MenuItem | null;
  open: boolean;
  onClose: () => void;
  onAdd: (params: {
    menuItemId: string;
    name: string;
    image?: string;
    recipe?: RecipeItem[];
    basePrice: number;
    variant: Variant | null;
    modifiers: SelectedModifier[];
    notes: string;
    quantity: number;
  }) => void;
}

export function ItemCustomizer({
  item,
  open,
  onClose,
  onAdd,
}: ItemCustomizerProps) {
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<
    SelectedModifier[]
  >([]);
  const [notes, setNotes] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!item) return;

    // Lint rule in this project flags any setState inside useEffect.
    // So we only derive UI state from the current item without resetting here.
    // Default state is handled by state initializers + re-mount via key.
  }, [item]);

  if (!item) return null;

  const variantPrice = selectedVariant?.priceAdjustment || 0;
  const modifiersPrice = selectedModifiers.reduce(
    (s, m) => s + m.priceAdjustment,
    0,
  );
  const unitPrice = item.basePrice + variantPrice + modifiersPrice;
  const totalPrice = unitPrice * quantity;

  const toggleModifier = (
    group: ModifierGroup,
    option: { id: string; name: string; priceAdjustment: number },
  ) => {
    setSelectedModifiers((prev) => {
      if (group.type === "single") {
        const filtered = prev.filter((m) => m.groupId !== group.id);
        return [
          ...filtered,
          {
            groupId: group.id,
            groupName: group.name,
            optionId: option.id,
            optionName: option.name,
            priceAdjustment: option.priceAdjustment,
          },
        ];
      } else {
        const exists = prev.find(
          (m) => m.groupId === group.id && m.optionId === option.id,
        );
        if (exists) {
          return prev.filter(
            (m) => !(m.groupId === group.id && m.optionId === option.id),
          );
        }
        return [
          ...prev,
          {
            groupId: group.id,
            groupName: group.name,
            optionId: option.id,
            optionName: option.name,
            priceAdjustment: option.priceAdjustment,
          },
        ];
      }
    });
  };

  const isModifierSelected = (groupId: string, optionId: string) =>
    selectedModifiers.some(
      (m) => m.groupId === groupId && m.optionId === optionId,
    );

  const handleAdd = () => {
    onAdd({
      menuItemId: item.id,
      name: item.name,
      image: item.image,
      recipe: item.recipe,
      basePrice: item.basePrice,
      variant: selectedVariant,
      modifiers: selectedModifiers,
      notes,
      quantity,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent size="lg" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {item.image ? (
              <div className="relative h-12 w-12 overflow-hidden rounded-lg">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-espresso-100">
                <Coffee className="h-6 w-6 text-espresso-400" />
              </div>
            )}
            <span>{item.name}</span>
          </DialogTitle>
          {item.description && (
            <DialogDescription>{item.description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Variant / Size Selection */}
          {item.variants.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-espresso-800">
                Ukuran <span className="text-danger-500">*</span>
              </p>
              <div className="grid grid-cols-3 gap-2">
                {item.variants.map((v) => {
                  const vPrice = item.basePrice + v.priceAdjustment;
                  const isSelected = selectedVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={cn(
                        "flex flex-col items-center rounded-lg border-2 px-3 py-3 text-center transition-all",
                        isSelected
                          ? "border-espresso-600 bg-espresso-50"
                          : "border-espresso-200 hover:border-espresso-300",
                      )}
                    >
                      <span className="text-sm font-semibold">{v.name}</span>
                      {v.sizeMl && (
                        <span className="text-[10px] text-espresso-400">
                          {v.sizeMl}ml
                        </span>
                      )}
                      <span
                        className={cn(
                          "mt-1 text-sm font-bold",
                          isSelected
                            ? "text-espresso-700"
                            : "text-espresso-500",
                        )}
                      >
                        {formatRupiah(vPrice)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Modifier Groups */}
          {item.modifierGroups.map((group) => (
            <div key={group.id}>
              <p className="mb-2 text-sm font-semibold text-espresso-800">
                {group.name}
                {group.isRequired && (
                  <span className="text-danger-500"> *</span>
                )}
                <span className="ml-2 text-xs font-normal text-espresso-400">
                  ({group.type === "single" ? "pilih satu" : "bisa banyak"})
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {group.options.map((opt) => {
                  const selected = isModifierSelected(group.id, opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => toggleModifier(group, opt)}
                      className={cn(
                        "rounded-full border-2 px-3 py-1.5 text-sm transition-all",
                        selected
                          ? "border-espresso-600 bg-espresso-600 text-white"
                          : "border-espresso-200 text-espresso-600 hover:border-espresso-300",
                      )}
                    >
                      {opt.name}
                      {opt.priceAdjustment > 0 && (
                        <span
                          className={cn(
                            "ml-1 text-xs",
                            selected
                              ? "text-espresso-200"
                              : "text-espresso-400",
                          )}
                        >
                          +{formatRupiah(opt.priceAdjustment)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Notes */}
          <div>
            <Input
              label="Catatan Khusus"
              placeholder="contoh: less ice, no sugar..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Quantity */}
          <div>
            <p className="mb-2 text-sm font-semibold text-espresso-800">
              Jumlah
            </p>
            <div className="inline-flex items-center rounded-lg border border-espresso-200">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="flex h-10 w-10 items-center justify-center text-espresso-500 hover:bg-espresso-50 transition-colors rounded-l-lg"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="flex h-10 w-12 items-center justify-center border-x border-espresso-200 text-sm font-bold tabular-nums">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="flex h-10 w-10 items-center justify-center text-espresso-500 hover:bg-espresso-50 transition-colors rounded-r-lg"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <Separator className="bg-espresso-100" />

        {/* Footer */}
        <DialogFooter className="flex-row items-center justify-between gap-4 sm:gap-6">
          <div>
            <p className="text-xs text-espresso-400">
              {formatRupiah(unitPrice)} × {quantity}
            </p>
            <p className="text-xl font-bold text-espresso-900">
              {formatRupiah(totalPrice)}
            </p>
          </div>
          <Button size="lg" onClick={handleAdd} className="px-8">
            <Plus className="h-4 w-4" />
            Tambah
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
