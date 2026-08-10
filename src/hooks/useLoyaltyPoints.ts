import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  useLoyaltyBalance,
  useLoyaltyTransactions,
  loyaltyRepository,
  qk,
  type LoyaltyBalance,
} from '@/data';

const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 500,
  gold: 2000,
  platinum: 5000,
} as const;

/**
 * Thin view-model over the loyalty repository. All I/O and caching live in the
 * data layer; this hook only owns presentation rules (tiers, discounts).
 */
export function useLoyaltyPoints() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const balanceQuery = useLoyaltyBalance(user?.id);
  const transactionsQuery = useLoyaltyTransactions(user?.id);

  const points: LoyaltyBalance | null = user ? balanceQuery.data ?? null : null;
  const transactions = user ? transactionsQuery.data ?? [] : [];
  const loading = Boolean(user) && (balanceQuery.isLoading || transactionsQuery.isLoading);

  const refreshPoints = async () => {
    await queryClient.invalidateQueries({ queryKey: qk.loyalty.all });
  };

  const calculateTier = (lifetimePoints: number): keyof typeof TIER_THRESHOLDS => {
    if (lifetimePoints >= TIER_THRESHOLDS.platinum) return 'platinum';
    if (lifetimePoints >= TIER_THRESHOLDS.gold) return 'gold';
    if (lifetimePoints >= TIER_THRESHOLDS.silver) return 'silver';
    return 'bronze';
  };

  const getNextTier = () => {
    if (!points) return null;
    const currentLifetime = points.lifetime_points;

    if (currentLifetime < TIER_THRESHOLDS.silver) {
      return { tier: 'Silver', pointsNeeded: TIER_THRESHOLDS.silver - currentLifetime };
    }
    if (currentLifetime < TIER_THRESHOLDS.gold) {
      return { tier: 'Gold', pointsNeeded: TIER_THRESHOLDS.gold - currentLifetime };
    }
    if (currentLifetime < TIER_THRESHOLDS.platinum) {
      return { tier: 'Platinum', pointsNeeded: TIER_THRESHOLDS.platinum - currentLifetime };
    }
    return null;
  };

  const earnPoints = async (amount: number, description: string, bookingId?: string) => {
    if (!user) return false;
    try {
      await loyaltyRepository.award(amount, description, bookingId);
      await refreshPoints();
      return true;
    } catch (error) {
      console.error('Error earning points:', error);
      return false;
    }
  };

  const redeemPoints = async (pointsToRedeem: number, description: string) => {
    if (!user || !points || points.total_points < pointsToRedeem) return false;
    try {
      await loyaltyRepository.redeem(pointsToRedeem, description);
      await refreshPoints();
      return true;
    } catch (error) {
      console.error('Error redeeming points:', error);
      return false;
    }
  };

  // 10 points = ₹1 discount
  const getDiscountValue = (pointsUsed: number) => Math.floor(pointsUsed / 10);

  return {
    points,
    transactions,
    loading,
    earnPoints,
    redeemPoints,
    getNextTier,
    calculateTier,
    getDiscountValue,
    TIER_THRESHOLDS,
    refreshPoints,
  };
}
