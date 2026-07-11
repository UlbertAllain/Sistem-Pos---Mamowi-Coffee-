"use client";

import { Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream-50 px-4">
      <Coffee className="h-16 w-16 text-espresso-300" />
      <h1 className="text-4xl font-bold text-espresso-900">404</h1>
      <p className="text-espresso-500">Halaman tidak ditemukan</p>
      <Button onClick={() => router.push("/")}>Kembali ke Dashboard</Button>
    </div>
  );
}
