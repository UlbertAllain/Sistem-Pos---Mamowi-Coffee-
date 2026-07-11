"use client";

import type { MenuItem } from "@/types";
import { MenuItemCard } from "./menu-item-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Coffee } from "lucide-react";

interface MenuGridProps {
  items: MenuItem[];
  searchQuery: string;
  isLoading?: boolean;
  onItemClick: (item: MenuItem) => void;
}

export function MenuGrid({
  items,
  searchQuery,
  isLoading,
  onItemClick,
}: MenuGridProps) {
  const filtered = searchQuery
    ? items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.tags?.some((t) =>
            t.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
      )
    : items;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-espresso-100 bg-white"
          >
            <Skeleton className="aspect-square w-full" />
            <div className="space-y-2 p-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Coffee className="h-12 w-12 text-espresso-200" />
        <p className="mt-3 text-sm font-medium text-espresso-400">
          {searchQuery
            ? "Tidak ada menu yang cocok"
            : "Belum ada menu di kategori ini"}
        </p>
        {searchQuery && (
          <p className="mt-1 text-xs text-espresso-300">Coba kata kunci lain</p>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
      {filtered.map((item) => (
        <MenuItemCard key={item.id} item={item} onClick={onItemClick} />
      ))}
    </div>
  );
}
