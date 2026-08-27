import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ---- Auth required: this endpoint must never be an open email relay ----
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }
    const token = authHeader.replace("Bearer ", "");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData.user;
    if (!user?.email) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    const { bookingId } = await req.json();
    if (typeof bookingId !== "string" || !UUID_RE.test(bookingId)) {
      throw new Error("Invalid booking id");
    }

    // ---- All content is derived server-side from the caller's own booking ----
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: booking, error } = await supabaseAdmin
      .from("bookings")
      .select(
        `id, user_id, total_amount,
         showtime:showtimes(show_date, show_time, movie:movies(title), screen:screens(name, theatre:theatres(name))),
         booked_seats(seat:seats(row_label, seat_number))`,
      )
      .eq("id", bookingId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;
    if (!booking) {
      return new Response(
        JSON.stringify({ success: false, error: "Booking not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    const st: any = booking.showtime;
    const movieTitle = st?.movie?.title ?? "Your movie";
    const showDate = st?.show_date ?? "";
    const showTime = st?.show_time ?? "";
    const screenName = st?.screen?.name ?? "";
    const theatreName = st?.screen?.theatre?.name ?? "";
    const seatsList = ((booking as any).booked_seats ?? [])
      .map((b: any) => `${b.seat?.row_label ?? ""}${b.seat?.seat_number ?? ""}`)
      .join(", ");
    const totalAmount = Number(booking.total_amount ?? 0);
    const bookingRef = booking.id.slice(0, 8).toUpperCase();
    const email = user.email; // always the authenticated user's address

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "CineMagic <onboarding@resend.dev>",
        to: [email],
        subject: `Your Ticket for ${movieTitle} - Booking ${bookingRef}`,
        html: `
          <!DOCTYPE html>
          <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,sans-serif;background-color:#0a0a0a;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#0a0a0a;">
              <tr><td style="padding:40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin:0 auto;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:16px;overflow:hidden;">
                  <tr><td style="padding:30px;text-align:center;background:linear-gradient(135deg,#ff416c 0%,#ff4b2b 100%);">
                    <h1 style="margin:0;color:#fff;font-size:28px;font-weight:bold;">🎬 CineMagic</h1>
                    <p style="margin:10px 0 0;color:rgba(255,255,255,.9);font-size:14px;">Your ticket is confirmed!</p>
                  </td></tr>
                  <tr><td style="padding:30px;text-align:center;border-bottom:1px dashed rgba(255,255,255,.2);">
                    <p style="margin:0 0 8px;color:rgba(255,255,255,.6);font-size:12px;letter-spacing:1px;text-transform:uppercase;">Booking Reference</p>
                    <p style="margin:0;color:#ff416c;font-size:32px;font-weight:bold;font-family:monospace;letter-spacing:3px;">${esc(bookingRef)}</p>
                  </td></tr>
                  <tr><td style="padding:30px;">
                    <h2 style="margin:0 0 20px;color:#fff;font-size:24px;text-align:center;">${esc(movieTitle)}</h2>
                    <table role="presentation" width="100%"><tr>
                      <td width="50%" style="padding:15px;background:rgba(255,255,255,.05);border-radius:8px;">
                        <p style="margin:0 0 5px;color:rgba(255,255,255,.6);font-size:12px;">📅 DATE</p>
                        <p style="margin:0;color:#fff;font-size:16px;font-weight:600;">${esc(showDate)}</p>
                      </td><td width="10"></td>
                      <td width="50%" style="padding:15px;background:rgba(255,255,255,.05);border-radius:8px;">
                        <p style="margin:0 0 5px;color:rgba(255,255,255,.6);font-size:12px;">🕐 TIME</p>
                        <p style="margin:0;color:#fff;font-size:16px;font-weight:600;">${esc(showTime)}</p>
                      </td>
                    </tr></table>
                    <table role="presentation" width="100%" style="margin-top:15px;"><tr>
                      <td style="padding:15px;background:rgba(255,255,255,.05);border-radius:8px;">
                        <p style="margin:0 0 5px;color:rgba(255,255,255,.6);font-size:12px;">📍 VENUE</p>
                        <p style="margin:0;color:#fff;font-size:16px;font-weight:600;">${esc(theatreName)}</p>
                        <p style="margin:5px 0 0;color:rgba(255,255,255,.6);font-size:14px;">${esc(screenName)}</p>
                      </td>
                    </tr></table>
                    <table role="presentation" width="100%" style="margin-top:15px;"><tr>
                      <td style="padding:15px;background:rgba(255,255,255,.05);border-radius:8px;">
                        <p style="margin:0 0 5px;color:rgba(255,255,255,.6);font-size:12px;">💺 SEATS</p>
                        <p style="margin:0;color:#ff416c;font-size:18px;font-weight:bold;">${esc(seatsList)}</p>
                      </td>
                    </tr></table>
                  </td></tr>
                  <tr><td style="padding:0 30px 30px;">
                    <table role="presentation" width="100%" style="background:linear-gradient(135deg,#ff416c 0%,#ff4b2b 100%);border-radius:8px;"><tr>
                      <td style="padding:20px;text-align:center;">
                        <p style="margin:0 0 5px;color:rgba(255,255,255,.8);font-size:14px;">Total Amount Paid</p>
                        <p style="margin:0;color:#fff;font-size:28px;font-weight:bold;">₹${totalAmount.toFixed(2)}</p>
                      </td>
                    </tr></table>
                  </td></tr>
                  <tr><td style="padding:20px 30px;background:rgba(0,0,0,.3);text-align:center;">
                    <p style="margin:0;color:rgba(255,255,255,.4);font-size:12px;">Thank you for choosing CineMagic! 🎬</p>
                  </td></tr>
                </table>
              </td></tr>
            </table>
          </body></html>
        `,
      }),
    });

    const data = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", data);
      if (
        data.name === "validation_error" &&
        data.message?.includes("only send testing emails")
      ) {
        return new Response(
          JSON.stringify({
            success: true,
            warning:
              "Email delivery limited in test mode. Verify a domain for production.",
            testMode: true,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          },
        );
      }
      throw new Error("Failed to send email");
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error sending ticket email:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to send email",
        emailFailed: true,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }
};

serve(handler);
