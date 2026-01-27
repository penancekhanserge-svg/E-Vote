import { createClient } from "jsr:@supabase/supabase-js@2";

// ─────────────────────────────────────────────
// Supabase client (SERVICE ROLE – EDGE ONLY)
// ─────────────────────────────────────────────
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// ─────────────────────────────────────────────
// Resend API Key
// ─────────────────────────────────────────────
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
console.log("RESEND_API_KEY exists:", !!RESEND_API_KEY);

// ─────────────────────────────────────────────
// Edge Function
// ─────────────────────────────────────────────
Deno.serve(async (req) => {
  // ─────────── CORS ───────────
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const { full_name, email, password } = await req.json();

    // ─────────── Validate Input ───────────
    if (!full_name || !email || !password) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    // ─────────── BLOCK IF USER ALREADY EXISTS ───────────
    const { data: existingVoter } = await supabase
      .from("voters")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingVoter) {
      return new Response(
        JSON.stringify({
          error: "An account with this email already exists. Please log in.",
        }),
        { status: 409, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    // ─────────── Generate OTP ───────────
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // ─────────── Insert into pending_users ───────────
    const { error: dbError } = await supabase.from("pending_users").insert({
      full_name,
      email,
      password,
      otp_code: otp,
      expires_at,
    });

    if (dbError) {
      console.error("DB ERROR:", dbError);
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    // ─────────── Send OTP Email (PREMIUM DESIGN) ───────────
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "VoteSecure <no-reply@ballotium.app>",
        to: email,
        subject: "Verify your VoteSecure account",
        html: `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.08);overflow:hidden;">
            
            <!-- Header -->
            <tr>
              <td style="background:#1f2937;padding:24px;text-align:center;">
                <h1 style="color:#ffffff;margin:0;font-size:24px;letter-spacing:1px;">
                  VoteSecure
                </h1>
                <p style="color:#d1d5db;margin:8px 0 0;font-size:14px;">
                  Secure Digital Voting Platform
                </p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:32px;color:#374151;">
                <p style="font-size:16px;margin:0 0 12px;">
                  Hello <strong>${full_name}</strong>,
                </p>

                <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">
                  Thank you for registering with <strong>VoteSecure</strong>.
                  To complete your account setup and ensure the security of your profile,
                  please use the verification code below.
                </p>

                <!-- OTP Box -->
                <div style="text-align:center;margin:32px 0;">
                  <div style="display:inline-block;padding:18px 36px;
                    font-size:30px;font-weight:700;letter-spacing:8px;
                    background:#f9fafb;border:1px dashed #9ca3af;
                    border-radius:10px;color:#111827;">
                    ${otp}
                  </div>
                </div>

                <p style="font-size:14px;color:#4b5563;margin:0 0 12px;">
                  ⏱ This code will expire in <strong>10 minutes</strong>.
                </p>

                <p style="font-size:14px;color:#6b7280;line-height:1.6;">
                  If you did not request this verification, please ignore this email.
                  For your safety, never share this code with anyone.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#f9fafb;padding:20px;text-align:center;border-top:1px solid #e5e7eb;">
                <p style="font-size:12px;color:#9ca3af;margin:0;">
                  © ${new Date().getFullYear()} VoteSecure. All rights reserved.
                </p>
                <p style="font-size:12px;color:#9ca3af;margin:6px 0 0;">
                  Need help? Contact <a href="mailto:support@ballotium.app" style="color:#2563eb;text-decoration:none;">support@ballotium.app</a>
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

    if (!emailRes.ok) {
      const resendText = await emailRes.text();
      console.error("RESEND ERROR:", resendText);
      return new Response(
        JSON.stringify({ error: "Failed to send OTP email" }),
        { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    // ─────────── Success ───────────
    return new Response(
      JSON.stringify({ message: "OTP sent successfully" }),
      { status: 200, headers: { "Access-Control-Allow-Origin": "*" } }
    );

  } catch (err: any) {
    console.error("RUNTIME ERROR:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
});
