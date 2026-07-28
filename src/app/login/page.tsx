'use client';

import {
  ArrowRight,
  Check,
  Coffee,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  PackageCheck,
  ReceiptText,
  ShieldCheck,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/auth-context';
import { getErrorMessage } from '@/lib/errors';

const workspaceNotes = [
  {
    icon: ReceiptText,
    title: 'Transaksi rapi',
    description: 'Order, pembayaran, dan nomor struk diproses dalam satu alur.',
  },
  {
    icon: PackageCheck,
    title: 'Stok tetap sinkron',
    description: 'Perubahan stok sensitif hanya diproses lewat server.',
  },
  {
    icon: ShieldCheck,
    title: 'Akses terkontrol',
    description: 'Workspace dibuka sesuai toko dan peran akun staf.',
  },
] as const;

export default function LoginPage() {
  const router = useRouter();
  const { profile, loading, error: authError, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && profile) {
      router.replace('/dashboard');
    }
  }, [loading, profile, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await signIn(email.trim(), password);
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setSubmitting(false);
    }
  };

  const displayedError = error ?? authError;

  return (
    <main className="tactile-login-page">
      <div className="tactile-login-shell">
        <header className="tactile-login-header">
          <div className="tactile-login-brand">
            <span className="tactile-login-index">01</span>
            <div>
              <strong>Mamowi Coffee</strong>
              <span>STAFF OPERATIONS BOARD</span>
            </div>
          </div>

          <div className="tactile-login-system-status">
            <span className="tactile-login-status-dot" aria-hidden="true" />
            Server workspace ready
          </div>
        </header>

        <section className="tactile-login-board">
          <div className="tactile-login-story" aria-label="Tentang Mamowi POS">
            <span className="tactile-login-tape tactile-login-tape-left" aria-hidden="true" />
            <span className="tactile-login-tape tactile-login-tape-right" aria-hidden="true" />

            <div className="tactile-login-story-topline">
              <span>POS / V5</span>
              <span>SECURE SERVER FLOW</span>
            </div>

            <div className="tactile-login-title-wrap">
              <p className="tactile-login-kicker">Workspace harian untuk tim Mamowi</p>
              <h1>
                Serve faster.
                <span>Stay in control.</span>
              </h1>
              <p className="tactile-login-intro">
                Satu meja kerja untuk melayani pesanan, menjaga stok, dan membaca
                aktivitas toko tanpa alur yang berbelit.
              </p>
            </div>

            <div className="tactile-login-note tactile-login-note-yellow">
              <span>DAILY NOTE</span>
              <strong>Simple flow.<br />Clear numbers.</strong>
              <small>Focus on the counter, not the software.</small>
            </div>

            <div className="tactile-login-feature-grid">
              {workspaceNotes.map(({ icon: Icon, title, description }, index) => (
                <article className="tactile-login-feature" key={title}>
                  <span className="tactile-login-feature-number">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
                  <div>
                    <strong>{title}</strong>
                    <p>{description}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="tactile-login-sketch" aria-hidden="true">
              <Coffee size={34} strokeWidth={1.5} />
              <span>fresh order<br />clean record</span>
            </div>

            <footer className="tactile-login-story-footer">
              <span>MAMOWI COFFEE • INTERNAL SYSTEM</span>
              <span>FIREBASE ADMIN / NEXT.JS</span>
            </footer>
          </div>

          <aside className="tactile-login-access">
            <div className="tactile-login-access-label">
              <LockKeyhole size={15} aria-hidden="true" />
              Staff access only
            </div>

            <div className="tactile-login-card">
              <div className="tactile-login-card-heading">
                <span>WELCOME BACK</span>
                <h2>Masuk ke meja kerja.</h2>
                <p>Gunakan akun staf yang sudah terdaftar pada toko Mamowi.</p>
              </div>

              <form className="tactile-login-form" onSubmit={handleSubmit}>
                <label className="tactile-login-field">
                  <span>Email staf</span>
                  <input
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="nama@mamowi.com"
                    required
                    disabled={submitting}
                  />
                </label>

                <label className="tactile-login-field">
                  <span>Password</span>
                  <div className="tactile-login-password">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Masukkan password"
                      required
                      disabled={submitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                      aria-pressed={showPassword}
                      disabled={submitting}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>

                {displayedError ? (
                  <div className="tactile-login-alert" role="alert">
                    <span aria-hidden="true">!</span>
                    <p>{displayedError}</p>
                  </div>
                ) : null}

                <Button
                  type="submit"
                  size="lg"
                  className="tactile-login-submit"
                  disabled={submitting || loading}
                >
                  {submitting ? (
                    <>
                      <LoaderCircle className="spin" size={18} />
                      Memeriksa akun...
                    </>
                  ) : (
                    <>
                      Masuk ke workspace
                      <ArrowRight size={18} />
                    </>
                  )}
                </Button>
              </form>

              <div className="tactile-login-security">
                <Check size={15} aria-hidden="true" />
                <span>
                  Checkout dan perubahan stok sensitif diproses melalui server.
                </span>
              </div>
            </div>

            <p className="tactile-login-help">
              Tidak bisa masuk? Hubungi owner atau manager untuk memeriksa akun staf.
            </p>
          </aside>
        </section>
      </div>
    </main>
  );
}
