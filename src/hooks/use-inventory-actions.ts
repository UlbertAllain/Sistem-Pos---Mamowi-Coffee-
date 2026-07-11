import {
  doc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/constants";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

export function useInventoryActions() {
  const { user } = useAuthStore();

  // Rekam transaksi stok + update stok saat ini
  const recordTransaction = async (params: {
    ingredientId: string;
    ingredientName?: string;
    type: "in" | "out" | "adjustment" | "waste" | "initial";
    quantity: number;
    unit: string;
    referenceType: string;
    referenceId?: string;
    notes?: string;
  }): Promise<boolean> => {
    try {
      const ingRef = doc(db, COLLECTIONS.ingredients, params.ingredientId);
      const ingSnap = await getDoc(ingRef);
      if (!ingSnap.exists()) {
        toast.error("Bahan baku tidak ditemukan");
        return false;
      }

      const ingredient = ingSnap.data();
      const currentStock = ingredient.currentStock || 0;
      let newStock: number;

      if (params.type === "in" || params.type === "initial") {
        newStock = currentStock + params.quantity;
      } else {
        newStock = Math.max(0, currentStock - params.quantity);
      }

      // Cek low stock
      const minStock = ingredient.minStockLevel || 0;
      const lowStockAlert = newStock <= minStock;
      const ingredientName =
        ingredient.name || params.ingredientName || params.ingredientId;

      // Update stok bahan
      await updateDoc(ingRef, {
        currentStock: newStock,
        lowStockAlert,
        updatedAt: serverTimestamp(),
      });

      // Catat transaksi
      await addDoc(collection(db, COLLECTIONS.stockTransactions), {
        storeId: "default",
        ingredientId: params.ingredientId,
        ingredientName,
        type: params.type,
        quantity: params.quantity,
        unit: params.unit,
        referenceType: params.referenceType,
        referenceId: params.referenceId || null,
        previousStock: currentStock,
        newStock,
        notes: params.notes || null,
        performedBy: user?.displayName || "system",
        createdAt: serverTimestamp(),
      });

      if (lowStockAlert) {
        toast.warning(
          `⚠️ Stok ${params.ingredientName} rendah: ${newStock} ${params.unit}`,
        );
      }

      return true;
    } catch (error) {
      console.error("Stock transaction error:", error);
      toast.error("Gagal mencatat transaksi stok");
      return false;
    }
  };

  // Deduct stok berdasarkan recipe (dipanggil saat order dibayar)
  const deductFromRecipe = async (
    items: {
      menuItemId: string;
      name: string;
      quantity: number;
      recipe: { ingredientId: string; quantity: number; unit: string }[];
    }[],
    referenceId?: string,
  ) => {
    for (const item of items) {
      if (!item.recipe || item.recipe.length === 0) continue;

      for (const recipeItem of item.recipe) {
        const totalNeeded = recipeItem.quantity * item.quantity;
        await recordTransaction({
          ingredientId: recipeItem.ingredientId,
          ingredientName: recipeItem.ingredientId,
          type: "out",
          quantity: totalNeeded,
          unit: recipeItem.unit,
          referenceType: "order",
          referenceId,
          notes: `Digunakan untuk ${item.quantity}x ${item.name}`,
        });
      }
    }
  };

  return { recordTransaction, deductFromRecipe };
}
