'use client';

import { ArrowDownRight } from 'lucide-react';

import { useAuth } from '@/features/auth/auth-context';
import { useCatalog } from '@/features/catalog/use-catalog';
import { PosScreen } from '@/features/pos/pos-screen';
import { useSettings } from '@/features/settings/use-settings';

export default function PosPage() {
  const { profile } = useAuth();
  const catalog = useCatalog(profile?.storeId);
  const settings = useSettings(profile?.storeId);

  if (!profile) return null;

  return (
    <>
      <header className="pos-editorial-header">
        <div className="editorial-index">02</div>
        <div className="editorial-title">
          <h1>Service Board</h1>
          <span>POINT OF SALE · COUNTER WORKFLOW</span>
        </div>
        <div className="editorial-note">
          <strong>FAST ORDER</strong>
          <span>Pilih menu, cek pesanan, lalu bayar.</span>
          <ArrowDownRight size={16} />
        </div>
      </header>

      <PosScreen
        profile={profile}
        products={catalog.products}
        categories={catalog.categories}
        paymentMethods={settings.paymentMethods}
        settings={settings.settings}
        loading={catalog.loading || settings.loading}
        error={catalog.error ?? settings.error}
      />
    </>
  );
}
