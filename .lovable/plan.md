## Goal

Ship a production-grade seat reservation & booking system with race-safe locks, realtime updates, and lazy cleanup — no cron jobs.

## Architecture Overview

```
User clicks seat
      │
      ▼
Edge Function: lock-seat  ──►  INSERT into seat_locks (unique on show_id,seat_id)
      │                              │
      │                              ├─ success → Realtime broadcasts → other users see "locked"
      │                              └─ conflict → "Seat just reserved"
      ▼
Payment (Stripe) succeeds
      │
      ▼
Edge Function: verify-booking-payment (existing, extended)
      │
      ├─ TRANSACTION:
      │    - INSERT bookings + booked_seats  (unique on show_id,seat_id)
      │    - DELETE from seat_locks
      └─ Realtime broadcasts → all users see "booked"
```

## Step 1 — Database Migration

Create `seat_locks` table + tighten existing constraints. All done in one migration:

- **`seat_locks`**: `id, showtime_id, seat_id, user_id, locked_at, expires_at`
  - `UNIQUE(showtime_id, seat_id)` — race-condition guard
  - Index on `expires_at` for cleanup
- **`booked_seats`**: add `UNIQUE(showtime_id, seat_id)` (may already partially exist — will use `IF NOT EXISTS` guard)
- **RLS on `seat_locks`**:
  - `SELECT`: anyone authenticated (needed to display "locked" state)
  - `INSERT`: only own `user_id`, only if not expired
  - `DELETE`: only own lock, OR expired lock (so cleanup works from client)
- **GRANTs**: `SELECT, INSERT, DELETE` to `authenticated`; `ALL` to `service_role`
- **Realtime**: `ALTER PUBLICATION supabase_realtime ADD TABLE seat_locks, booked_seats`
- **RPC `acquire_seat_locks(showtime_id, seat_ids[])`** — SECURITY DEFINER:
  - Deletes expired locks for that showtime
  - Attempts atomic bulk insert of new locks for `auth.uid()`
  - Returns which seats succeeded and which failed
- **RPC `release_seat_locks(showtime_id, seat_ids[])`** — deletes only current user's locks
- **RPC `cleanup_showtime_if_ended(showtime_id)`** — if showtime end time passed, deletes seat_locks for that showtime

## Step 2 — Edge Functions

- **`lock-seats`** (new): validates JWT, calls `acquire_seat_locks` RPC, returns result
- **`release-seats`** (new): calls `release_seat_locks`
- **`verify-booking-payment`** (extend existing): after successful `booked_seats` insert, delete matching `seat_locks` rows for that user

Client-side lock/release RPC could work too, but edge functions give clean server-side validation and future retry logic.

## Step 3 — React Hooks

- **`useSeatLocks(showtimeId)`**:
  - Subscribes to Realtime on `seat_locks` + `booked_seats` filtered by `showtime_id`
  - Returns `{ locks: Map<seatId, { userId, expiresAt }>, bookedSeatIds: Set<string> }`
  - On mount: calls `cleanup_showtime_if_ended` + fetches current locks/bookings
- **`useSeatReservation(showtimeId)`**:
  - `reserve(seatIds)` → calls `lock-seats` edge function
  - `release(seatIds)` → calls `release-seats`
  - Registers `beforeunload` + route change listeners to auto-release
  - Exposes countdown timer state (uses earliest `expires_at` from user's own locks)

## Step 4 — UI Updates in `SeatSelection.tsx`

- Three seat states via color:
  - Available (default)
  - Mine-locked (accent color, selectable to deselect)
  - Others-locked (grey, disabled)
  - Booked (destructive/dark, disabled)
- On seat click → optimistic UI → `reserve([seatId])`; on failure rollback + toast "Sorry, this seat was just reserved by another customer."
- Timer bar shows `mm:ss` until earliest lock expires; on expiry: release + toast + refetch
- Cleanup on unmount: release all active user locks (unless payment initiated)

## Step 5 — Booking Flow Integration

- `Booking.tsx`: pass selected seats to Stripe checkout as today; DO NOT release locks when navigating to Stripe (mark `paymentInitiated` flag)
- `create-booking-payment`: validate that all selected seats are still locked by this user before creating Stripe session
- `verify-booking-payment`: inside existing transaction, also `DELETE FROM seat_locks WHERE showtime_id=? AND seat_id IN (...) AND user_id=?`

## Step 6 — Lazy Cleanup

- On seat page open → `acquire_seat_locks` RPC internally purges expired for that showtime
- On any lock/release/book → same purge at RPC start
- `cleanup_showtime_if_ended` called on seat page mount

## Step 7 — Testing Scenarios

Playwright script that:

1. Opens seat page as user A, locks seat A1
2. Opens second context as user B, verifies A1 shows as unavailable
3. User B tries to lock A1 → expects toast error
4. User A closes tab → seat A1 releases (via beforeunload)
5. Verify booked_seats unique constraint by attempting duplicate insert via SQL

## Files

**New:**

- `supabase/migrations/<ts>_seat_locks.sql`
- `supabase/functions/lock-seats/index.ts`
- `supabase/functions/release-seats/index.ts`
- `src/hooks/useSeatLocks.ts`
- `src/hooks/useSeatReservation.ts`

**Modified:**

- `src/components/booking/SeatSelection.tsx` — 3-state colors, realtime, optimistic UI, timer wiring
- `src/pages/Booking.tsx` — mark payment-initiated so unmount doesn't release
- `supabase/functions/create-booking-payment/index.ts` — validate locks before session
- `supabase/functions/verify-booking-payment/index.ts` — delete locks in same transaction
- `supabase/config.toml` — register new functions with `verify_jwt = false` (JWT validated in code)

## Note

This is a big change. I'll ship it in this order across turns:

1. Migration + RPCs (requires your approval)
2. Edge functions + hooks
3. UI wiring + timer
4. Playwright test pass

Confirm and I'll start with the migration.
