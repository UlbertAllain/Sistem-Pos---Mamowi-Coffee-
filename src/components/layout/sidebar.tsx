"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coffee, ChevronLeft, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@radix-ui/react-separator";
import { NAVIGATION } from "@/constants";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";
import { getInitials } from "@/lib/utils";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout: storeLogout, hasRole } = useAuthStore();
  const {
    sidebarOpen,
    sidebarCollapsed,
    setSidebarOpen,
    toggleSidebarCollapsed,
  } = useUIStore();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      storeLogout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const visibleNav = NAVIGATION.filter((item) => hasRole(item.roles));

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full flex-col bg-espresso-950 text-white transition-all duration-300",
          "lg:relative lg:z-auto",
          sidebarCollapsed ? "w-[72px]" : "w-64",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-espresso-700">
            <Coffee className="h-5 w-5 text-espresso-200" />
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <h1 className="text-base font-bold tracking-tight">KOFFEE POS</h1>
              <p className="text-[10px] font-medium uppercase tracking-widest text-espresso-400">
                Point of Sale
              </p>
            </div>
          )}
        </div>

        <Separator className="bg-espresso-800" />

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 no-scrollbar">
          <ul className="space-y-1">
            {visibleNav.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <React.Fragment key={item.href}>
                  <li>
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                        isActive
                          ? "bg-espresso-700 text-white"
                          : "text-espresso-300 hover:bg-espresso-900 hover:text-white",
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-5 w-5 shrink-0 transition-colors",
                          isActive
                            ? "text-espresso-200"
                            : "text-espresso-400 group-hover:text-espresso-200",
                        )}
                      />
                      {!sidebarCollapsed && <span>{item.name}</span>}
                    </Link>
                  </li>
                  {item.dividerAfter && (
                    <li className="my-3">
                      <Separator className="bg-espresso-800" />
                    </li>
                  )}
                </React.Fragment>
              );
            })}
          </ul>
        </nav>

        <Separator className="bg-espresso-800" />

        {/* User info + Logout */}
        <div className="p-3">
          {!sidebarCollapsed && user && (
            <div className="mb-2 flex items-center gap-3 rounded-lg bg-espresso-900 px-3 py-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-espresso-600 text-xs font-bold">
                {getInitials(user.displayName)}
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-sm font-medium">
                  {user.displayName}
                </p>
                <p className="truncate text-[11px] text-espresso-400 capitalize">
                  {user.role}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            {!sidebarCollapsed && (
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 justify-start gap-2 text-espresso-300 hover:bg-espresso-900 hover:text-white"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Keluar
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-espresso-400 hover:bg-espresso-900 hover:text-white hidden lg:flex"
              onClick={toggleSidebarCollapsed}
            >
              <ChevronLeft
                className={cn(
                  "h-4 w-4 transition-transform",
                  sidebarCollapsed && "rotate-180",
                )}
              />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}

import React from "react";
