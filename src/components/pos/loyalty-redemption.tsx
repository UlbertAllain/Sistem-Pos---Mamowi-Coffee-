"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LOYALTY_TIERS } from "@/constants";
import { formatRupiah } from "@/lib/utils";
import type { Customer } from "@/types";

interface LoyaltyRedemptionProps {
  customer: Customer | null;
  open: boolean;
  onClose: () => void;
  onRedeem: (points: number) => void;
  redemptionRate: number;
  maxDiscountAmount: number;
}

export function LoyaltyRedemption({
  customer,
  open,
  onClose,
  onRedeem,
  redemptionRate,
  maxDiscountAmount,
}: LoyaltyRedemptionProps) {
  const [points, setPoints] = useState("");

  if (!customer) return null;

  const currentPoints = customer.loyalty.points;
  const maxRedeemByTotal =
    redemptionRate > 0 ? Math.floor(maxDiscountAmount / redemptionRate) : 0;
  const redeemPts = Math.min(
    parseInt(points) || 0,
    currentPoints,
    maxRedeemByTotal,
  );
  const discountAmount = redeemPts * redemptionRate;

  const tierConfig = LOYALTY_TIERS.find(
    (t) => t.value === customer.loyalty.tier,
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Redeem Poin</DialogTitle>
          <DialogDescription>
            {customer.name} — {currentPoints} poin tersedia
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex items-center justify-between rounded-lg bg-espresso-50 p-3">
            <div>
              <p className="text-sm font-medium text-espresso-700">
                {customer.name}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {tierConfig && (
                  <Badge
                    className="text-[10px]"
                    style={{
                      backgroundColor: tierConfig.color + "20",
                      color: tierConfig.color,
                      borderColor: tierConfig.color,
                    }}
                  >
                    {tierConfig.label}
                  </Badge>
                )}
                <span className="text-xs text-espresso-500">
                  {currentPoints} poin
                </span>
              </div>
            </div>
          </div>

          <Input
            label="Jumlah Poin"
            type="number"
            placeholder="0"
            value={points}
            onChange={(e) => setPoints(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            max={String(currentPoints)}
          />

          <p className="text-xs text-espresso-400 text-center">
            1 poin = Rp {redemptionRate} diskon
            {maxRedeemByTotal < currentPoints
              ? `, maksimal ${maxRedeemByTotal} poin untuk transaksi ini`
              : ""}
          </p>

          {redeemPts > 0 && (
            <div className="rounded-lg bg-success-50 p-3 text-center">
              <p className="text-xs text-success-600">Diskon yang didapat</p>
              <p className="text-2xl font-bold text-success-700">
                {formatRupiah(discountAmount)}
              </p>
              <p className="text-xs text-success-500 mt-1">
                Sisa poin: {currentPoints - redeemPts}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button
            onClick={() => {
              onRedeem(redeemPts);
              setPoints("");
            }}
            disabled={redeemPts <= 0}
          >
            Gunakan {redeemPts} Poin
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
