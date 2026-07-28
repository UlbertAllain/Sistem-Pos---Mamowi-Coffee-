import type { Order } from '../../types/models.ts';

export interface ProductSalesRow {
  productId: string;
  name: string;
  quantity: number;
  revenue: number;
}

export interface SalesSummary {
  grossSales: number;
  discounts: number;
  netSales: number;
  transactionCount: number;
  averageTransaction: number;
  itemsSold: number;
  topProducts: ProductSalesRow[];
}

function safeAdd(left: number, right: number): number {
  const result = left + right;
  if (!Number.isSafeInteger(result)) throw new Error('Nilai laporan melebihi batas aman.');
  return result;
}

export function calculateSalesSummary(orders: Order[]): SalesSummary {
  const paidOrders = orders.filter((order) => order.status === 'paid');
  let grossSales = 0;
  let discounts = 0;
  let netSales = 0;
  let itemsSold = 0;
  const products = new Map<string, ProductSalesRow>();

  for (const order of paidOrders) {
    grossSales = safeAdd(grossSales, order.subtotal);
    discounts = safeAdd(discounts, order.discount);
    netSales = safeAdd(netSales, order.total);

    for (const item of order.items) {
      itemsSold = safeAdd(itemsSold, item.quantity);
      const current = products.get(item.productId) ?? {
        productId: item.productId,
        name: item.name,
        quantity: 0,
        revenue: 0,
      };
      current.quantity = safeAdd(current.quantity, item.quantity);
      current.revenue = safeAdd(current.revenue, item.lineTotal);
      products.set(item.productId, current);
    }
  }

  const transactionCount = paidOrders.length;
  return {
    grossSales,
    discounts,
    netSales,
    transactionCount,
    averageTransaction: transactionCount > 0 ? Math.round(netSales / transactionCount) : 0,
    itemsSold,
    topProducts: [...products.values()].sort((left, right) => {
      if (right.quantity !== left.quantity) return right.quantity - left.quantity;
      return right.revenue - left.revenue;
    }),
  };
}
