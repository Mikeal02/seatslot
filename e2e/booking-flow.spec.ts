import { expect, test } from '@playwright/test';
import { installSupabaseMock, signIn } from './support/mockSupabase';
import {
  SHOWTIME_ID,
  BOOKING_ID,
  TARGET_SEAT,
  TEST_EMAIL,
  TEST_PASSWORD,
  movie,
  seats,
} from './support/fixtures';

const seatName = (seat: { row_label: string; seat_number: number }) =>
  new RegExp(`^${seat.row_label}${seat.seat_number},`);

test.describe('Booking flow', () => {
  test('select seats, pay, land on the confirmed ticket, and see it in history', async ({
    page,
    baseURL,
  }) => {
    const state = await installSupabaseMock(page, baseURL!);
    await signIn(page, TEST_EMAIL, TEST_PASSWORD);

    // --- Seat selection -----------------------------------------------------
    await page.goto(`/booking/${SHOWTIME_ID}`);
    await expect(page.locator('h1', { hasText: movie.title })).toBeVisible();

    const seatButton = page.getByRole('button', { name: seatName(TARGET_SEAT) });
    await seatButton.click();
    await expect
      .poll(() => state.lockedByMe, { message: 'seat should be locked server-side' })
      .toContain(TARGET_SEAT.id);

    // Reservation countdown appears once a seat is held.
    await expect(page.getByText(/^\d{1,2}:\d{2}$/).first()).toBeVisible();

    // --- Extras + review ----------------------------------------------------
    await page.getByRole('button', { name: /continue/i }).click();
    await page.getByRole('button', { name: /continue/i }).click();
    await expect(page.getByRole('heading', { name: /review & pay/i })).toBeVisible();
    await expect(page.getByText(`₹${TARGET_SEAT.price}`).first()).toBeVisible();

    // --- Payment ------------------------------------------------------------
    await page.getByRole('button', { name: /^Pay ₹/ }).click();
    await page.waitForURL(/\/booking-confirmation\//, { timeout: 30_000 });
    expect(state.checkoutCalls).toBe(1);

    // --- Confirmation -------------------------------------------------------
    await expect(page.getByRole('heading', { name: /booking confirmed/i })).toBeVisible();
    await expect(page.getByText(BOOKING_ID.slice(0, 8), { exact: false }).first()).toBeVisible();
    await expect(page.getByText(movie.title).first()).toBeVisible();

    // --- History ------------------------------------------------------------
    await page.goto('/bookings');
    await expect(page.getByRole('heading', { name: /my bookings/i })).toBeVisible();
    await expect(page.getByText(movie.title).first()).toBeVisible();
    await expect(page.getByText(/confirmed/i).first()).toBeVisible();
  });

  test('seats booked by someone else cannot be selected', async ({ page, baseURL }) => {
    const state = await installSupabaseMock(page, baseURL!);
    state.bookedSeatIds = [seats[1].id];
    state.lockedByOthers = [seats[2].id];

    await signIn(page, TEST_EMAIL, TEST_PASSWORD);
    await page.goto(`/booking/${SHOWTIME_ID}`);
    await expect(page.locator('h1', { hasText: movie.title })).toBeVisible();

    await expect(page.getByRole('button', { name: seatName(seats[1]) })).toBeDisabled();
    await expect(page.getByRole('button', { name: seatName(seats[2]) })).toBeDisabled();
    await expect(page.getByRole('button', { name: seatName(seats[3]) })).toBeEnabled();
  });

  test('booking history is gated behind authentication', async ({ page, baseURL }) => {
    await installSupabaseMock(page, baseURL!);
    await page.goto('/bookings');
    await page.waitForURL(/\/auth/, { timeout: 20_000 });
    await expect(page.getByRole('button', { name: /sign in/i }).last()).toBeVisible();
  });
});
