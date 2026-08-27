/**
 * Single source of truth for React Query cache keys.
 *
 * Keys are hierarchical so that a parent key invalidates every child:
 *   queryClient.invalidateQueries({ queryKey: qk.bookings.all })
 */
export const qk = {
  stats: {
    all: ["stats"] as const,
    platform: () => [...qk.stats.all, "platform"] as const,
  },
  seats: {
    all: ["seats"] as const,
    availability: (showtimeId: string, screenId: string) =>
      [...qk.seats.all, "availability", showtimeId, screenId] as const,
  },
  bookings: {
    all: ["bookings"] as const,
    byUser: (userId: string | undefined) =>
      [...qk.bookings.all, "user", userId ?? "anon"] as const,
  },
  loyalty: {
    all: ["loyalty"] as const,
    balance: (userId: string | undefined) =>
      [...qk.loyalty.all, "balance", userId ?? "anon"] as const,
    transactions: (userId: string | undefined) =>
      [...qk.loyalty.all, "transactions", userId ?? "anon"] as const,
  },
  reviews: {
    all: ["reviews"] as const,
    byMovie: (movieId: string) =>
      [...qk.reviews.all, "movie", movieId] as const,
  },
} as const;

/** Cache freshness tiers, so staleTime is a decision made once, not per call site. */
export const staleTime = {
  /** Live-ish data: seat counts, locks. */
  realtime: 15 * 1000,
  /** User-owned data that changes on user action. */
  session: 60 * 1000,
  /** Slow-moving aggregates and catalogue data. */
  static: 10 * 60 * 1000,
} as const;
