import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: string;
  change: number;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

export function StatsCard({
  label,
  value,
  change,
  icon: Icon,
  iconBg,
  iconColor,
}: StatsCardProps) {
  const isUp = change >= 0;

  return (
    <div className="rounded-xl border border-espresso-100 bg-white shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-espresso-500">{label}</p>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
        </div>
        <div className={cn("rounded-lg p-2.5", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1 text-xs">
        {isUp ? (
          <ArrowUpRight className="h-3 w-3 text-success-600" />
        ) : (
          <ArrowDownRight className="h-3 w-3 text-danger-600" />
        )}
        <span
          className={cn(
            "font-medium",
            isUp ? "text-success-600" : "text-danger-600",
          )}
        >
          {Math.abs(change)}%
        </span>
        <span className="text-espresso-400">vs kemarin</span>
      </div>
    </div>
  );
}
