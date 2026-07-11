"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import {
  Coffee,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
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
import { useCategories } from "@/hooks/use-categories";
import { useMenuItemActions } from "@/hooks/use-menu-actions";
import { useMenuItems } from "@/hooks/use-menu-items";
import { formatRupiah, parseRupiahToNumber } from "@/lib/utils";
import type { MenuItem } from "@/types";

type MenuForm = {
  id?: string;
  categoryId: string;
  name: string;
  description: string;
  sku: string;
  basePrice: string;
  displayOrder: string;
  image: string;
  isAvailable: boolean;
  isBestSeller: boolean;
  isNew: boolean;
};

const emptyForm: MenuForm = {
  categoryId: "",
  name: "",
  description: "",
  sku: "",
  basePrice: "",
  displayOrder: "0",
  image: "",
  isAvailable: true,
  isBestSeller: false,
  isNew: false,
};

export default function MenuPage() {
  const { categories } = useCategories();
  const { items, isLoading } = useMenuItems();
  const { saveMenuItem, deleteMenuItem, toggleAvailability } =
    useMenuItemActions();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [form, setForm] = useState<MenuForm>(emptyForm);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const categoryName = useMemo(() => {
    return Object.fromEntries(
      categories.map((category) => [category.id, category.name]),
    );
  }, [categories]);

  const filtered = items.filter((item) => {
    const keyword = search.toLowerCase();
    const matchKeyword =
      item.name.toLowerCase().includes(keyword) ||
      item.sku?.toLowerCase().includes(keyword) ||
      item.description?.toLowerCase().includes(keyword);
    const matchCategory = categoryFilter
      ? item.categoryId === categoryFilter
      : true;
    return matchKeyword && matchCategory;
  });

  const openCreate = () => {
    setForm({
      ...emptyForm,
      categoryId: categories[0]?.id || "",
    });
    setOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setForm({
      id: item.id,
      categoryId: item.categoryId,
      name: item.name,
      description: item.description || "",
      sku: item.sku || "",
      basePrice: String(item.basePrice),
      displayOrder: String(item.displayOrder || 0),
      image: item.image || "",
      isAvailable: item.isAvailable,
      isBestSeller: item.isBestSeller,
      isNew: item.isNew,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.categoryId) return;
    setSaving(true);
    const saved = await saveMenuItem({
      id: form.id,
      storeId: "default",
      categoryId: form.categoryId,
      name: form.name,
      description: form.description,
      sku: form.sku,
      basePrice: parseRupiahToNumber(form.basePrice),
      variants: [],
      modifierGroups: [],
      recipe: [],
      image: form.image || undefined,
      images: form.image ? [form.image] : [],
      isActive: true,
      isAvailable: form.isAvailable,
      isBestSeller: form.isBestSeller,
      isNew: form.isNew,
      displayOrder: Number(form.displayOrder) || 0,
      tags: [],
    });
    setSaving(false);
    if (saved) setOpen(false);
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploadingImage(true);
    try {
      const response = await fetch("/api/uploads/menu-image", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as {
        url?: string;
        message?: string;
      };

      if (!response.ok || !result.url) {
        throw new Error(result.message || "Gagal upload gambar");
      }

      setForm((current) => ({ ...current, image: result.url || "" }));
      toast.success("Gambar menu berhasil diupload");
    } catch (error) {
      console.error("Upload menu image error:", error);
      toast.error(
        error instanceof Error ? error.message : "Gagal upload gambar",
      );
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Menu"
        description="Kelola produk, harga, dan ketersediaan menu"
      >
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Tambah Menu
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-3 lg:flex-row">
        <Input
          placeholder="Cari menu, SKU, deskripsi..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          prefix={<Search className="h-4 w-4" />}
          className="max-w-md"
        />
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="h-10 rounded-lg border border-espresso-200 bg-white px-3 text-sm text-espresso-700"
        >
          <option value="">Semua Kategori</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-espresso-100 text-left text-xs font-medium uppercase text-espresso-500">
                <th className="px-4 py-3">Menu</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Harga</th>
                <th className="px-4 py-3">Label</th>
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
                    Belum ada menu
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-espresso-50 hover:bg-espresso-50/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-espresso-50">
                            <Coffee className="h-5 w-5 text-espresso-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-espresso-900">
                            {item.name}
                          </p>
                          <p className="text-xs text-espresso-400">
                            {item.sku || item.description || "Tanpa SKU"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-espresso-600">
                      {categoryName[item.categoryId] || "-"}
                    </td>
                    <td className="px-4 py-3 font-semibold tabular-nums">
                      {formatRupiah(item.basePrice)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {item.isBestSeller && (
                          <Badge variant="warning">Best</Badge>
                        )}
                        {item.isNew && <Badge variant="info">New</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={item.isAvailable ? "success" : "secondary"}>
                        {item.isAvailable ? "Tersedia" : "Habis"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() =>
                            toggleAvailability(item.id, !item.isAvailable)
                          }
                          title="Toggle tersedia"
                        >
                          {item.isAvailable ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => openEdit(item)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => deleteMenuItem(item.id)}
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
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Menu" : "Tambah Menu"}</DialogTitle>
            <DialogDescription>
              Data ini langsung dipakai di layar POS.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 px-6 py-2 lg:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-espresso-700">
                Kategori
              </label>
              <select
                value={form.categoryId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    categoryId: event.target.value,
                  }))
                }
                className="h-10 w-full rounded-lg border border-espresso-200 bg-white px-3 text-sm"
              >
                <option value="">Pilih kategori</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Nama Menu"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
            />
            <Input
              label="Harga"
              value={form.basePrice}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  basePrice: event.target.value,
                }))
              }
              prefix={<span className="text-xs">Rp</span>}
              inputMode="numeric"
            />
            <Input
              label="SKU"
              value={form.sku}
              onChange={(event) =>
                setForm((current) => ({ ...current, sku: event.target.value }))
              }
            />
            <div className="lg:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-espresso-700">
                Gambar Menu
              </label>
              <div className="flex flex-col gap-3 rounded-lg border border-espresso-100 p-3 sm:flex-row sm:items-center">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-espresso-50">
                  {form.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.image}
                      alt={form.name || "Gambar menu"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-espresso-300" />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploadingImage}
                    asChild
                  >
                    <label>
                      <Upload className="h-4 w-4" />
                      {uploadingImage ? "Mengupload..." : "Pilih Gambar"}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="sr-only"
                        disabled={uploadingImage}
                        onChange={handleImageUpload}
                      />
                    </label>
                  </Button>
                  {form.image && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        setForm((current) => ({ ...current, image: "" }))
                      }
                    >
                      <X className="h-4 w-4" />
                      Hapus
                    </Button>
                  )}
                  {form.image && (
                    <p className="min-w-0 basis-full truncate text-xs text-espresso-400">
                      {form.image}
                    </p>
                  )}
                </div>
              </div>
            </div>
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
            <Input
              label="Deskripsi"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              className="lg:col-span-2"
            />
            <div className="flex flex-wrap gap-3 lg:col-span-2">
              {[
                ["isAvailable", "Tersedia"],
                ["isBestSeller", "Best Seller"],
                ["isNew", "Menu Baru"],
              ].map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center gap-2 rounded-lg border border-espresso-100 px-3 py-2 text-sm text-espresso-700"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(form[key as keyof MenuForm])}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        [key]: event.target.checked,
                      }))
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
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
