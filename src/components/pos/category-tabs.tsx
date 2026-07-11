"use client";

import { cn } from "@/lib/utils";
import type { Category } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Coffee } from "lucide-react";

interface CategoryTabsProps {
  categories: Category[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
  isLoading?: boolean;
}

export function CategoryTabs({
  categories,
  activeId,
  onSelect,
  isLoading,
}: CategoryTabsProps) {
  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-1 pb-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar px-1 pb-1">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
          activeId === null
            ? "bg-espresso-600 text-white shadow-sm"
            : "bg-white text-espresso-600 hover:bg-espresso-50 border border-espresso-200",
        )}
      >
        <Coffee className="h-4 w-4" />
        Semua
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
            activeId === cat.id
              ? "bg-espresso-600 text-white shadow-sm"
              : "bg-white text-espresso-600 hover:bg-espresso-50 border border-espresso-200",
          )}
        >
          <span>{cat.icon}</span>
          {cat.name}
        </button>
      ))}
    </div>
  );
}
