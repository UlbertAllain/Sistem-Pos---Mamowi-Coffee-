'use client';

import { CreditCard, Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { PageHeader } from '@/components/ui/page-header';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { useAuth } from '@/features/auth/auth-context';
import { PaymentMethodForm } from '@/features/settings/payment-method-form';
import { savePaymentMethod } from '@/features/settings/settings-service';
import { StoreSettingsForm } from '@/features/settings/store-settings-form';
import { useSettings } from '@/features/settings/use-settings';
import { getErrorMessage } from '@/lib/errors';
import type { PaymentMethod } from '@/types/models';

export default function SettingsPage() {
  const { profile, isAdmin } = useAuth();
  const state = useSettings(profile?.storeId);
  const [methodOpen, setMethodOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);

  if (!profile) return null;
  if (!isAdmin) return <ErrorState message="Halaman ini hanya dapat diakses owner atau manager." />;

  const toggleMethod = async (method: PaymentMethod) => {
    try {
      await savePaymentMethod(
        profile.storeId,
        { name: method.name, type: method.type, isActive: !method.isActive },
        method.id,
      );
      toast.success(`Metode ${method.isActive ? 'dinonaktifkan' : 'diaktifkan'}.`);
    } catch (cause) {
      toast.error(getErrorMessage(cause));
    }
  };

  const openCreateMethod = () => {
    setEditingMethod(null);
    setMethodOpen(true);
  };

  const openEditMethod = (method: PaymentMethod) => {
    setEditingMethod(method);
    setMethodOpen(true);
  };

  const closeMethodForm = () => setMethodOpen(false);

  const settingsKey = state.settings?.updatedAt?.toMillis() ?? 'default';

  return (
    <>
      <PageHeader
        eyebrow="Konfigurasi"
        title="Pengaturan"
        description="Atur identitas struk, batas diskon, peringatan stok, dan metode pembayaran."
      />

      {state.loading ? (
        <LoadingState label="Memuat pengaturan..." />
      ) : state.error ? (
        <ErrorState message={state.error} />
      ) : !state.settings ? (
        <ErrorState message="Pengaturan toko tidak tersedia." />
      ) : (
        <div className="settings-grid">
          <section className="card">
            <div className="card-header">
              <div>
                <h2>Informasi toko</h2>
                <p>Informasi ini tampil pada struk.</p>
              </div>
            </div>
            <div className="card-body">
              <StoreSettingsForm
                key={settingsKey}
                storeId={profile.storeId}
                settings={state.settings}
              />
            </div>
          </section>

          <aside className="card">
            <div className="card-header">
              <div>
                <h2>Metode pembayaran</h2>
                <p>Tunai dan non-tunai yang tersedia.</p>
              </div>
              <Button size="sm" onClick={openCreateMethod}>
                <Plus size={15} /> Tambah
              </Button>
            </div>

            <div className="card-body">
              {state.paymentMethods.length === 0 ? (
                <div className="state-panel" style={{ minHeight: 180 }}>
                  <CreditCard size={27} />
                  <strong>Belum ada metode</strong>
                  <p>Tambahkan minimal satu metode agar checkout dapat digunakan.</p>
                </div>
              ) : (
                <div className="payment-list">
                  {state.paymentMethods.map((method) => (
                    <div className="payment-row" key={method.id}>
                      <div className="stat-icon" style={{ margin: 0 }}>
                        <CreditCard size={16} />
                      </div>
                      <div>
                        <strong>{method.name}</strong>
                        <span>{method.type === 'cash' ? 'Tunai' : 'Non-tunai'}</span>
                      </div>
                      <span className={`badge ${method.isActive ? 'badge-success' : 'badge-neutral'}`}>
                        {method.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                      <button
                        className="icon-button"
                        onClick={() => openEditMethod(method)}
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <Button size="sm" variant="ghost" onClick={() => toggleMethod(method)}>
                        {method.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      <Modal
        open={methodOpen}
        title={editingMethod ? 'Edit metode pembayaran' : 'Tambah metode pembayaran'}
        onClose={closeMethodForm}
        width="sm"
      >
        <PaymentMethodForm
          key={editingMethod?.id ?? 'new'}
          storeId={profile.storeId}
          method={editingMethod}
          onCancel={closeMethodForm}
          onSaved={() => {
            closeMethodForm();
            toast.success('Metode pembayaran berhasil disimpan.');
          }}
        />
      </Modal>
    </>
  );
}
