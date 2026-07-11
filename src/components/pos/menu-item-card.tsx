"use client";

import Image from "next/image";
import { cn, formatRupiah } from "@/lib/utils";
import type { MenuItem } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Coffee } from "lucide-react";

interface MenuItemCardProps {
  item: MenuItem;
  onClick: (item: MenuItem) => void;
}

export function MenuItemCard({ item, onClick }: MenuItemCardProps) {
  const unavailable = !item.isAvailable;

  return (
    <button
      onClick={() => !unavailable && onClick(item)}
      disabled={unavailable}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border bg-white text-left transition-all duration-150",
        unavailable
          ? "cursor-not-allowed border-espresso-100 opacity-50"
          : "border-espresso-100 hover:border-espresso-300 hover:shadow-md active:scale-[0.98]",
      )}
    >
      {/* Image */}
      <div className="relative aspect-square w-full bg-espresso-50">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 200px"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Coffee className="h-10 w-10 text-espresso-200" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {item.isBestSeller && (
            <Badge variant="warning" className="text-[10px] px-1.5 py-0">
              Best Seller
            </Badge>
          )}
          {item.isNew && (
            <Badge variant="info" className="text-[10px] px-1.5 py-0">
              Baru
            </Badge>
          )}
        </div>

        {unavailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
            <span className="rounded-lg bg-espresso-900 px-3 py-1.5 text-xs font-bold text-white">
              Habis
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col justify-between p-3">
        <div>
          <h3 className="text-sm font-semibold leading-tight line-clamp-2 text-espresso-900">
            {item.name}
          </h3>
          {item.description && (
            <p className="mt-0.5 text-[11px] text-espresso-400 line-clamp-1">
              {item.description}
            </p>
          )}
        </div>

        {/* Price — show range if variants have different prices */}
        <div className="mt-2">
          {item.variants.length > 1 ? (
            <p className="text-sm font-bold text-espresso-700">
              {formatRupiah(
                item.basePrice +
                  Math.min(...item.variants.map((v) => v.priceAdjustment)),
              )}
              <span className="text-xs font-normal text-espresso-400"> - </span>
              {formatRupiah(
                item.basePrice +
                  Math.max(...item.variants.map((v) => v.priceAdjustment)),
              )}
            </p>
          ) : (
            <p className="text-sm font-bold text-espresso-700">
              {formatRupiah(
                item.basePrice + (item.variants[0]?.priceAdjustment || 0),
              )}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
