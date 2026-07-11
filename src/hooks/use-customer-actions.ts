import {
  doc,
  setDoc,
  getDoc,
  addDoc,
  serverTimestamp,
  collection,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS, STORE_ID } from "@/constants";
import { useSettings } from "@/hooks/use-settings";
import type { Customer, LoyaltyTier } from "@/types";
import { toast } from "sonner";
import { LOYALTY_TIERS } from "@/constants";

function calculateTier(points: number): LoyaltyTier {
  let tier: LoyaltyTier = "bronze";
  for (const t of LOYALTY_TIERS) {
    if (points >= t.minPoints) tier = t.value;
  }
  return tier;
}

function calculatePointsEarned(
  amount: number,
  tier: LoyaltyTier,
  pointsPerThousand: number,
): number {
  const tierConfig = LOYALTY_TIERS.find((t) => t.value === tier);
  const multiplier = tierConfig?.multiplier || 1;
  return Math.floor((amount / 1000) * pointsPerThousand * multiplier);
}

export function useCustomerActions() {
  const { settings } = useSettings();

  const createCustomer = async (data: {
    name: string;
    phone: string;
    email?: string;
  }): Promise<Customer | null> => {
    try {
      const id = `cust-${Date.now()}`;
      const now = new Date();
      const cardNumber = `KOFFEE-${String(now.getTime()).slice(-6)}`;

      const customer: Customer = {
        id,
        storeId: STORE_ID,
        name: data.name,
        phone: data.phone,
        email: data.email || undefined,
        loyalty: {
          cardNumber,
          points: 0,
          totalSpent: 0,
          totalVisits: 0,
          tier: "bronze",
          joinDate: now,
          lastVisit: null,
        },
        tags: [],
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(db, COLLECTIONS.customers, id), {
        ...customer,
        loyalty: {
          ...customer.loyalty,
          joinDate: serverTimestamp(),
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success(`Pelanggan ${data.name} ditambahkan`);
      return customer;
    } catch (error) {
      console.error("Create customer error:", error);
      toast.error("Gagal menambah pelanggan");
      return null;
    }
  };

  const processLoyalty = async (params: {
    customerId: string;
    orderAmount: number;
    orderId: string;
    pointsToRedeem?: number;
  }): Promise<{
    earned: number;
    redeemed: number;
    newBalance: number;
  } | null> => {
    const { customerId, orderAmount, orderId, pointsToRedeem = 0 } = params;

    try {
      const customerRef = doc(db, COLLECTIONS.customers, customerId);
      const customerSnap = await getDoc(customerRef);
      if (!customerSnap.exists()) {
        toast.error("Pelanggan tidak ditemukan");
        return null;
      }

      const data = customerSnap.data();
      const currentPoints = data.loyalty?.points || 0;
      const currentTier = data.loyalty?.tier || "bronze";
      const pointsPerThousand = settings?.loyalty?.pointsPerThousand || 1;

      // Hitung poin earned
      const earned = calculatePointsEarned(
        orderAmount,
        currentTier,
        pointsPerThousand,
      );

      // Validasi redeem
      const redeem = Math.min(pointsToRedeem, currentPoints);

      // Hitung balance baru
      const newBalance = currentPoints - redeem + earned;
      const newTier = calculateTier(newBalance);
      const newTotalSpent = (data.loyalty?.totalSpent || 0) + orderAmount;
      const newTotalVisits = (data.loyalty?.totalVisits || 0) + 1;

      // Update customer
      await setDoc(
        customerRef,
        {
          "loyalty.points": newBalance,
          "loyalty.tier": newTier,
          "loyalty.totalSpent": newTotalSpent,
          "loyalty.totalVisits": newTotalVisits,
          "loyalty.lastVisit": serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      // Catat transaksi redeem
      if (redeem > 0) {
        await addDoc(collection(db, COLLECTIONS.loyaltyTransactions), {
          storeId: STORE_ID,
          customerId,
          type: "redeem",
          points: redeem,
          previousBalance: currentPoints,
          newBalance: currentPoints - redeem,
          description: `Redeemed in order #${orderId}`,
          createdAt: serverTimestamp(),
        });
      }

      // Catat transaksi earn
      if (earned > 0) {
        await addDoc(collection(db, COLLECTIONS.loyaltyTransactions), {
          storeId: STORE_ID,
          customerId,
          type: "earn",
          points: earned,
          previousBalance: currentPoints - redeem,
          newBalance,
          description: `Earned from order #${orderId}`,
          createdAt: serverTimestamp(),
        });
      }

      return { earned, redeemed: redeem, newBalance };
    } catch (error) {
      console.error("Loyalty process error:", error);
      toast.error("Gagal memproses loyalitas");
      return null;
    }
  };

  return {
    createCustomer,
    processLoyalty,
    calculatePointsEarned,
    calculateTier,
  };
}
