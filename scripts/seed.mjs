import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  doc,
  getFirestore,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

dotenv.config({ path: ".env.local" });

const STORE_ID = process.env.SEED_STORE_ID || "default";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function required(value, name) {
  if (!value) {
    throw new Error(`Missing ${name} in .env.local`);
  }
  return value;
}

required(firebaseConfig.apiKey, "NEXT_PUBLIC_FIREBASE_API_KEY");
required(firebaseConfig.authDomain, "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
required(firebaseConfig.projectId, "NEXT_PUBLIC_FIREBASE_PROJECT_ID");
required(firebaseConfig.appId, "NEXT_PUBLIC_FIREBASE_APP_ID");

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const categories = [
  {
    id: "cat-coffee",
    name: "Coffee",
    slug: "coffee",
    description: "Espresso based dan kopi klasik",
    icon: "Coffee",
    color: "#8b5e34",
    displayOrder: 1,
  },
  {
    id: "cat-non-coffee",
    name: "Non Coffee",
    slug: "non-coffee",
    description: "Minuman tanpa kopi",
    icon: "CupSoda",
    color: "#2563eb",
    displayOrder: 2,
  },
  {
    id: "cat-tea",
    name: "Tea",
    slug: "tea",
    description: "Teh panas dan dingin",
    icon: "Leaf",
    color: "#16a34a",
    displayOrder: 3,
  },
  {
    id: "cat-food",
    name: "Food",
    slug: "food",
    description: "Snack dan makanan pendamping",
    icon: "Utensils",
    color: "#d97706",
    displayOrder: 4,
  },
];

const ingredients = [
  {
    id: "ing-espresso-beans",
    name: "Espresso Beans",
    category: "coffee-beans",
    unit: "gram",
    currentStock: 5000,
    minStockLevel: 800,
    maxStockLevel: 8000,
    costPerUnit: 180,
    supplier: "Local Roastery",
  },
  {
    id: "ing-fresh-milk",
    name: "Fresh Milk",
    category: "milk",
    unit: "ml",
    currentStock: 12000,
    minStockLevel: 2500,
    maxStockLevel: 18000,
    costPerUnit: 18,
    supplier: "Daily Dairy",
  },
  {
    id: "ing-oat-milk",
    name: "Oat Milk",
    category: "milk",
    unit: "ml",
    currentStock: 4000,
    minStockLevel: 1000,
    maxStockLevel: 8000,
    costPerUnit: 35,
    supplier: "Alt Milk Co",
  },
  {
    id: "ing-sugar",
    name: "Sugar",
    category: "sugar",
    unit: "gram",
    currentStock: 6000,
    minStockLevel: 1000,
    maxStockLevel: 10000,
    costPerUnit: 16,
    supplier: "Grocery Supplier",
  },
  {
    id: "ing-chocolate-powder",
    name: "Chocolate Powder",
    category: "other",
    unit: "gram",
    currentStock: 2500,
    minStockLevel: 500,
    maxStockLevel: 5000,
    costPerUnit: 90,
    supplier: "Bakery Supplier",
  },
  {
    id: "ing-matcha-powder",
    name: "Matcha Powder",
    category: "tea",
    unit: "gram",
    currentStock: 1200,
    minStockLevel: 250,
    maxStockLevel: 2500,
    costPerUnit: 180,
    supplier: "Tea House",
  },
  {
    id: "ing-black-tea",
    name: "Black Tea",
    category: "tea",
    unit: "gram",
    currentStock: 1500,
    minStockLevel: 300,
    maxStockLevel: 3000,
    costPerUnit: 70,
    supplier: "Tea House",
  },
  {
    id: "ing-croissant",
    name: "Butter Croissant",
    category: "food-ingredients",
    unit: "pcs",
    currentStock: 40,
    minStockLevel: 8,
    maxStockLevel: 80,
    costPerUnit: 8000,
    supplier: "Bakery Partner",
  },
  {
    id: "ing-cup-12oz",
    name: "Paper Cup 12oz",
    category: "packaging",
    unit: "pcs",
    currentStock: 300,
    minStockLevel: 80,
    maxStockLevel: 600,
    costPerUnit: 650,
    supplier: "Packaging Supplier",
  },
];

const variants = [
  { id: "v-hot", name: "Hot", priceAdjustment: 0, isDefault: true },
  { id: "v-ice", name: "Ice", priceAdjustment: 2000, isDefault: false },
];

const sizes = [
  { id: "v-regular", name: "Regular", sizeMl: 300, priceAdjustment: 0, isDefault: true },
  { id: "v-large", name: "Large", sizeMl: 420, priceAdjustment: 5000, isDefault: false },
];

const sugarGroup = {
  id: "mg-sugar",
  name: "Tingkat Gula",
  type: "single",
  isRequired: false,
  options: [
    { id: "s-normal", name: "Normal", priceAdjustment: 0, isDefault: true },
    { id: "s-less", name: "Less Sugar", priceAdjustment: 0, isDefault: false },
    { id: "s-none", name: "No Sugar", priceAdjustment: 0, isDefault: false },
  ],
};

const milkGroup = {
  id: "mg-milk",
  name: "Pilihan Susu",
  type: "single",
  isRequired: false,
  options: [
    { id: "m-fresh", name: "Fresh Milk", priceAdjustment: 0, isDefault: true },
    { id: "m-oat", name: "Oat Milk", priceAdjustment: 5000, isDefault: false },
  ],
};

const extraGroup = {
  id: "mg-extras",
  name: "Tambahan",
  type: "multiple",
  isRequired: false,
  options: [
    { id: "e-shot", name: "Extra Shot", priceAdjustment: 6000, isDefault: false },
    { id: "e-whip", name: "Whipped Cream", priceAdjustment: 4000, isDefault: false },
  ],
};

const menuItems = [
  {
    id: "menu-espresso",
    categoryId: "cat-coffee",
    name: "Espresso",
    description: "Single shot espresso",
    sku: "COF-ESP",
    basePrice: 18000,
    variants: [],
    modifierGroups: [extraGroup],
    recipe: [{ ingredientId: "ing-espresso-beans", quantity: 18, unit: "gram" }],
    isBestSeller: false,
    isNew: false,
    displayOrder: 1,
    tags: ["coffee", "espresso", "hot"],
  },
  {
    id: "menu-americano",
    categoryId: "cat-coffee",
    name: "Americano",
    description: "Espresso dengan air panas atau es",
    sku: "COF-AME",
    basePrice: 22000,
    variants,
    modifierGroups: [sugarGroup, extraGroup],
    recipe: [{ ingredientId: "ing-espresso-beans", quantity: 18, unit: "gram" }],
    isBestSeller: true,
    isNew: false,
    displayOrder: 2,
    tags: ["coffee", "americano"],
  },
  {
    id: "menu-caffe-latte",
    categoryId: "cat-coffee",
    name: "Caffe Latte",
    description: "Espresso, steamed milk, dan foam tipis",
    sku: "COF-LAT",
    basePrice: 28000,
    variants: sizes,
    modifierGroups: [sugarGroup, milkGroup, extraGroup],
    recipe: [
      { ingredientId: "ing-espresso-beans", quantity: 18, unit: "gram" },
      { ingredientId: "ing-fresh-milk", quantity: 220, unit: "ml" },
    ],
    isBestSeller: true,
    isNew: false,
    displayOrder: 3,
    tags: ["coffee", "milk", "latte"],
  },
  {
    id: "menu-cappuccino",
    categoryId: "cat-coffee",
    name: "Cappuccino",
    description: "Espresso dengan foam tebal",
    sku: "COF-CAP",
    basePrice: 28000,
    variants: sizes,
    modifierGroups: [sugarGroup, milkGroup, extraGroup],
    recipe: [
      { ingredientId: "ing-espresso-beans", quantity: 18, unit: "gram" },
      { ingredientId: "ing-fresh-milk", quantity: 180, unit: "ml" },
    ],
    isBestSeller: false,
    isNew: false,
    displayOrder: 4,
    tags: ["coffee", "milk", "cappuccino"],
  },
  {
    id: "menu-mocha",
    categoryId: "cat-non-coffee",
    name: "Chocolate Mocha",
    description: "Cokelat, susu, dan espresso",
    sku: "NCF-MOC",
    basePrice: 32000,
    variants: sizes,
    modifierGroups: [sugarGroup, milkGroup, extraGroup],
    recipe: [
      { ingredientId: "ing-espresso-beans", quantity: 18, unit: "gram" },
      { ingredientId: "ing-fresh-milk", quantity: 200, unit: "ml" },
      { ingredientId: "ing-chocolate-powder", quantity: 25, unit: "gram" },
    ],
    isBestSeller: true,
    isNew: false,
    displayOrder: 5,
    tags: ["chocolate", "coffee", "milk"],
  },
  {
    id: "menu-matcha-latte",
    categoryId: "cat-tea",
    name: "Matcha Latte",
    description: "Matcha premium dengan susu",
    sku: "TEA-MAT",
    basePrice: 32000,
    variants: sizes,
    modifierGroups: [sugarGroup, milkGroup],
    recipe: [
      { ingredientId: "ing-matcha-powder", quantity: 12, unit: "gram" },
      { ingredientId: "ing-fresh-milk", quantity: 220, unit: "ml" },
    ],
    isBestSeller: false,
    isNew: true,
    displayOrder: 6,
    tags: ["matcha", "tea", "milk"],
  },
  {
    id: "menu-lychee-tea",
    categoryId: "cat-tea",
    name: "Iced Lychee Tea",
    description: "Black tea dingin dengan lychee",
    sku: "TEA-LYC",
    basePrice: 24000,
    variants: [],
    modifierGroups: [sugarGroup],
    recipe: [
      { ingredientId: "ing-black-tea", quantity: 8, unit: "gram" },
      { ingredientId: "ing-sugar", quantity: 12, unit: "gram" },
    ],
    isBestSeller: false,
    isNew: true,
    displayOrder: 7,
    tags: ["tea", "ice"],
  },
  {
    id: "menu-croissant",
    categoryId: "cat-food",
    name: "Butter Croissant",
    description: "Croissant butter hangat",
    sku: "FOD-CRS",
    basePrice: 22000,
    variants: [],
    modifierGroups: [],
    recipe: [{ ingredientId: "ing-croissant", quantity: 1, unit: "pcs" }],
    isBestSeller: false,
    isNew: false,
    displayOrder: 8,
    tags: ["food", "pastry"],
  },
];

const users = [
  {
    id: "kasir-001",
    displayName: "Kasir Satu",
    email: "kasir@koffee.local",
    role: "cashier",
    pin: "1234",
  },
  {
    id: "barista-001",
    displayName: "Barista Satu",
    email: "barista@koffee.local",
    role: "barista",
    pin: "2345",
  },
  {
    id: "manager-001",
    displayName: "Manager Outlet",
    email: "manager@koffee.local",
    role: "manager",
    pin: "3456",
  },
];

const settings = {
  storeId: STORE_ID,
  name: "KOFFEE POS",
  tagline: "Fresh coffee, simple service",
  address: "Jl. Kopi No. 1, Jakarta",
  phone: "081234567890",
  email: "hello@koffee.local",
  website: "",
  operatingHours: {
    monday: { open: "08:00", close: "22:00", isOpen: true },
    tuesday: { open: "08:00", close: "22:00", isOpen: true },
    wednesday: { open: "08:00", close: "22:00", isOpen: true },
    thursday: { open: "08:00", close: "22:00", isOpen: true },
    friday: { open: "08:00", close: "23:00", isOpen: true },
    saturday: { open: "09:00", close: "23:00", isOpen: true },
    sunday: { open: "09:00", close: "21:00", isOpen: true },
  },
  timezone: "Asia/Jakarta",
  tables: [
    { number: 1, capacity: 2, area: "indoor", isActive: true },
    { number: 2, capacity: 2, area: "indoor", isActive: true },
    { number: 3, capacity: 4, area: "indoor", isActive: true },
    { number: 4, capacity: 4, area: "outdoor", isActive: true },
    { number: 5, capacity: 6, area: "outdoor", isActive: true },
    { number: 6, capacity: 2, area: "bar", isActive: true },
  ],
  tax: { enabled: true, rate: 10, mode: "included" },
  receipt: {
    header: "KOFFEE POS",
    footer: "Terima kasih. Datang kembali!",
    showLoyalty: true,
    printerWidth: 80,
    printMode: "browser",
  },
  orderPrefix: "KOF",
  orderNumberReset: "daily",
  loyalty: {
    enabled: true,
    pointsPerThousand: 1,
    redemptionRate: 50,
    tiers: {
      bronze: { minPoints: 0, multiplier: 1 },
      silver: { minPoints: 500, multiplier: 1.2 },
      gold: { minPoints: 2000, multiplier: 1.5 },
      platinum: { minPoints: 5000, multiplier: 2 },
    },
  },
  logo: "",
  primaryColor: "#8b5e34",
};

const paymentMethods = [
  { id: "pm-cash", name: "Tunai", type: "cash", icon: "Banknote", displayOrder: 1 },
  { id: "pm-qris", name: "QRIS", type: "qris", icon: "QrCode", displayOrder: 2 },
  { id: "pm-card", name: "Kartu Debit/Kredit", type: "card", icon: "CreditCard", displayOrder: 3 },
  { id: "pm-ewallet", name: "E-Wallet", type: "ewallet", icon: "Smartphone", displayOrder: 4 },
];

async function loginIfConfigured() {
  const email = process.env.SEED_OWNER_EMAIL;
  const password = process.env.SEED_OWNER_PASSWORD;
  if (!email || !password) {
    console.log("No SEED_OWNER_EMAIL/PASSWORD set. Trying seed without auth.");
    return null;
  }

  const credential = await signInWithEmailAndPassword(auth, email, password);
  console.log(`Signed in as ${credential.user.email}`);
  return credential.user;
}

function withBase(data) {
  return {
    ...data,
    storeId: STORE_ID,
    isActive: data.isActive ?? true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

async function seed() {
  const owner = await loginIfConfigured();
  const batch = writeBatch(db);

  batch.set(doc(db, "stores", STORE_ID), {
    id: STORE_ID,
    name: settings.name,
    isActive: true,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  batch.set(doc(db, "stores", STORE_ID, "settings", "main"), {
    ...settings,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });

  for (const category of categories) {
    batch.set(
      doc(db, "stores", STORE_ID, "categories", category.id),
      withBase({
        ...category,
        image: "",
        isAvailable: true,
      }),
      { merge: true },
    );
  }

  for (const ingredient of ingredients) {
    batch.set(
      doc(db, "stores", STORE_ID, "ingredients", ingredient.id),
      withBase({
        ...ingredient,
        description: "",
        supplierCode: "",
        lowStockAlert: ingredient.currentStock <= ingredient.minStockLevel,
      }),
      { merge: true },
    );
  }

  for (const menuItem of menuItems) {
    batch.set(
      doc(db, "stores", STORE_ID, "menu_items", menuItem.id),
      withBase({
        ...menuItem,
        image: "",
        images: [],
        isAvailable: true,
      }),
      { merge: true },
    );
  }

  for (const user of users) {
    batch.set(
      doc(db, "stores", STORE_ID, "users", user.id),
      {
        uid: user.id,
        storeId: STORE_ID,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
        pin: user.pin,
        isActive: true,
        avatar: "",
        lastLogin: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }

  if (owner) {
    batch.set(
      doc(db, "stores", STORE_ID, "users", owner.uid),
      {
        uid: owner.uid,
        storeId: STORE_ID,
        displayName: owner.displayName || "Owner",
        email: owner.email || "",
        role: "owner",
        isActive: true,
        avatar: "",
        lastLogin: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }

  for (const method of paymentMethods) {
    batch.set(
      doc(db, "stores", STORE_ID, "payment_methods", method.id),
      {
        ...method,
        storeId: STORE_ID,
        isActive: true,
        requiresApproval: false,
        config: {},
      },
      { merge: true },
    );
  }

  batch.set(
    doc(db, "stores", STORE_ID, "counters", "order_number"),
    { value: 0, updatedAt: serverTimestamp() },
    { merge: true },
  );

  await batch.commit();

  console.log(`Seed complete for store: ${STORE_ID}`);
  console.log("PIN users:");
  for (const user of users) {
    console.log(`- ${user.displayName}: ID=${user.id}, PIN=${user.pin}`);
  }
}

seed().catch((error) => {
  console.error("Seed failed:");
  console.error(error?.code || error?.name || "unknown-error");
  console.error(error?.message || String(error));
  if (process.env.SEED_DEBUG === "1" && error?.stack) {
    console.error(error.stack);
  }
  process.exitCode = 1;
});
