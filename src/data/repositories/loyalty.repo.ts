import { supabase } from "@/integrations/supabase/client";
import { unwrapList, unwrapMaybe } from "@/data/core/query";

export type LoyaltyTier = "bronze" | "silver" | "gold" | "platinum";

export interface LoyaltyBalance {
  total_points: number;
  lifetime_points: number;
  tier: LoyaltyTier;
}

export interface PointsTransaction {
  id: string;
  points: number;
  transaction_type: "earned" | "redeemed" | "bonus" | "expired";
  description: string;
  created_at: string;
}

export const EMPTY_BALANCE: LoyaltyBalance = {
  total_points: 0,
  lifetime_points: 0,
  tier: "bronze",
};

const SCOPE = "loyalty";

export const loyaltyRepository = {
  /**
   * The loyalty row is provisioned server-side on signup; clients may not write
   * to `loyalty_points`. A missing row therefore reads as a zeroed balance.
   */
  async balance(userId: string): Promise<LoyaltyBalance> {
    const row = await unwrapMaybe<LoyaltyBalance>(
      SCOPE,
      supabase
        .from("loyalty_points")
        .select("total_points, lifetime_points, tier")
        .eq("user_id", userId)
        .single(),
    );
    return row ?? EMPTY_BALANCE;
  },

  async transactions(userId: string, limit = 20): Promise<PointsTransaction[]> {
    return unwrapList<PointsTransaction>(
      SCOPE,
      supabase
        .from("points_transactions")
        .select("id, points, transaction_type, description, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit)
        .returns<PointsTransaction[]>(),
    );
  },

  async award(
    amount: number,
    description: string,
    bookingId?: string,
  ): Promise<void> {
    const { error } = await supabase.rpc("award_loyalty_points", {
      p_amount: amount,
      p_description: description,
      p_booking_id: bookingId || null,
    });
    if (error) throw error;
  },

  async redeem(points: number, description: string): Promise<void> {
    const { error } = await supabase.rpc("redeem_loyalty_points", {
      p_points: points,
      p_description: description,
    });
    if (error) throw error;
  },
};
