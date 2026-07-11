"use client";

import { useState } from "react";
import { useCategories } from "@/hooks/use-categories";
import { useMenuItems } from "@/hooks/use-menu-items";
import { usePOSStore } from "@/stores/pos-store";
import { CategoryTabs } from "@/components/pos/category-tabs";
import { SearchBar } from "@/components/pos/search-bar";
import { MenuGrid } from "@/components/pos/menu-grid";
import { CartPanel } from "@/components/pos/cart-panel";
import { ItemCustomizer } from "@/components/pos/item-customizer";
import { PaymentModal } from "@/components/pos/payment-modal";
import type { MenuItem } from "@/types";
import { toast } from "sonner";

export default function POSPage() {
  const { categories, isLoading: catLoading } = useCategories();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const { items: menuItems, isLoading: menuLoading } =
    useMenuItems(activeCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [customizerItem, setCustomizerItem] = useState<MenuItem | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  const { addItem } = usePOSStore();

  const handleItemClick = (item: MenuItem) => {
    if (item.variants.length > 0 || item.modifierGroups.length > 0) {
      setCustomizerItem(item);
    } else {
      addItem({
        menuItemId: item.id,
        name: item.name,
        image: item.image,
        recipe: item.recipe,
        basePrice: item.basePrice,
        variant: null,
        modifiers: [],
        notes: "",
        quantity: 1,
      });
      toast.success(`${item.name} ditambahkan`);
    }
  };

  const handleCustomizerAdd = (params: {
    menuItemId: string;
    name: string;
    image?: string;
    recipe?: MenuItem["recipe"];
    basePrice: number;
    variant: {
      id: string;
      name: string;
      sizeMl?: number;
      priceAdjustment: number;
      isDefault: boolean;
    } | null;
    modifiers: {
      groupId: string;
      groupName: string;
      optionId: string;
      optionName: string;
      priceAdjustment: number;
    }[];
    notes: string;
    quantity: number;
  }) => {
    addItem(params);
    toast.success(`${params.name} ditambahkan`);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-4 lg:-m-6 overflow-hidden">
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="shrink-0 space-y-3 border-b border-espresso-100 bg-cream-50 px-4 py-3 lg:px-6">
          <CategoryTabs
            categories={categories}
            activeId={activeCategory}
            onSelect={setActiveCategory}
            isLoading={catLoading}
          />
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <MenuGrid
            items={menuItems}
            searchQuery={searchQuery}
            isLoading={menuLoading}
            onItemClick={handleItemClick}
          />
        </div>
      </div>

      <div className="hidden w-[400px] shrink-0 md:block">
        <CartPanel onPay={() => setShowPayment(true)} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-espresso-200 bg-white p-3 md:hidden">
        <button
          onClick={() =>
            toast.info("Gunakan layar lebih lebar untuk pengalaman penuh")
          }
          className="flex w-full items-center justify-between rounded-xl bg-espresso-600 px-4 py-3 text-white"
        >
          <span className="text-sm font-medium">
            {usePOSStore.getState().items.length} item di keranjang
          </span>
          <span className="text-sm font-bold">Lihat Keranjang →</span>
        </button>
      </div>

      <ItemCustomizer
        item={customizerItem}
        open={!!customizerItem}
        onClose={() => setCustomizerItem(null)}
        onAdd={handleCustomizerAdd}
      />
      <PaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}
