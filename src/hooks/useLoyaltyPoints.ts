import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface LoyaltyPoints {
  total_points: number;
  lifetime_points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

interface PointsTransaction {
  id: string;
  points: number;
  transaction_type: 'earned' | 'redeemed' | 'bonus' | 'expired';
  description: string;
  created_at: string;
}

export function useLoyaltyPoints() {
  const { user } = useAuth();
  const [points, setPoints] = useState<LoyaltyPoints | null>(null);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const POINTS_PER_RUPEE = 1; // 1 point per ₹1 spent
  const TIER_THRESHOLDS = {
    bronze: 0,
    silver: 500,
    gold: 2000,
    platinum: 5000,
  };

  useEffect(() => {
    if (user) {
      fetchLoyaltyData();
    } else {
      setPoints(null);
      setTransactions([]);
      setLoading(false);
    }
  }, [user]);

  const fetchLoyaltyData = async () => {
    if (!user) return;

    try {
      // Fetch loyalty points
      const { data: pointsData, error: pointsError } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (pointsError && pointsError.code !== 'PGRST116') {
        throw pointsError;
      }

      if (pointsData) {
        setPoints(pointsData as LoyaltyPoints);
      } else {
        // Create initial loyalty record
        const { data: newPoints, error: createError } = await supabase
          .from('loyalty_points')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (createError) throw createError;
        setPoints(newPoints as LoyaltyPoints);
      }

      // Fetch transactions
      const { data: transData, error: transError } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (transError) throw transError;
      setTransactions(transData as PointsTransaction[]);
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTier = (lifetimePoints: number): 'bronze' | 'silver' | 'gold' | 'platinum' => {
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
    if (!user || !points) return false;

    const pointsToEarn = Math.floor(amount * POINTS_PER_RUPEE);
    const newTotal = points.total_points + pointsToEarn;
    const newLifetime = points.lifetime_points + pointsToEarn;
    const newTier = calculateTier(newLifetime);

    try {
      // Update points
      const { error: updateError } = await supabase
        .from('loyalty_points')
        .update({
          total_points: newTotal,
          lifetime_points: newLifetime,
          tier: newTier,
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Record transaction
      const { error: transError } = await supabase
        .from('points_transactions')
        .insert({
          user_id: user.id,
          points: pointsToEarn,
          transaction_type: 'earned',
          description,
          booking_id: bookingId || null,
        });

      if (transError) throw transError;

      await fetchLoyaltyData();
      return true;
    } catch (error) {
      console.error('Error earning points:', error);
      return false;
    }
  };

  const redeemPoints = async (pointsToRedeem: number, description: string) => {
    if (!user || !points || points.total_points < pointsToRedeem) return false;

    try {
      const { error: updateError } = await supabase
        .from('loyalty_points')
        .update({ total_points: points.total_points - pointsToRedeem })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      const { error: transError } = await supabase
        .from('points_transactions')
        .insert({
          user_id: user.id,
          points: -pointsToRedeem,
          transaction_type: 'redeemed',
          description,
        });

      if (transError) throw transError;

      await fetchLoyaltyData();
      return true;
    } catch (error) {
      console.error('Error redeeming points:', error);
      return false;
    }
  };

  const getDiscountValue = (pointsUsed: number) => {
    // 10 points = ₹1 discount
    return Math.floor(pointsUsed / 10);
  };

  return {
    points,
    transactions,
    loading,
    earnPoints,
    redeemPoints,
    getNextTier,
    getDiscountValue,
    TIER_THRESHOLDS,
    refreshPoints: fetchLoyaltyData,
  };
}
