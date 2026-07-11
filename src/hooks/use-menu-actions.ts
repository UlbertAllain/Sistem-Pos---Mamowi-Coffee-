import { doc, setDoc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/constants";
import { toast } from "sonner";
import type { Category, MenuItem } from "@/types";

export function useCategoryActions() {
  const saveCategory = async (category: Omit<Category, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<string | null> => {
    try {
      const id = category.id || `cat-${category.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      const now = serverTimestamp();
      
      const data = {
        storeId: "default",
        name: category.name.trim(),
        slug: category.slug || category.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description: category.description?.trim() || null,
        icon: category.icon || "cup",
        color: category.color || "#a87640",
        image: category.image || null,
        displayOrder: category.displayOrder ?? 0,
        isActive: category.isActive ?? true,
        isAvailable: category.isAvailable ?? true,
        updatedAt: now,
      };

      const catRef = doc(db, COLLECTIONS.categories, id);
      const catSnap = await getDoc(catRef);
      
      if (!catSnap.exists()) {
        Object.assign(data, { createdAt: now });
      }

      await setDoc(catRef, data, { merge: true });
      toast.success(catSnap.exists() ? "Kategori diperbarui" : "Kategori ditambahkan");
      return id;
    } catch (error) {
      console.error("Save category error:", error);
      toast.error("Gagal menyimpan kategori");
      return null;
    }
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    try {
      // Check if category has menu items
      // For now just soft delete
      await updateDoc(doc(db, COLLECTIONS.categories, id), {
        isActive: false,
        updatedAt: serverTimestamp(),
      });
      toast.success("Kategori dinonaktifkan");
      return true;
    } catch (error) {
      console.error("Delete category error:", error);
      toast.error("Gagal menghapus kategori");
      return false;
    }
  };

  return { saveCategory, deleteCategory };
}

export function useMenuItemActions() {
  const saveMenuItem = async (item: Omit<MenuItem, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<string | null> => {
    try {
      const id = item.id || `mi-${item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      const now = serverTimestamp();
      
      // Calculate base price from default variant if not set
      const defaultVariant = item.variants?.find(v => v.isDefault);
      const basePrice = item.basePrice || (defaultVariant ? defaultVariant.priceAdjustment : 0) + (item.basePrice || 0);

      const data = {
        storeId: "default",
        categoryId: item.categoryId,
        name: item.name.trim(),
        description: item.description?.trim() || null,
        sku: item.sku?.trim() || null,
        basePrice: basePrice,
        variants: item.variants || [],
        modifierGroups: item.modifierGroups || [],
        recipe: item.recipe || [],
        image: item.image || null,
        images: item.images || [],
        isActive: item.isActive ?? true,
        isAvailable: item.isAvailable ?? true,
        isBestSeller: item.isBestSeller ?? false,
        isNew: item.isNew ?? false,
        displayOrder: item.displayOrder ?? 0,
        tags: item.tags || [],
        updatedAt: now,
      };

      const itemRef = doc(db, COLLECTIONS.menuItems, id);
      const itemSnap = await getDoc(itemRef);
      
      if (!itemSnap.exists()) {
        Object.assign(data, { createdAt: now });
      }

      await setDoc(itemRef, data, { merge: true });
      toast.success(itemSnap.exists() ? "Menu diperbarui" : "Menu ditambahkan");
      return id;
    } catch (error) {
      console.error("Save menu item error:", error);
      toast.error("Gagal menyimpan menu");
      return null;
    }
  };

  const deleteMenuItem = async (id: string): Promise<boolean> => {
    try {
      // Soft delete - mark as inactive
      await updateDoc(doc(db, COLLECTIONS.menuItems, id), {
        isActive: false,
        isAvailable: false,
        updatedAt: serverTimestamp(),
      });
      toast.success("Menu dinonaktifkan");
      return true;
    } catch (error) {
      console.error("Delete menu item error:", error);
      toast.error("Gagal menghapus menu");
      return false;
    }
  };

  const toggleAvailability = async (id: string, isAvailable: boolean): Promise<boolean> => {
    try {
      await updateDoc(doc(db, COLLECTIONS.menuItems, id), {
        isAvailable,
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error("Toggle availability error:", error);
      return false;
    }
  };

  return { saveMenuItem, deleteMenuItem, toggleAvailability };
}
