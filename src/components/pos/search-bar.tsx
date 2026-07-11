"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useEffect, useRef } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const ref = useRef<HTMLInputElement>(null);

  // Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <Input
      ref={ref}
      placeholder="Cari menu... (Ctrl+K)"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      prefix={<Search className="h-4 w-4" />}
      suffix={
        value ? (
          <button
            onClick={() => onChange("")}
            className="text-espresso-400 hover:text-espresso-600"
          >
            <X className="h-4 w-4" />
          </button>
        ) : undefined
      }
      className="bg-white"
    />
  );
}
