"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { STORE_ID } from "@/constants";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Coffee,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Loader2,
  Keyboard,
} from "lucide-react";
import { toast } from "sonner";
import type { User } from "@/types";

type LoginMode = "email" | "pin";

function getAuthErrorMessage(code?: string) {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email atau password salah, atau akun belum dibuat di Firebase Auth.";
    case "auth/user-disabled":
      return "Akun Firebase Auth ini dinonaktifkan.";
    case "auth/too-many-requests":
      return "Terlalu banyak percobaan. Coba lagi nanti.";
    case "auth/network-request-failed":
      return "Koneksi ke Firebase gagal. Cek internet atau konfigurasi Firebase.";
    case "auth/operation-not-allowed":
      return "Login email/password belum diaktifkan di Firebase Authentication.";
    case "auth/api-key-not-valid":
    case "auth/invalid-api-key":
      return "Firebase API key tidak valid. Cek file .env.local.";
    default:
      return code
        ? `Gagal masuk (${code}). Cek Firebase Authentication dan .env.local.`
        : "Gagal masuk. Cek Firebase Authentication dan koneksi internet.";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  const [mode, setMode] = useState<LoginMode>("email");
  const [loading, setLoading] = useState(false);

  // Email mode
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // PIN mode
  const [pin, setPin] = useState("");
  const [pinUserId, setPinUserId] = useState("");

  // Switch loading state dari auth store
  const { isLoading } = useAuthStore();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Masukkan email dan password");
      return;
    }

    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      await setDoc(
        doc(db, "stores", STORE_ID, "users", cred.user.uid),
        {
          uid: cred.user.uid,
          storeId: STORE_ID,
          email: cred.user.email || email,
          displayName:
            cred.user.displayName ||
            cred.user.email?.split("@")[0] ||
            "Owner",
          role: "owner",
          isActive: true,
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true },
      );

      // User data akan di-fetch oleh AuthProvider
      toast.success("Berhasil masuk!");
      router.replace("/");
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      console.error("Email login error:", err.code, err.message);
      toast.error(getAuthErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinUserId || !pin) {
      toast.error("Masukkan ID pengguna dan PIN");
      return;
    }

    setLoading(true);
    try {
      const loginId = pinUserId.trim();
      const directSnap = await getDoc(
        doc(db, "stores", STORE_ID, "users", loginId),
      );
      let resolvedUserId = loginId;
      let data = directSnap.exists() ? directSnap.data() : null;

      if (!data) {
        const usersSnap = await getDocs(
          collection(db, "stores", STORE_ID, "users"),
        );
        const matched = usersSnap.docs.find((userDoc) => {
          const raw = userDoc.data();
          const uid = String(raw.uid || userDoc.id).toLowerCase();
          const input = loginId.toLowerCase();
          return (
            uid === input ||
            userDoc.id.toLowerCase() === input ||
            uid.endsWith(input) ||
            userDoc.id.toLowerCase().endsWith(input)
          );
        });

        if (matched) {
          resolvedUserId = matched.id;
          data = matched.data();
        }
      }

      if (!data) {
        toast.error("ID pengguna tidak ditemukan");
        setLoading(false);
        return;
      }

      if (!data.pin) {
        toast.error("Pengguna ini tidak memiliki PIN");
        setLoading(false);
        return;
      }

      if (!data.isActive) {
        toast.error("Akun dinonaktifkan. Hubungi manager.");
        setLoading(false);
        return;
      }

      if (data.pin !== pin) {
        toast.error("PIN salah");
        setLoading(false);
        return;
      }

      const user: User = {
        uid: data.uid || resolvedUserId,
        email: data.email || "",
        displayName: data.displayName || "",
        pin: data.pin,
        role: data.role,
        avatar: data.avatar,
        storeId: data.storeId || STORE_ID,
        isActive: data.isActive,
        lastLogin: new Date(),
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
      };

      await updateDoc(doc(db, "stores", STORE_ID, "users", resolvedUserId), {
        lastLogin: serverTimestamp(),
      });

      // ← TAMBAHKAN INI →
      // ← SAMPAI SINI

      setUser(user);
      toast.success("Berhasil masuk!");
      router.replace("/");
    } catch (error) {
      console.error("PIN login error:", error);
      toast.error("Gagal masuk dengan PIN");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-espresso-300" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md animate-fade-in">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-espresso-700/50">
          <Coffee className="h-8 w-8 text-espresso-200" />
        </div>
        <h1 className="text-2xl font-bold text-white">KOFFEE POS</h1>
        <p className="mt-1 text-sm text-espresso-400">Masuk ke sistem kasir</p>
      </div>

      {/* Login Card */}
      <div className="rounded-2xl bg-white p-6 shadow-2xl">
        {/* Mode Toggle */}
        <div className="mb-6 flex rounded-lg bg-espresso-50 p-1">
          <button
            onClick={() => setMode("email")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-all ${
              mode === "email"
                ? "bg-white text-espresso-900 shadow-sm"
                : "text-espresso-500 hover:text-espresso-700"
            }`}
          >
            <Mail className="h-4 w-4" />
            Email
          </button>
          <button
            onClick={() => setMode("pin")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-all ${
              mode === "pin"
                ? "bg-white text-espresso-900 shadow-sm"
                : "text-espresso-500 hover:text-espresso-700"
            }`}
          >
            <Keyboard className="h-4 w-4" />
            PIN
          </button>
        </div>

        {/* Email Form */}
        {mode === "email" && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="kasir@koffee.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              prefix={<Mail className="h-4 w-4" />}
              autoComplete="email"
            />
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              prefix={<Lock className="h-4 w-4" />}
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-espresso-400 hover:text-espresso-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
              autoComplete="current-password"
            />
            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={loading}
            >
              Masuk
            </Button>
          </form>
        )}

        {/* PIN Form */}
        {mode === "pin" && (
          <form onSubmit={handlePinLogin} className="space-y-4">
            <Input
              label="ID Login"
              placeholder="ID Login dari tabel Pengguna"
              value={pinUserId}
              onChange={(e) => setPinUserId(e.target.value.trim())}
              prefix={<Keyboard className="h-4 w-4" />}
            />
            <Input
              label="PIN"
              type="password"
              placeholder="Masukkan 4-6 digit PIN"
              value={pin}
              onChange={(e) =>
                setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              maxLength={6}
              prefix={<Lock className="h-4 w-4" />}
              inputMode="numeric"
            />
            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={loading}
            >
              Masuk dengan PIN
            </Button>
          </form>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-espresso-500">
        KOFFEE POS v1.0 — Sistem Kasir Coffee Shop
      </p>
    </div>
  );
}
