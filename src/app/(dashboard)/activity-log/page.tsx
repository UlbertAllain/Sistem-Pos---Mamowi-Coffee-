"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivityLog } from "@/hooks/use-activity-log";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { ScrollText } from "lucide-react";

const categoryColors: Record<string, string> = {
  order: "bg-blue-50 text-blue-600",
  menu: "bg-purple-50 text-purple-600",
  inventory: "bg-orange-50 text-orange-600",
  customer: "bg-green-50 text-green-600",
  user: "bg-red-50 text-red-600",
  setting: "bg-gray-50 text-gray-600",
  payment: "bg-cyan-50 text-cyan-600",
};

export default function ActivityLogPage() {
  const { logs, isLoading } = useActivityLog(100);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Log Aktivitas"
        description="Audit trail semua aksi di sistem"
      />

      {isLoading ? (
        Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16">
            <ScrollText className="h-12 w-12 text-espresso-200" />
            <p className="text-sm text-espresso-400">Belum ada log aktivitas</p>
            <p className="text-xs text-espresso-300">
              Aktivitas akan tampil setelah ada aksi di sistem
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="flex items-start gap-3 p-4">
                <div
                  className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase ${categoryColors[log.category] || "bg-gray-50 text-gray-600"}`}
                >
                  {log.category}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-espresso-900">
                    {log.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-espresso-400">
                    <span>{log.userName}</span>
                    <span>•</span>
                    <span>
                      {format(log.createdAt, "dd MMM yyyy, HH:mm:ss", {
                        locale: idLocale,
                      })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
