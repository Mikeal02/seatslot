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
    // Auth is optional (the session can expire during Stripe checkout), but when
    // present it must match the Stripe session owner.
    let user = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseClient.auth.getUser(token);
      user = userData.user;
    }

    const { sessionId } = await req.json();
    if (typeof sessionId !== "string" || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) {
      throw new Error("Invalid session ID");
    }

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

    const userId = session.metadata?.user_id;
    if (!userId) throw new Error("Invalid session metadata");
    if (user && userId !== user.id) throw new Error("Unauthorized");

    const showtimeId = session.metadata!.showtime_id;
    const seatIds: string[] = JSON.parse(session.metadata!.seat_ids);
    const totalAmount = parseFloat(session.metadata!.total_amount);
    const concessionTotal = parseFloat(session.metadata!.concession_total || "0");
    const concessionItems = JSON.parse(session.metadata!.concession_items || "[]");

    // Idempotency: one booking per Stripe session, enforced by a unique index.
    const paymentReference = session.id;

    const { data: existing } = await supabaseAdmin
      .from("bookings")
      .select("id")
      .eq("payment_reference", paymentReference)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ success: true, bookingId: existing.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const { data: bookingData, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .insert({
        user_id: userId,
        showtime_id: showtimeId,
        total_amount: totalAmount,
        booking_status: "confirmed",
        payment_reference: paymentReference,
      })
      .select()
      .single();

    if (bookingError) {
      // Unique violation => another concurrent verify already created it
      if ((bookingError as any).code === "23505") {
        const { data: dupe } = await supabaseAdmin
          .from("bookings")
          .select("id")
          .eq("payment_reference", paymentReference)
          .maybeSingle();
        if (dupe) {
          return new Response(JSON.stringify({ success: true, bookingId: dupe.id }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      }
      throw bookingError;
    }

    const bookedSeatsData = seatIds.map((seatId: string) => ({
      booking_id: bookingData.id,
      seat_id: seatId,
      showtime_id: showtimeId,
    }));

    const { error: seatsError } = await supabaseAdmin
      .from("booked_seats")
      .insert(bookedSeatsData);

    if (seatsError) {
      await supabaseAdmin.from("bookings").delete().eq("id", bookingData.id);
      throw new Error("Some seats were already booked. Payment will be refunded.");
    }

    await supabaseAdmin
      .from("seat_locks")
      .delete()
      .eq("showtime_id", showtimeId)
      .in("seat_id", seatIds);

    if (concessionItems.length > 0 && concessionTotal > 0) {
      const { data: concessionOrder } = await supabaseAdmin
        .from("concession_orders")
        .insert({
          booking_id: bookingData.id,
          user_id: userId,
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

    return new Response(JSON.stringify({ success: true, bookingId: bookingData.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("verify-booking-payment error:", msg);
    return new Response(JSON.stringify({ success: false, error: "Could not verify payment" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
