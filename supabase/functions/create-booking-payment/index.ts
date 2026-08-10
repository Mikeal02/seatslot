import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const body = await req.json();
    const showtimeId: string = body.showtimeId;
    const seatIds: string[] = Array.isArray(body.selectedSeats)
      ? body.selectedSeats.map((s: any) => (typeof s === "string" ? s : s?.id))
      : [];
    const clientOrigin: string | undefined = body.origin;
    const concessionsIn: { id: string; quantity: number }[] = Array.isArray(body.concessions?.items)
      ? body.concessions.items
      : [];

    // ---- Input validation -------------------------------------------------
    if (!showtimeId || !UUID_RE.test(showtimeId)) throw new Error("Invalid showtime");
    if (seatIds.length === 0 || seatIds.length > 10) throw new Error("Select between 1 and 10 seats");
    if (!seatIds.every((id) => typeof id === "string" && UUID_RE.test(id))) {
      throw new Error("Invalid seat selection");
    }
    const uniqueSeatIds = [...new Set(seatIds)];

    // ---- Showtime + movie (server truth) ----------------------------------
    const { data: showtime, error: showtimeErr } = await supabaseAdmin
      .from("showtimes")
      .select("id, screen_id, show_date, show_time, movies(title)")
      .eq("id", showtimeId)
      .single();
    if (showtimeErr || !showtime) throw new Error("Showtime not found");

    // ---- Seats belong to this screen + server-side pricing ----------------
    const { data: seats, error: seatsErr } = await supabaseAdmin
      .from("seats")
      .select("id, row_label, seat_number, seat_type, price, screen_id")
      .in("id", uniqueSeatIds);
    if (seatsErr) throw seatsErr;
    if (!seats || seats.length !== uniqueSeatIds.length) throw new Error("Invalid seat selection");
    if (seats.some((s) => s.screen_id !== showtime.screen_id)) {
      throw new Error("Seats do not belong to this showtime");
    }

    // ---- Seats must not already be booked ---------------------------------
    const { data: alreadyBooked } = await supabaseAdmin
      .from("booked_seats")
      .select("seat_id")
      .eq("showtime_id", showtimeId)
      .in("seat_id", uniqueSeatIds);
    if (alreadyBooked && alreadyBooked.length > 0) {
      throw new Error("Some of the selected seats are already booked");
    }

    // ---- Seats must be locked by THIS user and not expired ----------------
    const { data: locks } = await supabaseAdmin
      .from("seat_locks")
      .select("seat_id, user_id, expires_at")
      .eq("showtime_id", showtimeId)
      .in("seat_id", uniqueSeatIds);
    const now = Date.now();
    const heldByUser = new Set(
      (locks ?? [])
        .filter((l) => l.user_id === user.id && new Date(l.expires_at).getTime() > now)
        .map((l) => l.seat_id)
    );
    if (uniqueSeatIds.some((id) => !heldByUser.has(id))) {
      throw new Error("Your seat reservation expired. Please reselect your seats.");
    }

    // ---- Concessions priced from the database -----------------------------
    let concessionTotal = 0;
    const concessionLines: { id: string; name: string; quantity: number; price: number }[] = [];
    if (concessionsIn.length > 0) {
      const ids = concessionsIn
        .map((c) => c.id)
        .filter((id) => typeof id === "string" && UUID_RE.test(id));
      const { data: items } = await supabaseAdmin
        .from("concession_items")
        .select("id, name, price, is_available")
        .in("id", ids);
      for (const c of concessionsIn) {
        const item = items?.find((i) => i.id === c.id);
        const qty = Math.floor(Number(c.quantity));
        if (!item || !item.is_available) continue;
        if (!Number.isFinite(qty) || qty < 1 || qty > 20) continue;
        concessionTotal += Number(item.price) * qty;
        concessionLines.push({ id: item.id, name: item.name, quantity: qty, price: Number(item.price) });
      }
    }

    const seatTotal = seats.reduce((sum, s) => sum + Number(s.price), 0);
    const totalAmount = Math.round((seatTotal + concessionTotal) * 100) / 100;
    if (totalAmount <= 0) throw new Error("Invalid order total");

    const movieTitle = (showtime as any).movies?.title ?? "Movie";
    const seatDescription = seats
      .map((s) => `${s.row_label}${s.seat_number} (${s.seat_type})`)
      .join(", ");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data.length > 0 ? customers.data[0].id : undefined;

    const lineItems: any[] = [
      {
        price_data: {
          currency: "inr",
          product_data: {
            name: `${movieTitle} - Movie Tickets`,
            description: `Seats: ${seatDescription}`.slice(0, 500),
          },
          unit_amount: Math.round(seatTotal * 100),
        },
        quantity: 1,
      },
    ];

    if (concessionTotal > 0) {
      lineItems.push({
        price_data: {
          currency: "inr",
          product_data: {
            name: "Snacks & Drinks",
            description: concessionLines.map((c) => `${c.name} x${c.quantity}`).join(", ").slice(0, 500),
          },
          unit_amount: Math.round(concessionTotal * 100),
        },
        quantity: 1,
      });
    }

    // Only allow redirects back to origins we control
    const allowedOrigins = [
      "https://seatslot.lovable.app",
      "https://seatslot.netlify.app",
      "http://localhost:8080",
      "http://localhost:5173",
    ];
    const requestOrigin = req.headers.get("origin") ?? "";
    const origin =
      (clientOrigin && allowedOrigins.includes(clientOrigin) && clientOrigin) ||
      (allowedOrigins.includes(requestOrigin) && requestOrigin) ||
      allowedOrigins[0];

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/booking/${showtimeId}`,
      metadata: {
        user_id: user.id,
        showtime_id: showtimeId,
        seat_ids: JSON.stringify(uniqueSeatIds),
        total_amount: totalAmount.toString(),
        concession_total: concessionTotal.toString(),
        concession_items: JSON.stringify(concessionLines),
      },
    });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("create-booking-payment error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
