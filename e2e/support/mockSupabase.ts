import type { Page, Route } from "@playwright/test";
import {
  USER_ID,
  TEST_EMAIL,
  BOOKING_ID,
  booking,
  concessionItems,
  seats,
  showtime,
} from "./fixtures";

/**
 * Intercepts every Supabase call (auth, PostgREST, RPC, edge functions) so the
 * booking flow is fully deterministic and never reaches a real backend.
 */

function b64url(value: object) {
  return Buffer.from(JSON.stringify(value))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fakeJwt() {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60;
  return [
    b64url({ alg: "HS256", typ: "JWT" }),
    b64url({
      sub: USER_ID,
      email: TEST_EMAIL,
      role: "authenticated",
      exp,
      aud: "authenticated",
    }),
    "e2e-signature",
  ].join(".");
}

const user = {
  id: USER_ID,
  aud: "authenticated",
  role: "authenticated",
  email: TEST_EMAIL,
  email_confirmed_at: new Date().toISOString(),
  user_metadata: { full_name: "E2E Moviegoer" },
  app_metadata: { provider: "email" },
  created_at: new Date().toISOString(),
};

function session() {
  return {
    access_token: fakeJwt(),
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: "e2e-refresh-token",
    user,
  };
}

export interface MockState {
  /** Seat ids already permanently booked by someone else. */
  bookedSeatIds: string[];
  /** Seat ids temporarily locked by another user. */
  lockedByOthers: string[];
  /** Bookings visible in booking history / confirmation. */
  bookings: unknown[];
  /** Set when the checkout edge function is called. */
  checkoutCalls: number;
  /** Seat ids the client successfully locked. */
  lockedByMe: string[];
}

function json(
  route: Route,
  body: unknown,
  extraHeaders: Record<string, string> = {},
) {
  return route.fulfill({
    status: 200,
    contentType: "application/json",
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "*",
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  });
}

export async function installSupabaseMock(
  page: Page,
  baseURL: string,
): Promise<MockState> {
  const state: MockState = {
    bookedSeatIds: [],
    lockedByOthers: [],
    bookings: [booking],
    checkoutCalls: 0,
    lockedByMe: [],
  };

  // --- Auth -----------------------------------------------------------------
  await page.route("**/auth/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (route.request().method() === "OPTIONS") return json(route, {});
    if (path.endsWith("/logout"))
      return route.fulfill({ status: 204, body: "" });
    if (path.endsWith("/user")) return json(route, user);
    return json(route, session());
  });

  // --- Edge functions -------------------------------------------------------
  await page.route("**/functions/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (route.request().method() === "OPTIONS") return json(route, {});

    if (path.endsWith("create-booking-payment")) {
      state.checkoutCalls += 1;
      // Stand-in for the Stripe Checkout URL: sends the browser to the same
      // success route Stripe is configured to return to.
      return json(route, {
        url: `${baseURL}/payment-success?session_id=cs_test_e2e_session`,
      });
    }

    if (path.endsWith("verify-booking-payment")) {
      state.bookedSeatIds = Array.from(
        new Set([...state.bookedSeatIds, ...state.lockedByMe]),
      );
      return json(route, { success: true, bookingId: BOOKING_ID });
    }

    return json(route, {});
  });

  // --- PostgREST (tables + RPC) --------------------------------------------
  await page.route("**/rest/v1/**", async (route) => {
    const request = route.request();
    if (request.method() === "OPTIONS") return json(route, {});

    const url = new URL(request.url());
    const resource = url.pathname.replace(/^.*\/rest\/v1\//, "");
    const wantsSingle = (request.headers()["accept"] ?? "").includes(
      "pgrst.object",
    );
    const isHead = request.method() === "HEAD";

    if (resource.startsWith("rpc/")) {
      const fn = resource.slice(4);
      const body = request.postDataJSON?.() ?? {};

      if (fn === "acquire_seat_locks") {
        const ids: string[] = body.p_seat_ids ?? [];
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
        const rows = ids.map((seat_id) => {
          const taken =
            state.bookedSeatIds.includes(seat_id) ||
            state.lockedByOthers.includes(seat_id);
          if (!taken)
            state.lockedByMe = Array.from(
              new Set([...state.lockedByMe, seat_id]),
            );
          return {
            seat_id,
            success: !taken,
            reason: taken
              ? state.bookedSeatIds.includes(seat_id)
                ? "already_booked"
                : "locked_by_other"
              : null,
            expires_at: taken ? null : expiresAt,
          };
        });
        return json(route, rows);
      }

      if (fn === "release_seat_locks") {
        const ids: string[] = body.p_seat_ids ?? [];
        state.lockedByMe = state.lockedByMe.filter((id) => !ids.includes(id));
        return json(route, null);
      }

      if (fn === "get_movie_reviews") return json(route, []);
      return json(route, null);
    }

    const table = resource.split("?")[0];
    let rows: unknown[] = [];

    switch (table) {
      case "showtimes":
        rows = [showtime];
        break;
      case "seats":
        rows = seats;
        break;
      case "concession_items":
        rows = concessionItems;
        break;
      case "booked_seats":
        rows = state.bookedSeatIds.map((seat_id, i) => ({
          id: `booked-${i}`,
          seat_id,
          showtime_id: showtime.id,
        }));
        break;
      case "seat_locks":
        rows = state.lockedByOthers.map((seat_id) => ({
          seat_id,
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          user_id: "someone-else",
        }));
        break;
      case "bookings":
        rows = state.bookings;
        break;
      case "user_roles":
        rows = [];
        break;
      default:
        rows = [];
    }

    const headers = {
      "content-range": `0-${Math.max(rows.length - 1, 0)}/${rows.length}`,
    };

    if (isHead) {
      return route.fulfill({
        status: 200,
        headers: { ...headers, "access-control-allow-origin": "*" },
        body: "",
      });
    }

    return json(route, wantsSingle ? (rows[0] ?? null) : rows, headers);
  });

  // Block anything else that would leave the sandbox (TMDB images, etc.).
  await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (route) =>
    route.fulfill({
      status: 200,
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg"/>',
    }),
  );

  return state;
}

/** Signs in through the real UI against the mocked auth endpoint. */
export async function signIn(page: Page, email: string, password: string) {
  await page.goto("/auth");
  await page.getByLabel("Email", { exact: true }).first().fill(email);
  await page.locator("#signin-password").fill(password);
  await page
    .getByRole("button", { name: /sign in/i })
    .last()
    .click();
  await page.waitForURL((url) => !url.pathname.startsWith("/auth"), {
    timeout: 20_000,
  });
}
