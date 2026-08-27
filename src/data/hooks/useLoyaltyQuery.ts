import { useQuery } from "@tanstack/react-query";
import { qk, staleTime } from "@/data/queryKeys";
import {
  loyaltyRepository,
  EMPTY_BALANCE,
  type LoyaltyBalance,
  type PointsTransaction,
} from "@/data/repositories/loyalty.repo";

export function useLoyaltyBalance(userId: string | undefined) {
  return useQuery<LoyaltyBalance>({
    queryKey: qk.loyalty.balance(userId),
    queryFn: () => loyaltyRepository.balance(userId as string),
    enabled: Boolean(userId),
    placeholderData: EMPTY_BALANCE,
    staleTime: staleTime.session,
  });
}

export function useLoyaltyTransactions(userId: string | undefined) {
  return useQuery<PointsTransaction[]>({
    queryKey: qk.loyalty.transactions(userId),
    queryFn: () => loyaltyRepository.transactions(userId as string),
    enabled: Boolean(userId),
    staleTime: staleTime.session,
  });
}
