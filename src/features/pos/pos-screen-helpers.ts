import { Timestamp } from 'firebase/firestore';

import type { Order, Product } from '@/types/models';
import type { SellableProduct } from './cart-domain';
import type { CheckoutResult } from './checkout-service';

export function createSellableProductMap(products: Product[]): Map<string, SellableProduct> {
  return new Map(products.map((product) => [product.id, {
    id: product.id,
    sku: product.sku,
    name: product.name,
    price: product.price,
    stockQty: product.stockQty,
    trackStock: product.trackStock,
    isActive: product.isActive,
  }]));
}

export function createReceiptOrder(result: CheckoutResult): Order {
  return {
    id: result.orderId,
    schemaVersion: 2,
    sequence: result.sequence,
    storeId: result.storeId,
    orderNumber: result.orderNumber,
    cashierId: result.cashierId,
    cashierName: result.cashierName,
    requestFingerprint: '',
    items: result.items,
    subtotal: result.subtotal,
    discount: result.discount,
    total: result.total,
    paid: result.paid,
    change: result.change,
    paymentMethodId: result.paymentMethodId,
    paymentMethodName: result.paymentMethodName,
    status: 'paid',
    paymentStatus: 'paid',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
}
