import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description: string;
  phase?: string;
  icon?: LucideIcon;
}

export function ComingSoon({
  title,
  description,
  phase,
  icon: Icon = Construction,
}: ComingSoonProps) {
  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="flex h-[calc(100vh-12rem)] items-center justify-center">
          <div className="text-center">
            <Icon className="mx-auto h-16 w-16 text-espresso-200" />
            <p className="mt-4 text-lg font-semibold text-espresso-400">
              {title}
            </p>
            <p className="mt-1 text-sm text-espresso-300">
              Akan dikembangkan di {phase || "phase selanjutnya"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { PageHeader } from "@/components/layout/page-header";
