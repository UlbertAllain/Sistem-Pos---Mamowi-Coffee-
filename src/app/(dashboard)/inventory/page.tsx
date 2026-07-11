"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { IngredientForm } from "@/components/inventory/ingredient-form";
import { StockAdjustmentModal } from "@/components/inventory/stock-adjustment-modal";
import { WasteLogModal } from "@/components/inventory/waste-log-modal";
import { StockHistoryModal } from "@/components/inventory/stock-history-modal";
import { useIngredients } from "@/hooks/use-ingredients";
import { INGREDIENT_CATEGORY_LABELS } from "@/constants";
import { formatRupiah, formatNumber, cn } from "@/lib/utils";
import type { Ingredient } from "@/types";
import {
  Plus,
  Search,
  ArrowDown,
  ArrowUp,
  RotateCcw,
  Trash2,
  History,
  AlertTriangle,
  Package,
  Pencil,
} from "lucide-react";

export default function InventoryPage() {
  const { ingredients, isLoading } = useIngredients();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const [formIngredient, setFormIngredient] = useState<Ingredient | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [adjustIngredient, setAdjustIngredient] = useState<Ingredient | null>(
    null,
  );
  const [adjustMode, setAdjustMode] = useState<"in" | "out" | "adjustment">(
    "in",
  );
  const [showAdjust, setShowAdjust] = useState(false);
  const [wasteIngredient, setWasteIngredient] = useState<Ingredient | null>(
    null,
  );
  const [showWaste, setShowWaste] = useState(false);
  const [historyIngredient, setHistoryIngredient] = useState<Ingredient | null>(
    null,
  );
  const [showHistory, setShowHistory] = useState(false);

  const filtered = ingredients.filter((ing) => {
    const matchSearch =
      ing.name.toLowerCase().includes(search.toLowerCase()) ||
      ing.supplier?.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      filterCategory === "all" || ing.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const lowStockCount = ingredients.filter((i) => i.lowStockAlert).length;
  const outOfStockCount = ingredients.filter(
    (i) => i.currentStock === 0,
  ).length;
  const categoryCount = new Set(ingredients.map((i) => i.category)).size;

  const openForm = (ing: Ingredient | null) => {
    setFormIngredient(ing);
    setShowForm(true);
  };
  const openAdjust = (ing: Ingredient, mode: "in" | "out" | "adjustment") => {
    setAdjustIngredient(ing);
    setAdjustMode(mode);
    setShowAdjust(true);
  };
  const openWaste = (ing: Ingredient) => {
    setWasteIngredient(ing);
    setShowWaste(true);
  };
  const openHistory = (ing: Ingredient) => {
    setHistoryIngredient(ing);
    setShowHistory(true);
  };

  const getStockStatus = (ing: Ingredient) => {
    if (ing.currentStock === 0)
      return { label: "Habis", variant: "destructive" as const };
    if (ing.lowStockAlert)
      return { label: "Rendah", variant: "warning" as const };
    return { label: "Aman", variant: "success" as const };
  };

  const getStockBarColor = (ing: Ingredient) => {
    if (ing.currentStock === 0) return "bg-danger-500";
    if (ing.lowStockAlert) return "bg-warning-500";
    return "bg-success-500";
  };

  const getStockTextColor = (ing: Ingredient) => {
    if (ing.currentStock === 0) return "text-danger-600";
    if (ing.lowStockAlert) return "text-warning-600";
    return "text-espresso-900";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Inventaris" description="Kelola stok bahan baku">
        <Button onClick={() => openForm(null)}>
          <Plus className="h-4 w-4" />
          Tambah Bahan
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-espresso-50 p-2.5">
              <Package className="h-5 w-5 text-espresso-600" />
            </div>
            <div>
              <p className="text-xs text-espresso-500">Total Bahan</p>
              <p className="text-xl font-bold">{ingredients.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-danger-50 p-2.5">
              <AlertTriangle className="h-5 w-5 text-danger-600" />
            </div>
            <div>
              <p className="text-xs text-espresso-500">Stok Rendah</p>
              <p className="text-xl font-bold text-danger-600">
                {lowStockCount}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-warning-50 p-2.5">
              <AlertTriangle className="h-5 w-5 text-warning-600" />
            </div>
            <div>
              <p className="text-xs text-espresso-500">Habis</p>
              <p className="text-xl font-bold text-warning-600">
                {outOfStockCount}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-success-50 p-2.5">
              <Package className="h-5 w-5 text-success-600" />
            </div>
            <div>
              <p className="text-xs text-espresso-500">Kategori</p>
              <p className="text-xl font-bold">{categoryCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <Input
            placeholder="Cari bahan baku..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            prefix={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilterCategory("all")}
            className={cn(
              "shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-all",
              filterCategory === "all"
                ? "bg-espresso-600 text-white"
                : "bg-white border border-espresso-200 text-espresso-600 hover:border-espresso-300",
            )}
          >
            Semua
          </button>
          {Object.entries(INGREDIENT_CATEGORY_LABELS).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilterCategory(val)}
              className={cn(
                "shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-all",
                filterCategory === val
                  ? "bg-espresso-600 text-white"
                  : "bg-white border border-espresso-200 text-espresso-600 hover:border-espresso-300",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockCount > 0 && (
        <div className="rounded-lg border border-warning-300 bg-warning-50 p-3">
          <p className="text-sm font-semibold text-warning-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {lowStockCount} bahan baku di bawah stok minimum
          </p>
        </div>
      )}

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-espresso-100 text-left text-xs font-medium uppercase text-espresso-500">
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3 text-right">Stok</th>
                <th className="px-4 py-3 text-right">Min</th>
                <th className="px-4 py-3 text-right">Harga/Unit</th>
                <th className="px-4 py-3 text-right">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-espresso-50">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-5 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-espresso-400"
                  >
                    Tidak ada bahan baku ditemukan
                  </td>
                </tr>
              ) : (
                filtered.map((ing) => {
                  const status = getStockStatus(ing);
                  const stockPercent =
                    ing.maxStockLevel > 0
                      ? Math.min(
                          100,
                          (ing.currentStock / ing.maxStockLevel) * 100,
                        )
                      : 50;
                  const categoryLabel =
                    INGREDIENT_CATEGORY_LABELS[ing.category] || ing.category;

                  return (
                    <tr
                      key={ing.id}
                      className="border-b border-espresso-50 hover:bg-espresso-50/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-espresso-900">
                          {ing.name}
                        </p>
                        {ing.supplier && (
                          <p className="text-[11px] text-espresso-400">
                            {ing.supplier}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="text-[10px]">
                          {categoryLabel}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p
                          className={cn(
                            "font-bold tabular-nums",
                            getStockTextColor(ing),
                          )}
                        >
                          {formatNumber(ing.currentStock)}{" "}
                          <span className="font-normal text-xs text-espresso-400">
                            {ing.unit}
                          </span>
                        </p>
                        {ing.maxStockLevel > 0 && (
                          <div className="mt-1 h-1.5 w-20 ml-auto rounded-full bg-espresso-100 overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                getStockBarColor(ing),
                              )}
                              style={{ width: `${stockPercent}%` }}
                            />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-espresso-500">
                        {formatNumber(ing.minStockLevel)} {ing.unit}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-espresso-600">
                        {formatRupiah(ing.costPerUnit)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge variant={status.variant} className="text-[10px]">
                          {status.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openAdjust(ing, "in")}
                            className="rounded-md p-1.5 text-success-500 hover:bg-success-50 transition-colors"
                            title="Stok Masuk"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openAdjust(ing, "out")}
                            className="rounded-md p-1.5 text-danger-500 hover:bg-danger-50 transition-colors"
                            title="Stok Keluar"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openAdjust(ing, "adjustment")}
                            className="rounded-md p-1.5 text-info-500 hover:bg-info-50 transition-colors"
                            title="Penyesuaian"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openWaste(ing)}
                            className="rounded-md p-1.5 text-warning-500 hover:bg-warning-50 transition-colors"
                            title="Catat Waste"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openHistory(ing)}
                            className="rounded-md p-1.5 text-espresso-400 hover:bg-espresso-100 transition-colors"
                            title="Riwayat"
                          >
                            <History className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openForm(ing)}
                            className="rounded-md p-1.5 text-espresso-400 hover:bg-espresso-100 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <IngredientForm
        ingredient={formIngredient}
        open={showForm}
        onClose={() => setShowForm(false)}
      />
      <StockAdjustmentModal
        ingredient={adjustIngredient}
        open={showAdjust}
        onClose={() => setShowAdjust(false)}
        mode={adjustMode}
      />
      <WasteLogModal
        ingredient={wasteIngredient}
        open={showWaste}
        onClose={() => setShowWaste(false)}
      />
      <StockHistoryModal
        ingredient={historyIngredient}
        open={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </div>
  );
}
