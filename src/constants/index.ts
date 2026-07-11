import type {
  UserRole,
  PaymentMethod,
  OrderType,
  LoyaltyTier,
  ModifierGroup,
  Variant,
} from "@/types";
import {
  LayoutDashboard,
  ShoppingCart,
  Monitor,
  Receipt,
  UtensilsCrossed,
  Grid3X3,
  Package,
  Users,
  BarChart3,
  UserCog,
  Clock,
  ScrollText,
  Settings,
  type LucideIcon,
} from "lucide-react";

// ===== Navigation =====
export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
  dividerAfter?: boolean;
}

export const NAVIGATION: NavItem[] = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    roles: ["owner", "manager", "cashier", "viewer"],
  },
  {
    name: "Kasir",
    href: "/pos",
    icon: ShoppingCart,
    roles: ["owner", "manager", "cashier"],
  },
  {
    name: "Kitchen Display",
    href: "/kds",
    icon: Monitor,
    roles: ["owner", "manager", "barista"],
    dividerAfter: true,
  },
  {
    name: "Pesanan",
    href: "/orders",
    icon: Receipt,
    roles: ["owner", "manager", "cashier"],
  },
  {
    name: "Menu",
    href: "/menu",
    icon: UtensilsCrossed,
    roles: ["owner", "manager"],
  },
  {
    name: "Kategori",
    href: "/categories",
    icon: Grid3X3,
    roles: ["owner", "manager"],
  },
  {
    name: "Inventaris",
    href: "/inventory",
    icon: Package,
    roles: ["owner", "manager", "barista"],
  },
  {
    name: "Pelanggan",
    href: "/customers",
    icon: Users,
    roles: ["owner", "manager", "cashier"],
    dividerAfter: true,
  },
  {
    name: "Laporan",
    href: "/reports",
    icon: BarChart3,
    roles: ["owner", "manager", "viewer"],
  },
  { name: "Pengguna", href: "/users", icon: UserCog, roles: ["owner"] },
  { name: "Shift", href: "/shifts", icon: Clock, roles: ["owner", "manager"] },
  {
    name: "Aktivitas",
    href: "/activity-log",
    icon: ScrollText,
    roles: ["owner", "manager"],
    dividerAfter: true,
  },
  {
    name: "Pengaturan",
    href: "/settings",
    icon: Settings,
    roles: ["owner", "manager"],
  },
];

// ===== Roles =====
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

// ===== Order Types =====
export const ORDER_TYPES: { value: OrderType; label: string; icon: string }[] =
  [
    { value: "dine-in", label: "Makan Di Tempat", icon: "🪑" },
    { value: "take-away", label: "Bungkus", icon: "🛍️" },
    { value: "delivery", label: "Delivery", icon: "🛵" },
  ];

// ===== Payment Methods =====
export const PAYMENT_METHODS: {
  value: PaymentMethod;
  label: string;
  icon: string;
}[] = [
  { value: "cash", label: "Tunai", icon: "💵" },
  { value: "qris", label: "QRIS", icon: "📱" },
  { value: "card", label: "Kartu Debit/Kredit", icon: "💳" },
  { value: "ewallet", label: "E-Wallet", icon: "🧿" },
];

// ===== Quick Cash Amounts =====
export const QUICK_CASH_AMOUNTS = [10000, 20000, 50000, 100000, 200000, 500000];

// ===== Loyalty Tiers =====
export const LOYALTY_TIERS: {
  value: LoyaltyTier;
  label: string;
  color: string;
  minPoints: number;
  multiplier: number;
}[] = [
  {
    value: "bronze",
    label: "Bronze",
    color: "#CD7F32",
    minPoints: 0,
    multiplier: 1,
  },
  {
    value: "silver",
    label: "Silver",
    color: "#C0C0C0",
    minPoints: 500,
    multiplier: 1.2,
  },
  {
    value: "gold",
    label: "Gold",
    color: "#FFD700",
    minPoints: 2000,
    multiplier: 1.5,
  },
  {
    value: "platinum",
    label: "Platinum",
    color: "#E5E4E2",
    minPoints: 5000,
    multiplier: 2,
  },
];

