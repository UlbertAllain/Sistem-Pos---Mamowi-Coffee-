"use client";

import { useState } from "react";
import { UserPlus, Search, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCustomerLookup } from "@/hooks/use-customer-lookup";
import { useCustomerActions } from "@/hooks/use-customer-actions";
import { usePOSStore } from "@/stores/pos-store";
import { LOYALTY_TIERS } from "@/constants";

import type { Customer } from "@/types";
import { toast } from "sonner";

interface CustomerLookupPanelProps {
  open: boolean;
  onClose: () => void;
}

export function CustomerLookupPanel({
  open,
  onClose,
}: CustomerLookupPanelProps) {
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [creating, setCreating] = useState(false);

  const { results, isSearching, search, clear } = useCustomerLookup();
  const { createCustomer } = useCustomerActions();
  const { setCustomer } = usePOSStore();

  if (!open) return null;

  const handleSearch = (val: string) => {
    setQuery(val);
    if (val.length >= 2) {
      search(val);
    } else {
      clear();
    }
  };

  const handleSelect = (customer: Customer) => {
    setCustomer(customer.name, customer.phone, customer.id, customer);
    toast.success(
      `Pelanggan: ${customer.name} (${customer.loyalty.points} poin)`,
    );
    onClose();
  };

  const handleCreate = async () => {
    if (!newName.trim() || !newPhone.trim()) {
      toast.error("Nama dan nomor telepon wajib diisi");
      return;
    }

    setCreating(true);
    const customer = await createCustomer({
      name: newName.trim(),
      phone: newPhone.trim(),
    });
    if (customer) {
      handleSelect(customer);
    }
    setCreating(false);
  };

  const getTierBadge = (tier: string) => {
    const t = LOYALTY_TIERS.find((l) => l.value === tier);
    if (!t) return null;
    return (
      <Badge
        className="text-[10px]"
        style={{
          backgroundColor: t.color + "20",
          color: t.color,
          borderColor: t.color,
        }}
      >
        {t.label}
      </Badge>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-espresso-900 mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Cari Pelanggan
        </h2>

        <div className="space-y-3">
          <Input
            placeholder="Nama atau nomor telepon..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            prefix={
              isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )
            }
            autoFocus
          />

          {/* Results */}
          {results.length > 0 && (
            <div className="border border-espresso-200 rounded-lg divide-y divide-espresso-100 max-h-60 overflow-y-auto">
              {results.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelect(c)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-espresso-50 transition-colors text-left"
                >
                  <div>
                    <p className="text-sm font-semibold text-espresso-900">
                      {c.name}
                    </p>
                    <p className="text-xs text-espresso-400">{c.phone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTierBadge(c.loyalty.tier)}
                    <span className="text-xs font-medium text-espresso-600">
                      {c.loyalty.points} pts
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {query.length >= 2 && !isSearching && results.length === 0 && (
            <p className="text-sm text-espresso-400 text-center py-4">
              Pelanggan tidak ditemukan
            </p>
          )}

          {/* Create New */}
          {!showCreate ? (
            <button
              onClick={() => setShowCreate(true)}
              className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-espresso-300 py-3 text-sm text-espresso-500 hover:border-espresso-400 hover:text-espresso-600 transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              Tambah Pelanggan Baru
            </button>
          ) : (
            <div className="space-y-2 p-3 rounded-lg border border-espresso-200 bg-espresso-50">
              <p className="text-xs font-medium text-espresso-600">
                Pelanggan Baru
              </p>
              <Input
                placeholder="Nama"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <Input
                placeholder="No. Telepon"
                value={newPhone}
                onChange={(e) =>
                  setNewPhone(e.target.value.replace(/\D/g, "").slice(0, 13))
                }
                inputMode="numeric"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreate(false)}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreate}
                  loading={creating}
                  className="flex-1"
                >
                  Simpan
                </Button>
              </div>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="w-full mt-4"
        >
          Tutup
        </Button>
      </div>
    </div>
  );
}
