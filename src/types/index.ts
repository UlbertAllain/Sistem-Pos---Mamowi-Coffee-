// ===== Roles =====
export type UserRole = "owner" | "manager" | "cashier" | "barista" | "viewer";

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: "Pemilik",
  manager: "Manager",
  cashier: "Kasir",
  barista: "Barista",
  viewer: "Viewer",
};

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  owner: ["*"],
  manager: [
    "dashboard",
    "pos",
    "kds",
    "orders",
    "menu",
    "categories",
    "inventory",
    "customers",
    "reports",
    "shifts",
    "activity-log",
    "settings",
  ],
  cashier: ["dashboard", "pos", "orders", "customers"],
  barista: ["kds", "inventory"],
  viewer: ["dashboard", "reports"],
};

// ===== User =====
export interface User {
  uid: string;
  email: string;
  displayName: string;
  pin?: string;
  role: UserRole;
  avatar?: string;
  storeId: string;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ===== Category =====
export interface Category {
  id: string;
  storeId: string;
  name: string;
  slug: string;
  description?: string;
  icon: string;
  color: string;
  image?: string;
  displayOrder: number;
  isActive: boolean;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ===== Menu Item =====
export interface ModifierOption {
  id: string;
  name: string;
  priceAdjustment: number;
  isDefault: boolean;
}

export interface ModifierGroup {
  id: string;
  name: string;
  type: "single" | "multiple";
  isRequired: boolean;
  options: ModifierOption[];
}

export interface Variant {
  id: string;
  name: string;
  sizeMl?: number;
  priceAdjustment: number;
  isDefault: boolean;
}

export interface RecipeItem {
  ingredientId: string;
  quantity: number;
  unit: string;
}

export interface MenuItem {
  id: string;
  storeId: string;
  categoryId: string;
  name: string;
  description?: string;
  sku?: string;
  basePrice: number;
  variants: Variant[];
  modifierGroups: ModifierGroup[];
  recipe: RecipeItem[];
  image?: string;
  images?: string[];
  isActive: boolean;
  isAvailable: boolean;
  isBestSeller: boolean;
  isNew: boolean;
  displayOrder: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ===== Cart / Order Item =====
export interface SelectedModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceAdjustment: number;
}

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  image?: string;
  recipe?: RecipeItem[];
  variant: Variant | null;
  modifiers: SelectedModifier[];
  notes: string;
  quantity: number;
  unitPrice: number; // basePrice + variant + sum(modifiers)
  subtotal: number; // unitPrice * quantity
  status: "pending" | "preparing" | "ready" | "served" | "cancelled";
}

// ===== Order =====
export type OrderType = "dine-in" | "take-away" | "delivery";
export type OrderStatus =
  | "new"
  | "held"
  | "pending_payment"
  | "paid"
  | "completed"
  | "voided";
export type PaymentMethod = "cash" | "qris" | "card" | "ewallet";

export interface PaymentRecord {
  method: PaymentMethod;
  amount: number;
  received?: number; // untuk cash
  change?: number; // untuk cash
  lastDigits?: string; // untuk card
  reference?: string; // untuk qris/ewallet
}

export interface Order {
  id: string;
  storeId: string;
  orderNumber: number;
  orderType: OrderType;
  tableNumber: number | null;
  customerName?: string;
  customerPhone?: string;
  customerId?: string;
  items: CartItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountType: "percentage" | "fixed" | "voucher" | null;
  discountValue: number;
  discountAmount: number;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: "unpaid" | "partial" | "paid" | "refunded";
  payments: PaymentRecord[];
  cashierId: string;
  cashierName: string;
  shiftId: string;
  loyaltyPointsEarned: number;
  loyaltyPointsRedeemed: number;
  loyaltyCardNumber?: string;
  timestamps: {
    createdAt: Date;
    heldAt: Date | null;
    recalledAt: Date | null;
    paidAt: Date | null;
    completedAt: Date | null;
    voidedAt: Date | null;
  };
  voidReason?: string;
  voidApprovedBy?: string;
  notes?: string;
}

// ===== Shift =====
export type ShiftStatus = "active" | "closed";

export interface Shift {
  id: string;
  storeId: string;
  userId: string;
  userName: string;
  role: UserRole;
  startTime: Date;
  endTime: Date | null;
  status: ShiftStatus;
  openingCash: number;
  closingCash: number | null;
  expectedCash: number | null;
  cashDifference: number | null;
  totalTransactions: number;
  totalRevenue: number;
  notes?: string;
}

// ===== Ingredient / Inventory =====
export interface Ingredient {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  costPerUnit: number;
  supplier?: string;
  supplierCode?: string;
  isActive: boolean;
  lowStockAlert: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type StockTransactionType =
  | "in"
  | "out"
  | "adjustment"
  | "waste"
  | "initial";
export type StockReferenceType =
  | "order"
  | "manual_in"
  | "manual_out"
  | "adjustment"
  | "waste"
  | "initial";

export interface StockTransaction {
  id: string;
  storeId: string;
  ingredientId: string;
  ingredientName: string;
  type: StockTransactionType;
  quantity: number;
  unit: string;
  referenceType: StockReferenceType;
  referenceId?: string;
  previousStock: number;
  newStock: number;
  notes?: string;
  performedBy: string;
  createdAt: Date;
}

// ===== Customer =====
export type LoyaltyTier = "bronze" | "silver" | "gold" | "platinum";

export interface Customer {
  id: string;
  storeId: string;
  name: string;
  phone: string;
  email?: string;
  loyalty: {
    cardNumber: string;
    points: number;
    totalSpent: number;
    totalVisits: number;
    tier: LoyaltyTier;
    joinDate: Date;
    lastVisit: Date | null;
  };
  tags: string[];
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ===== Store Settings =====
export interface DaySchedule {
  open: string;
  close: string;
  isOpen: boolean;
}

export interface StoreSettings {
  id: string;
  storeId: string;
  name: string;
  tagline?: string;
  address: string;
  phone: string;
  email?: string;
  website?: string;
  operatingHours: Record<string, DaySchedule>;
  timezone: string;
  tables: TableConfig[];
  tax: {
    enabled: boolean;
    rate: number;
    mode: "included" | "added";
    taxId?: string;
  };
  receipt: {
    header: string;
    footer: string;
    showLoyalty: boolean;
    printerWidth: 58 | 80;
    printMode: "browser" | "escpos";
  };
  orderPrefix: string;
  orderNumberReset: "daily" | "monthly" | "yearly" | "never";
  loyalty: {
    enabled: boolean;
    pointsPerThousand: number;
    redemptionRate: number;
    tiers: {
      bronze: { minPoints: number; multiplier: number };
      silver: { minPoints: number; multiplier: number };
      gold: { minPoints: number; multiplier: number };
      platinum: { minPoints: number; multiplier: number };
    };
  };
  logo?: string;
  primaryColor: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TableConfig {
  number: number;
  capacity: number;
  area: "indoor" | "outdoor" | "bar";
  isActive: boolean;
}

// ===== Activity Log =====
export interface ActivityLog {
  id: string;
  storeId: string;
  userId: string;
  userName: string;
  action: string;
  category: string;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
}

// ===== Payment Method Config =====
export interface PaymentMethodConfig {
  id: string;
  storeId: string;
  name: string;
  type: PaymentMethod;
  icon: string;
  isActive: boolean;
  requiresApproval: boolean;
  config: Record<string, unknown>;
  displayOrder: number;
}
