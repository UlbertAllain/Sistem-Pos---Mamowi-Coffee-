'use client';

import { BadgeCheck, WalletCards } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Receipt } from '@/features/orders/receipt';
import { formatCurrency } from '@/lib/format';
import type { Order, PaymentMethod, StoreSettings } from '@/types/models';

interface PosPaymentModalsProps {
  activeMethods: PaymentMethod[];
  cashPaid: string;
  change: number;
  checkoutError: string | null;
  completedOrder: Order | null;
  paymentOpen: boolean;
  paymentReady: boolean;
  quickCash: number[];
  selectedMethodId: string;
  settings: StoreSettings | null;
  submitting: boolean;
  total: number;
  onCashPaidChange: (value: string) => void;
  onCheckout: () => void;
  onCloseCompletedOrder: () => void;
  onClosePayment: () => void;
  onMethodChange: (method: PaymentMethod) => void;
}

export function PosPaymentModals(props: PosPaymentModalsProps) {
  const {
    activeMethods,
    cashPaid,
    change,
    checkoutError,
    completedOrder,
    paymentOpen,
    paymentReady,
    quickCash,
    selectedMethodId,
    settings,
    submitting,
    total,
    onCashPaidChange,
    onCheckout,
    onCloseCompletedOrder,
    onClosePayment,
    onMethodChange,
  } = props;
  const selectedMethod = activeMethods.find((method) => method.id === selectedMethodId);

  return (
    <>
      <Modal
        open={paymentOpen}
        title="Selesaikan pembayaran"
        description="Pilih metode dan pastikan nominal sudah benar."
        onClose={onClosePayment}
        width="sm"
      >
        <div className="payment-total-card tactile-payment-total">
          <span>Total tagihan</span>
          <strong>{formatCurrency(total)}</strong>
        </div>

        <div className="form-stack">
          <div className="payment-method-grid tactile-payment-methods">
            {activeMethods.map((method) => (
              <button
                key={method.id}
                className={`payment-method ${selectedMethodId === method.id ? 'payment-method-active' : ''}`}
                onClick={() => onMethodChange(method)}
              >
                <WalletCards size={18} />
                <strong>{method.name}</strong>
                <span>{method.type === 'cash' ? 'Tunai' : 'Non-tunai'}</span>
              </button>
            ))}
          </div>

          {selectedMethod?.type === 'cash' ? (
            <>
              <label className="field">
                <span>Uang diterima</span>
                <input
                  className="payment-input"
                  type="number"
                  min={total}
                  value={cashPaid}
                  onChange={(event) => onCashPaidChange(event.target.value)}
                />
              </label>
              <div className="quick-cash">
                {quickCash.map((value) => (
                  <button key={value} onClick={() => onCashPaidChange(String(value))}>
                    {formatCurrency(value)}
                  </button>
                ))}
              </div>
              <div className="change-card tactile-change-card">
                <span>Kembalian</span>
                <strong>{formatCurrency(change)}</strong>
              </div>
            </>
          ) : (
            <div className="inline-alert inline-alert-warning">
              Pastikan pembayaran non-tunai sudah berhasil sebelum transaksi diselesaikan.
            </div>
          )}

          {checkoutError ? (
            <div className="inline-alert inline-alert-error">{checkoutError}</div>
          ) : null}

          <div className="form-actions">
            <Button variant="secondary" onClick={onClosePayment} disabled={submitting}>
              Batal
            </Button>
            <Button onClick={onCheckout} disabled={submitting || !paymentReady}>
              {submitting ? 'Memproses...' : (
                <>
                  <BadgeCheck size={18} />
                  Konfirmasi pembayaran
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(completedOrder)}
        title="Pembayaran berhasil"
        description={completedOrder?.orderNumber}
        onClose={onCloseCompletedOrder}
        width="sm"
      >
        {completedOrder ? <Receipt order={completedOrder} settings={settings} /> : null}
      </Modal>
    </>
  );
}
