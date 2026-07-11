"use client";

import { useState } from "react";
import { Grid3X3, Pencil, Plus, Search, Trash2 } from "lucide-react";

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
import { useCategories } from "@/hooks/use-categories";
import { useCategoryActions } from "@/hooks/use-menu-actions";
import type { Category } from "@/types";

type CategoryForm = {
  id?: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  displayOrder: string;
  isAvailable: boolean;
};

const emptyForm: CategoryForm = {
  name: "",
  description: "",
  icon: "Coffee",
  color: "#8b5e34",
  displayOrder: "0",
  isAvailable: true,
};

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
}

export default function CategoriesPage() {
  const { categories, isLoading } = useCategories();
  const { saveCategory, deleteCategory } = useCategoryActions();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const filtered = categories.filter((category) =>
    category.name.toLowerCase().includes(search.toLowerCase()),
  );

  const openCreate = () => {
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (category: Category) => {
    setForm({
      id: category.id,
      name: category.name,
      description: category.description || "",
      icon: category.icon || "Coffee",
      color: category.color || "#8b5e34",
      displayOrder: String(category.displayOrder || 0),
      isAvailable: category.isAvailable,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const saved = await saveCategory({
      id: form.id,
      storeId: "default",
      name: form.name,
      slug: slugify(form.name),
      description: form.description,
      icon: form.icon,
      color: form.color,
      displayOrder: Number(form.displayOrder) || 0,
      isActive: true,
      isAvailable: form.isAvailable,
    });
    setSaving(false);
    if (saved) setOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Kategori"
        description="Kelola pengelompokan menu coffee shop"
      >
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Tambah Kategori
        </Button>
      </PageHeader>

      <Input
        placeholder="Cari kategori..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        prefix={<Search className="h-4 w-4" />}
        className="max-w-sm"
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-espresso-100 text-left text-xs font-medium uppercase text-espresso-500">
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Urutan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="border-b border-espresso-50">
                    {Array.from({ length: 5 }).map((__, cell) => (
                      <td key={cell} className="px-4 py-3">
                        <Skeleton className="h-5 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-espresso-400"
                  >
                    Belum ada kategori
                  </td>
                </tr>
              ) : (
                filtered.map((category) => (
                  <tr
                    key={category.id}
                    className="border-b border-espresso-50 hover:bg-espresso-50/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
                          style={{ backgroundColor: category.color }}
                        >
                          <Grid3X3 className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-espresso-900">
                            {category.name}
                          </p>
                          <p className="text-xs text-espresso-400">
                            {category.description || "Tanpa deskripsi"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-espresso-500">
                      {category.slug}
                    </td>
                    <td className="px-4 py-3">{category.displayOrder}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={category.isAvailable ? "success" : "secondary"}
                      >
                        {category.isAvailable ? "Tersedia" : "Disembunyikan"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => openEdit(category)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => deleteCategory(category.id)}
                          title="Nonaktifkan"
                        >
                          <Trash2 className="h-4 w-4 text-danger-500" />
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
              {form.id ? "Edit Kategori" : "Tambah Kategori"}
            </DialogTitle>
            <DialogDescription>
              Kategori yang tersedia akan muncul di tab POS.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 px-6 py-2">
            <Input
              label="Nama Kategori"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
            />
            <Input
              label="Deskripsi"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Warna"
                type="color"
                value={form.color}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    color: event.target.value,
                  }))
                }
              />
              <Input
                label="Urutan"
                type="number"
                value={form.displayOrder}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    displayOrder: event.target.value,
                  }))
                }
              />
            </div>
            <label className="flex items-center gap-2 rounded-lg border border-espresso-100 p-3 text-sm text-espresso-700">
              <input
                type="checkbox"
                checked={form.isAvailable}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isAvailable: event.target.checked,
                  }))
                }
              />
              Tampilkan di POS
            </label>
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
