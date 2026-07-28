'use client';

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { Order, StoreSettings } from '@/types/models';

interface ReceiptProps {
  order: Order;
  settings?: StoreSettings | null;
  showPrintButton?: boolean;
}

export function Receipt({ order, settings, showPrintButton = true }: ReceiptProps) {
  return (
    <div>
      <div className="print-area receipt">
        <div className="receipt-head">
          <h2>{settings?.storeName || 'Mamowi Coffee'}</h2>
          {settings?.address ? <p>{settings.address}</p> : null}
          {settings?.phone ? <p>{settings.phone}</p> : null}
        </div>
        <hr className="receipt-divider" />
        <div className="receipt-meta">
          <div className="receipt-line"><span>No.</span><strong>{order.orderNumber}</strong></div>
          <div className="receipt-line"><span>Waktu</span><span>{formatDateTime(order.createdAt)}</span></div>
          <div className="receipt-line"><span>Kasir</span><span>{order.cashierName}</span></div>
          <div className="receipt-line"><span>Bayar</span><span>{order.paymentMethodName}</span></div>
        </div>
        <hr className="receipt-divider" />
        <div className="receipt-items">
          {order.items.map((item) => (
            <div className="receipt-item" key={item.productId}>
              <strong>{item.name}</strong>
              <div><span>{item.quantity} × {formatCurrency(item.unitPrice)}</span><span>{formatCurrency(item.lineTotal)}</span></div>
            </div>
          ))}
        </div>
        <hr className="receipt-divider" />
        <div className="receipt-totals">
          <div className="receipt-line"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
          {order.discount > 0 ? <div className="receipt-line"><span>Diskon</span><span>-{formatCurrency(order.discount)}</span></div> : null}
          <div className="receipt-line receipt-total"><span>Total</span><span>{formatCurrency(order.total)}</span></div>
          <div className="receipt-line"><span>Dibayar</span><span>{formatCurrency(order.paid)}</span></div>
          <div className="receipt-line"><span>Kembalian</span><span>{formatCurrency(order.change)}</span></div>
        </div>
        {order.status === 'voided' ? <><hr className="receipt-divider" /><p className="receipt-footer">TRANSAKSI DIBATALKAN<br />{order.voidReason}</p></> : null}
        <p className="receipt-footer">{settings?.receiptFooter || 'Terima kasih. Sampai jumpa kembali.'}</p>
      </div>
      {showPrintButton ? <div className="form-actions receipt-actions"><Button variant="secondary" onClick={() => window.print()}><Printer size={16} /> Cetak struk</Button></div> : null}
    </div>
  );
}
