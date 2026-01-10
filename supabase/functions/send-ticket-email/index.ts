import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TicketEmailRequest {
  email: string;
  bookingId: string;
  movieTitle: string;
  showDate: string;
  showTime: string;
  theatreName: string;
  screenName: string;
  seats: string[];
  totalAmount: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      email, 
      bookingId, 
      movieTitle, 
      showDate, 
      showTime, 
      theatreName, 
      screenName, 
      seats, 
      totalAmount 
    }: TicketEmailRequest = await req.json();

    const seatsList = seats.join(', ');
    const bookingRef = bookingId.slice(0, 8).toUpperCase();

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
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0a0a0a;">
              <tr>
                <td style="padding: 40px 20px;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 30px; text-align: center; background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%);">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">🎬 CineMagic</h1>
                        <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Your ticket is confirmed!</p>
                      </td>
                    </tr>
                    
                    <!-- Booking Reference -->
                    <tr>
                      <td style="padding: 30px; text-align: center; border-bottom: 1px dashed rgba(255,255,255,0.2);">
                        <p style="margin: 0 0 8px 0; color: rgba(255,255,255,0.6); font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Booking Reference</p>
                        <p style="margin: 0; color: #ff416c; font-size: 32px; font-weight: bold; font-family: monospace; letter-spacing: 3px;">${bookingRef}</p>
                      </td>
                    </tr>
                    
                    <!-- Movie Details -->
                    <tr>
                      <td style="padding: 30px;">
                        <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 24px; font-weight: bold; text-align: center;">${movieTitle}</h2>
                        
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          <tr>
                            <td width="50%" style="padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-right: 10px;">
                              <p style="margin: 0 0 5px 0; color: rgba(255,255,255,0.6); font-size: 12px;">📅 DATE</p>
                              <p style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 600;">${showDate}</p>
                            </td>
                            <td width="10"></td>
                            <td width="50%" style="padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                              <p style="margin: 0 0 5px 0; color: rgba(255,255,255,0.6); font-size: 12px;">🕐 TIME</p>
                              <p style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 600;">${showTime}</p>
                            </td>
                          </tr>
                        </table>
                        
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 15px;">
                          <tr>
                            <td style="padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                              <p style="margin: 0 0 5px 0; color: rgba(255,255,255,0.6); font-size: 12px;">📍 VENUE</p>
                              <p style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 600;">${theatreName}</p>
                              <p style="margin: 5px 0 0 0; color: rgba(255,255,255,0.6); font-size: 14px;">${screenName}</p>
                            </td>
                          </tr>
                        </table>
                        
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 15px;">
                          <tr>
                            <td style="padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                              <p style="margin: 0 0 5px 0; color: rgba(255,255,255,0.6); font-size: 12px;">💺 SEATS</p>
                              <p style="margin: 0; color: #ff416c; font-size: 18px; font-weight: bold;">${seatsList}</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Total Amount -->
                    <tr>
                      <td style="padding: 0 30px 30px 30px;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%); border-radius: 8px;">
                          <tr>
                            <td style="padding: 20px; text-align: center;">
                              <p style="margin: 0 0 5px 0; color: rgba(255,255,255,0.8); font-size: 14px;">Total Amount Paid</p>
                              <p style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">₹${totalAmount.toFixed(2)}</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Instructions -->
                    <tr>
                      <td style="padding: 0 30px 30px 30px; text-align: center;">
                        <p style="margin: 0; color: rgba(255,255,255,0.6); font-size: 14px; line-height: 1.6;">
                          📱 Show this email or the QR code at the theatre counter to collect your tickets.<br>
                          Please arrive at least 15 minutes before showtime.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 20px 30px; background: rgba(0,0,0,0.3); text-align: center;">
                        <p style="margin: 0; color: rgba(255,255,255,0.4); font-size: 12px;">
                          Thank you for choosing CineMagic! 🎬<br>
                          Enjoy your movie!
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      }),
    });

    const data = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", data);
      
      // Check if it's the domain verification error
      if (data.name === 'validation_error' && data.message?.includes('only send testing emails')) {
        console.warn("Resend is in test mode - emails can only be sent to the verified account email");
        // Return success but with a warning - booking still succeeded
        return new Response(JSON.stringify({ 
          success: true, 
          warning: "Email delivery limited in test mode. Verify a domain at resend.com/domains for production.",
          testMode: true
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      throw new Error(data.message || "Failed to send email");
    }

    console.log("Ticket email sent successfully to:", email);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error sending ticket email:", error);
    const message = error instanceof Error ? error.message : "Failed to send email";
    // Don't fail the booking just because email failed
    return new Response(
      JSON.stringify({ success: false, error: message, emailFailed: true }),
      {
        status: 200, // Return 200 so booking doesn't fail
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
