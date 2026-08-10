/**
 * Deterministic fixtures for the E2E booking flow.
 * Shapes mirror `src/types/database.ts` and the embedded PostgREST selects
 * used by the booking, confirmation and history pages.
 */

export const USER_ID = '11111111-1111-4111-8111-111111111111';
export const SHOWTIME_ID = '22222222-2222-4222-8222-222222222222';
export const SCREEN_ID = '33333333-3333-4333-8333-333333333333';
export const MOVIE_ID = '44444444-4444-4444-8444-444444444444';
export const BOOKING_ID = '55555555-5555-4555-8555-555555555555';

export const TEST_EMAIL = 'e2e.moviegoer@example.com';
export const TEST_PASSWORD = 'CineBook-e2e-pass-1';

const NOW = new Date();
const showDate = new Date(NOW.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

export const movie = {
  id: MOVIE_ID,
  tmdb_id: 550,
  title: 'The Midnight Reel',
  description: 'An E2E fixture film about deterministic tests.',
  poster_url: '/placeholder.svg',
  backdrop_url: '/placeholder.svg',
  duration_minutes: 128,
  rating: 8.1,
  genre: ['Drama'],
  cast_members: ['A. Tester'],
  director: 'CI Runner',
  release_date: '2026-01-01',
  status: 'now_showing',
  trailer_key: null,
  created_at: NOW.toISOString(),
  updated_at: NOW.toISOString(),
};

export const theatre = {
  id: '66666666-6666-4666-8666-666666666666',
  name: 'CineBook Central',
  location: 'Test City',
  created_at: NOW.toISOString(),
};

export const screen = {
  id: SCREEN_ID,
  theatre_id: theatre.id,
  name: 'Screen 1',
  total_seats: 18,
  created_at: NOW.toISOString(),
  theatre,
};

export const showtime = {
  id: SHOWTIME_ID,
  movie_id: MOVIE_ID,
  screen_id: SCREEN_ID,
  show_date: showDate,
  show_time: '19:30:00',
  created_at: NOW.toISOString(),
  movie,
  screen,
};

const ROWS = ['A', 'B', 'C'] as const;
const TYPE_BY_ROW: Record<string, { seat_type: string; price: number }> = {
  A: { seat_type: 'regular', price: 200 },
  B: { seat_type: 'premium', price: 350 },
  C: { seat_type: 'vip', price: 500 },
};

export const seats = ROWS.flatMap((row) =>
  Array.from({ length: 6 }, (_, i) => ({
    id: `seat-${row}${i + 1}`,
    screen_id: SCREEN_ID,
    row_label: row,
    seat_number: i + 1,
    ...TYPE_BY_ROW[row],
    created_at: NOW.toISOString(),
  }))
);

/** Seat the test always picks. */
export const TARGET_SEAT = seats[0]; // A1, regular, ₹200

export const concessionItems = [
  {
    id: 'concession-popcorn',
    name: 'Salted Popcorn',
    description: 'Large tub',
    category: 'snacks',
    price: 250,
    image_url: null,
    is_available: true,
    created_at: NOW.toISOString(),
  },
];

export const booking = {
  id: BOOKING_ID,
  user_id: USER_ID,
  showtime_id: SHOWTIME_ID,
  total_amount: TARGET_SEAT.price,
  booking_status: 'confirmed',
  payment_reference: 'cs_test_e2e_session',
  created_at: NOW.toISOString(),
  showtime,
  booked_seats: [
    {
      id: 'booked-seat-1',
      booking_id: BOOKING_ID,
      seat_id: TARGET_SEAT.id,
      showtime_id: SHOWTIME_ID,
      created_at: NOW.toISOString(),
      seat: TARGET_SEAT,
    },
  ],
};