// ===== Default Modifier Groups =====
export const DEFAULT_MODIFIER_GROUPS: ModifierGroup[] = [
  {
    id: "mg-sugar",
    name: "Tingkat Gula",
    type: "single",
    isRequired: false,
    options: [
      { id: "s1", name: "Normal", priceAdjustment: 0, isDefault: true },
      { id: "s2", name: "Kurang Gula", priceAdjustment: 0, isDefault: false },
      { id: "s3", name: "Tanpa Gula", priceAdjustment: 0, isDefault: false },
    ],
  },
  {
    id: "mg-ice",
    name: "Tingkat Es",
    type: "single",
    isRequired: false,
    options: [
      { id: "i1", name: "Normal", priceAdjustment: 0, isDefault: true },
      { id: "i2", name: "Es Sedikit", priceAdjustment: 0, isDefault: false },
      { id: "i3", name: "Tanpa Es", priceAdjustment: 0, isDefault: false },
    ],
  },
  {
    id: "mg-extras",
    name: "Tambahan",
    type: "multiple",
    isRequired: false,
    options: [
      { id: "e1", name: "Extra Shot", priceAdjustment: 5000, isDefault: false },
      { id: "e2", name: "Extra Milk", priceAdjustment: 3000, isDefault: false },
      {
        id: "e3",
        name: "Whipped Cream",
        priceAdjustment: 4000,
        isDefault: false,
      },
      {
        id: "e4",
        name: "Caramel Syrup",
        priceAdjustment: 3000,
        isDefault: false,
      },
      {
        id: "e5",
        name: "Vanilla Syrup",
        priceAdjustment: 3000,
        isDefault: false,
      },
      {
        id: "e6",
        name: "Hazelnut Syrup",
        priceAdjustment: 3000,
        isDefault: false,
      },
    ],
  },
];

// ===== Default Variants =====
export const DEFAULT_VARIANTS: Variant[] = [
  {
    id: "v-small",
    name: "Small",
    sizeMl: 200,
    priceAdjustment: 0,
    isDefault: false,
  },
  {
    id: "v-medium",
    name: "Medium",
    sizeMl: 300,
    priceAdjustment: 4000,
    isDefault: true,
  },
  {
    id: "v-large",
    name: "Large",
    sizeMl: 400,
    priceAdjustment: 7000,
    isDefault: false,
  },
];

// ===== Ingredient Categories =====
export const INGREDIENT_CATEGORY_LABELS: Record<string, string> = {
  "coffee-beans": "Biji Kopi",
  milk: "Susu",
  sugar: "Gula",
  syrup: "Sirup",
  tea: "Teh",
  "food-ingredients": "Bahan Makanan",
  packaging: "Kemasan",
  other: "Lainnya",
};

// ===== Firestore Paths =====
export const STORE_ID = "default";

export const COLLECTIONS = {
  users: `stores/${STORE_ID}/users`,
  categories: `stores/${STORE_ID}/categories`,
  menuItems: `stores/${STORE_ID}/menu_items`,
  ingredients: `stores/${STORE_ID}/ingredients`,
  orders: `stores/${STORE_ID}/orders`,
  shifts: `stores/${STORE_ID}/shifts`,
  customers: `stores/${STORE_ID}/customers`,
  loyaltyTransactions: `stores/${STORE_ID}/loyalty_transactions`,
  stockTransactions: `stores/${STORE_ID}/stock_transactions`,
  activityLogs: `stores/${STORE_ID}/activity_logs`,
  paymentMethods: `stores/${STORE_ID}/payment_methods`,
  expenses: `stores/${STORE_ID}/expenses`,
  settings: `stores/${STORE_ID}/settings`,
  counters: `stores/${STORE_ID}/counters`,
} as const;
