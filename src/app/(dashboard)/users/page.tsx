"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { UserForm } from "@/components/users/user-form";
import { useUsers } from "@/hooks/use-users";
import { ROLE_LABELS } from "@/constants";
import { getInitials, cn } from "@/lib/utils";
import type { User } from "@/types";
import { Plus, Search, Pencil, UserCheck, UserX } from "lucide-react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/constants";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export default function UsersPage() {
  const { users, isLoading } = useUsers();
  const [search, setSearch] = useState("");
  const [formUser, setFormUser] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);

  const filtered = users.filter(
    (u) => {
      const keyword = search.toLowerCase();
      return (
        (u.displayName || "").toLowerCase().includes(keyword) ||
        (u.email || "").toLowerCase().includes(keyword) ||
        (u.uid || "").toLowerCase().includes(keyword)
      );
    },
  );

  const toggleActive = async (user: User) => {
    try {
      if (!user.uid) {
        toast.error("ID pengguna tidak valid");
        return;
      }

      await updateDoc(doc(db, COLLECTIONS.users, user.uid), {
        isActive: !user.isActive,
        updatedAt: serverTimestamp(),
      });
      toast.success(
        user.isActive
          ? `${user.displayName} dinonaktifkan`
          : `${user.displayName} diaktifkan`,
      );
    } catch (error) {
      console.error("Toggle active error:", error);
      toast.error("Gagal mengubah status");
    }
  };

  const roleColors: Record<string, string> = {
    owner: "bg-espresso-100 text-espresso-700",
    manager: "bg-info-50 text-info-700",
    cashier: "bg-success-50 text-success-700",
    barista: "bg-warning-50 text-warning-700",
    viewer: "bg-espresso-50 text-espresso-500",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Pengguna" description="Kelola akun pengguna sistem">
        <Button
          onClick={() => {
            setFormUser(null);
            setShowForm(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Tambah Pengguna
        </Button>
      </PageHeader>

      <Input
        placeholder="Cari pengguna..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        prefix={<Search className="h-4 w-4" />}
        className="max-w-sm"
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-espresso-100 text-left text-xs font-medium uppercase text-espresso-500">
                <th className="px-4 py-3">Pengguna</th>
                <th className="px-4 py-3">ID Login</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Login Terakhir</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-espresso-50">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-5 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-espresso-400"
                  >
                    Tidak ada pengguna ditemukan
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr
                    key={u.uid}
                    className="border-b border-espresso-50 hover:bg-espresso-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-espresso-100 text-xs font-bold text-espresso-600">
                          {getInitials(u.displayName || "User")}
                        </div>
                        <div>
                          <p className="font-semibold text-espresso-900">
                            {u.displayName || "Tanpa Nama"}
                          </p>
                          {u.email && (
                            <p className="text-[11px] text-espresso-400">
                              {u.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-espresso-500">
                      {(u.uid || "-").slice(-8)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                          roleColors[u.role] || "",
                        )}
                      >
                          {ROLE_LABELS[u.role] || u.role || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={u.isActive ? "success" : "secondary"}
                        className="text-[10px]"
                      >
                        {u.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-espresso-500">
                      {u.lastLogin
                        ? format(u.lastLogin, "dd MMM yyyy, HH:mm", {
                            locale: idLocale,
                          })
                        : "Belum pernah"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setFormUser(u);
                            setShowForm(true);
                          }}
                          className="rounded-md p-1.5 text-espresso-400 hover:bg-espresso-100 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleActive(u)}
                          className="rounded-md p-1.5 transition-colors"
                          title={u.isActive ? "Nonaktifkan" : "Aktifkan"}
                        >
                          {u.isActive ? (
                            <UserX className="h-4 w-4 text-danger-500 hover:bg-danger-50" />
                          ) : (
                            <UserCheck className="h-4 w-4 text-success-500 hover:bg-success-50" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <UserForm
        user={formUser}
        open={showForm}
        onClose={() => setShowForm(false)}
      />
    </div>
  );
}
