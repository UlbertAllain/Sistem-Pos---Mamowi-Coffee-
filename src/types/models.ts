import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'owner' | 'manager' | 'cashier';

export interface UserProfile {
  id: string;
  storeId: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Timestamp | null;
}

export interface Category {
  id: string;
  storeId: string;
  name: string;
  isActive: boolean;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface Product {
  id: string;
  storeId: string;
  categoryId: string;
  name: string;
  sku: string;
  price: number;
  stockQty: number;
  trackStock: boolean;
  isActive: boolean;
  imageUrl: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface PaymentMethod {
  id: string;
  storeId: string;
  name: string;
  type: 'cash' | 'non_cash';
  isActive: boolean;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface OrderItem {
  productId: string;
  sku: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  trackStock: boolean;
}

export interface Order {
  id: string;
  schemaVersion: 2;
  sequence: number;
  storeId: string;
  orderNumber: string;
  counterId?: string;
  stockQuantities?: Record<string, number>;
  cashierId: string;
  cashierName: string;
  requestFingerprint: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  change: number;
  paymentMethodId: string;
  paymentMethodName: string;
  status: 'paid' | 'voided';
  paymentStatus: 'paid' | 'refunded';
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
  voidReason?: string;
  voidedBy?: string;
  voidedAt?: Timestamp | null;
}

export interface StoreSettings {
  id: 'general';
  storeId: string;
  storeName: string;
  address: string;
  phone: string;
  receiptFooter: string;
  maxDiscount: number;
  lowStockThreshold: number;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface StockMovement {
  id: string;
  storeId: string;
  productId: string;
  orderId?: string;
  type: 'sale' | 'adjustment' | 'void';
  quantityDelta: number;
  beforeQty: number;
  afterQty: number;
  actorId: string;
  note: string;
  createdAt?: Timestamp | null;
}
