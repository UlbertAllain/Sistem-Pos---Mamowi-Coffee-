'use client';

import {
  BarChart3,
  Boxes,
  Coffee,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ReceiptText,
  Settings,
  ShieldCheck,
  ShoppingCart,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '@/features/auth/auth-context';
import { getErrorMessage } from '@/lib/errors';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, adminOnly: false },
  { href: '/pos', label: 'Point of Sale', icon: ShoppingCart, adminOnly: false },
  { href: '/transactions', label: 'Transaksi', icon: ReceiptText, adminOnly: false },
  { href: '/reports', label: 'Laporan', icon: BarChart3, adminOnly: false },
  { href: '/products', label: 'Produk', icon: Package, adminOnly: true },
  { href: '/categories', label: 'Kategori', icon: Boxes, adminOnly: true },
  { href: '/settings', label: 'Pengaturan', icon: Settings, adminOnly: true },
] as const;

const pageNames: Record<string, string> = {
  '/dashboard': 'Overview',
  '/pos': 'Point of Sale',
  '/transactions': 'Transaksi',
  '/reports': 'Laporan',
  '/products': 'Produk',
  '/categories': 'Kategori',
  '/settings': 'Pengaturan',
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading, isAdmin, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !profile) router.replace('/login');
  }, [loading, profile, router]);

  useEffect(() => setMobileOpen(false), [pathname]);

  if (loading || !profile) {
    return (
      <div className="full-page-loader">
        <div className="loader-brand"><Coffee className="pulse" size={28} /></div>
        <strong>Mamowi POS</strong>
        <p>Menyiapkan workspace...</p>
      </div>
    );
  }

  const visibleNav = navItems.filter((item) => !item.adminOnly || isAdmin);
  const activePage = Object.entries(pageNames)
    .find(([path]) => pathname === path || pathname.startsWith(`${path}/`))?.[1] ?? 'Mamowi POS';

  const handleLogout = async () => {
    try {
      setLogoutError(null);
      await signOut();
      router.replace('/login');
    } catch (cause) {
      setLogoutError(getErrorMessage(cause));
    }
  };

  return (
    <div className="app-shell tactile-shell">
      <aside className={`sidebar tactile-sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand tactile-brand">
          <div className="brand-index">09</div>
          <div className="brand-copy">
            <strong>Mamowi POS</strong>
            <span>TACTILE COFFEE SYSTEM</span>
          </div>
          <button
            className="icon-button sidebar-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Tutup menu"
          >
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-note">Simple tools for real counter work.</div>
        <div className="sidebar-section-label">Workspace</div>

        <nav className="sidebar-nav tactile-nav" aria-label="Navigasi utama">
          {visibleNav.map((item, index) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link tactile-nav-link ${active ? 'nav-link-active' : ''}`}
              >
                <span className="nav-number">{String(index + 1).padStart(2, '0')}</span>
                <Icon size={17} />
                <span>{item.label}</span>
                {active ? <i aria-hidden="true" /> : null}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-security tactile-security-note">
          <ShieldCheck size={17} />
          <div>
            <strong>SERVER FLOW</strong>
            <span>Firebase Admin secured</span>
          </div>
        </div>

        <div className="sidebar-user tactile-user-card">
          <div className="avatar">{profile.name.charAt(0).toUpperCase()}</div>
          <div className="sidebar-user-meta">
            <strong>{profile.name}</strong>
            <span>{profile.role}</span>
          </div>
          <button className="icon-button" onClick={handleLogout} aria-label="Keluar">
            <LogOut size={18} />
          </button>
        </div>

        {logoutError ? <p className="sidebar-error">{logoutError}</p> : null}
      </aside>

      {mobileOpen ? (
        <button
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
          aria-label="Tutup menu"
        />
      ) : null}

      <div className="app-main">
        <header className="app-topbar tactile-topbar">
          <div className="topbar-title">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMobileOpen(true)}
              aria-label="Buka menu"
            >
              <Menu size={21} />
            </button>
            <div>
              <span>MAMOWI COFFEE / LIVE</span>
              <strong>{activePage}</strong>
            </div>
          </div>

          <div className="topbar-profile">
            <div className="store-live-status">
              <i aria-hidden="true" />
              <span>Counter ready</span>
            </div>
            <div className="topbar-user-copy">
              <strong>{profile.name}</strong>
              <span>{profile.role}</span>
            </div>
            <div className="mobile-avatar">{profile.name.charAt(0).toUpperCase()}</div>
          </div>
        </header>

        <main className="page-container">{children}</main>
      </div>
    </div>
  );
}
