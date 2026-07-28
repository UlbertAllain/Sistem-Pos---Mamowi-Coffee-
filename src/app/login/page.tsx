'use client';

import { ArrowRight, Coffee, Eye, EyeOff, LoaderCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/auth-context';
import { getErrorMessage } from '@/lib/errors';

export default function LoginPage() {
  const router = useRouter();
  const { profile, loading, error: authError, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && profile) router.replace('/dashboard');
  }, [loading, profile, router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setSubmitting(false);
    }
  };

  return <main className="login-page">
    <section className="login-showcase">
      <div className="login-brand"><div className="brand-mark brand-mark-lg"><Coffee size={26} /></div><div><strong>Mamowi Coffee</strong><span>Operations System</span></div></div>
      <div className="login-showcase-copy"><span className="showcase-pill"><Sparkles size={14} /> POS V5</span><h1>Lebih cepat melayani. Lebih tenang mengelola.</h1><p>Workspace kasir modern dengan transaksi server-side, kontrol stok, dan laporan harian dalam satu sistem.</p></div>
      <div className="showcase-status"><ShieldCheck size={20} /><div><strong>Secure server transaction</strong><span>Checkout, void, dan adjustment diproses lewat Firebase Admin.</span></div></div>
      <div className="showcase-orb orb-one" /><div className="showcase-orb orb-two" />
    </section>

    <section className="login-form-panel">
      <div className="login-card">
        <div className="login-heading"><span className="eyebrow">Staff access</span><h2>Selamat datang kembali</h2><p>Masuk dengan akun staf yang terdaftar pada toko Mamowi.</p></div>
        <form onSubmit={handleSubmit} className="form-stack">
          <label className="field"><span>Email</span><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nama@mamowi.com" required /></label>
          <label className="field"><span>Password</span><div className="password-field"><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Masukkan password" required /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
          {error || authError ? <div className="inline-alert inline-alert-error">{error ?? authError}</div> : null}
          <Button type="submit" size="lg" disabled={submitting}>{submitting ? <><LoaderCircle className="spin" size={18} /> Memproses...</> : <>Masuk ke workspace <ArrowRight size={18} /></>}</Button>
        </form>
        <p className="login-footnote">Akun dikelola melalui Firebase Authentication dan profil user toko.</p>
      </div>
    </section>
  </main>;
}
