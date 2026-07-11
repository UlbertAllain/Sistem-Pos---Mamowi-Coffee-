"use client";

import { Menu, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUIStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { useActiveShift } from "@/hooks/use-shifts";
import { getInitials } from "@/lib/utils";
import { useEffect, useState } from "react";

export function Header() {
  const { toggleSidebar } = useUIStore();
  const { user } = useAuthStore();
  const { shift: activeShift } = useActiveShift(user?.uid);
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-espresso-100 bg-white/80 backdrop-blur-md px-4 lg:px-6">
      {/* Mobile menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={toggleSidebar}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Page title — diisi oleh tiap page via props atau usePathname */}
      <div className="flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Clock */}
        <div className="hidden items-center gap-1.5 text-sm text-espresso-500 sm:flex">
          <Clock className="h-4 w-4" />
          <span className="font-mono tabular-nums">{time}</span>
        </div>

        <Badge
          variant={activeShift ? "success" : "warning"}
          className="hidden sm:inline-flex"
        >
          {activeShift ? "Shift Aktif" : "Shift Belum Dibuka"}
        </Badge>

        {/* User avatar */}
        {user && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-espresso-100 text-xs font-bold text-espresso-700">
              {getInitials(user.displayName)}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium leading-tight">
                {user.displayName}
              </p>
              <p className="text-[11px] text-espresso-400 capitalize">
                {user.role}
              </p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
