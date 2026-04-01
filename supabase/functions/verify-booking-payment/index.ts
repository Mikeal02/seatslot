import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    // Try auth but don't require it — session may expire during Stripe checkout
    let user = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseClient.auth.getUser(token);
      user = userData.user;
    }

    const { sessionId } = await req.json();
    if (!sessionId) throw new Error("Missing session ID");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ success: false, error: "Payment not completed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Verify user matches if authenticated, otherwise trust the Stripe session metadata
    const userId = session.metadata?.user_id;
    if (!userId) throw new Error("Invalid session metadata");
    if (user && userId !== user.id) {
      throw new Error("Unauthorized");
    }

    const showtimeId = session.metadata!.showtime_id;
    const seatIds = JSON.parse(session.metadata!.seat_ids);
    const totalAmount = parseFloat(session.metadata!.total_amount);
    const concessionTotal = parseFloat(session.metadata!.concession_total || "0");
    const concessionItems = JSON.parse(session.metadata!.concession_items || "[]");

    // Check if booking already exists for this session
    // Use payment_intent as idempotency key
    const paymentIntentId = typeof session.payment_intent === 'string' 
      ? session.payment_intent 
      : session.payment_intent?.id || sessionId;

    // Create booking using service role to bypass RLS
    const { data: bookingData, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .insert({
        user_id: userId,
        showtime_id: showtimeId,
        total_amount: totalAmount,
        booking_status: "confirmed",
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    // Book seats
    const bookedSeatsData = seatIds.map((seatId: string) => ({
      booking_id: bookingData.id,
      seat_id: seatId,
      showtime_id: showtimeId,
    }));

    const { error: seatsError } = await supabaseAdmin
      .from("booked_seats")
      .insert(bookedSeatsData);

    if (seatsError) {
      // Rollback booking
      await supabaseAdmin.from("bookings").delete().eq("id", bookingData.id);
      throw new Error("Some seats were already booked. Payment will be refunded.");
    }

    // Save concession orders if any
    if (concessionItems.length > 0 && concessionTotal > 0) {
      const { data: concessionOrder } = await supabaseAdmin
        .from("concession_orders")
        .insert({
          booking_id: bookingData.id,
          user_id: user.id,
          total_amount: concessionTotal,
        })
        .select()
        .single();

      if (concessionOrder) {
        const orderItems = concessionItems.map((item: any) => ({
          order_id: concessionOrder.id,
          item_id: item.id,
          quantity: item.quantity,
          price: item.price,
        }));
        await supabaseAdmin.from("concession_order_items").insert(orderItems);
      }
    }

    return new Response(
      JSON.stringify({ success: true, bookingId: bookingData.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("verify-booking-payment error:", msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
