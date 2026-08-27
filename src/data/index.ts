/**
 * Data layer public API.
 *
 * Components consume hooks; hooks consume repositories; repositories are the
 * only place that talks to Supabase. Nothing outside `src/data` should import
 * the Supabase client for these domains.
 */
export { qk, staleTime } from "./queryKeys";
export { DataError, sel, NIL_UUID } from "./core/query";

export {
  statsRepository,
  type PlatformCounts,
} from "./repositories/stats.repo";
export {
  seatsRepository,
  type SeatAvailability,
} from "./repositories/seats.repo";
export { bookingsRepository } from "./repositories/bookings.repo";
export {
  loyaltyRepository,
  EMPTY_BALANCE,
  type LoyaltyBalance,
  type LoyaltyTier,
  type PointsTransaction,
} from "./repositories/loyalty.repo";
export {
  reviewsRepository,
  type MovieReview,
} from "./repositories/reviews.repo";

export { usePlatformStats } from "./hooks/useStats";
export { useSeatAvailability } from "./hooks/useSeatAvailability";
export { useUserBookings, useCancelBooking } from "./hooks/useBookingsQuery";
export {
  useLoyaltyBalance,
  useLoyaltyTransactions,
} from "./hooks/useLoyaltyQuery";
export {
  useMovieReviews,
  useInvalidateMovieReviews,
} from "./hooks/useReviewsQuery";
