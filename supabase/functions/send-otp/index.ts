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
// Helpers
// ─────────────────────────────────────────────
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

// ─────────────────────────────────────────────
// Edge Function
// ─────────────────────────────────────────────
Deno.serve(async (req) => {
  // ─────────── CORS ───────────
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
    }

  try {
    const {
      full_name,
      email,
      password,
      region_id,
      department_id,
      id_card_number,
      id_card_back_url,
    } = await req.json();
    const normalizedEmail = String(email ?? "").trim().toLowerCase();
    const normalizedIdCardNumber = String(id_card_number ?? "").replace(/\D/g, "");

    // ─────────── Validate Input ───────────
    if (
      !full_name ||
      !normalizedEmail ||
      !password ||
      !region_id ||
      !department_id ||
      !normalizedIdCardNumber ||
      !id_card_back_url
    ) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: corsHeaders() }
      );
    }

    if (!/^\d{17}$/.test(normalizedIdCardNumber)) {
      return new Response(
        JSON.stringify({ error: "ID card number must be exactly 17 digits" }),
        { status: 400, headers: corsHeaders() }
      );
    }

    // ─────────── (Optional) Validate region & department exist & match ───────────
    // This prevents saving random UUIDs
    const { data: dept, error: deptErr } = await supabase
      .from("departments")
      .select("id, region_id")
      .eq("id", department_id)
      .maybeSingle();

    if (deptErr || !dept) {
      return new Response(
        JSON.stringify({ error: "Invalid department selected" }),
        { status: 400, headers: corsHeaders() }
      );
    }

    if (dept.region_id !== region_id) {
      return new Response(
        JSON.stringify({ error: "Department does not belong to selected region" }),
        { status: 400, headers: corsHeaders() }
      );
    }

    // ─────────── BLOCK IF USER ALREADY EXISTS ───────────
    const { data: existingVoter } = await supabase
      .from("voters")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingVoter) {
      return new Response(
        JSON.stringify({
          error: "An account with this email already exists. Please log in.",
        }),
        { status: 409, headers: corsHeaders() }
      );
    }

    // Block duplicate ID card number in voters
    const { data: existingVoterById, error: voterIdErr } = await supabase
      .from("voters")
      .select("id")
      .eq("id_card_number", normalizedIdCardNumber)
      .maybeSingle();

    if (voterIdErr) {
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: corsHeaders() }
      );
    }

    if (existingVoterById) {
      return new Response(
        JSON.stringify({ error: "This ID card number is already registered." }),
        { status: 409, headers: corsHeaders() }
      );
    }

    // Block duplicate ID card number in pending_users (except same email retry)
    const { data: existingPendingById, error: pendingIdErr } = await supabase
      .from("pending_users")
      .select("email")
      .eq("id_card_number", normalizedIdCardNumber)
      .neq("email", normalizedEmail)
      .maybeSingle();

    if (pendingIdErr) {
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: corsHeaders() }
      );
    }

    if (existingPendingById) {
      return new Response(
        JSON.stringify({ error: "This ID card number is already in use." }),
        { status: 409, headers: corsHeaders() }
      );
    }

    // ─────────── Generate OTP ───────────
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // ─────────── Upsert/Insert into pending_users ───────────
    // If user requests OTP again, overwrite otp_code + expires_at (and keep latest region/department)
    const { error: dbError } = await supabase.from("pending_users").upsert(
      {
        email: normalizedEmail,
        full_name,
        password,
        region_id,
        department_id,
        id_card_number: normalizedIdCardNumber,
        id_card_back_url,
        otp_code: otp,
        expires_at,
      },
      { onConflict: "email" }
    );

    if (dbError) {
      console.error("DB ERROR:", dbError);
      if (dbError.code === "23505") {
        return new Response(
          JSON.stringify({ error: "This ID card number is already registered." }),
          { status: 409, headers: corsHeaders() }
        );
      }
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 400, headers: corsHeaders() }
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
        to: normalizedEmail,
        subject: "Verify your VoteSecure account",
        html: `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.08);overflow:hidden;">
            
            <tr>
              <td style="background:#1f2937;padding:24px;text-align:center;">
                <h1 style="color:#ffffff;margin:0;font-size:24px;letter-spacing:1px;">VoteSecure</h1>
                <p style="color:#d1d5db;margin:8px 0 0;font-size:14px;">Secure Digital Voting Platform</p>
              </td>
            </tr>

            <tr>
              <td style="padding:32px;color:#374151;">
                <p style="font-size:16px;margin:0 0 12px;">
                  Hello <strong>${full_name}</strong>,
                </p>

                <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">
                  Thank you for registering with <strong>VoteSecure</strong>.
                  Please use the verification code below to complete your registration.
                </p>

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
        { status: 500, headers: corsHeaders() }
      );
    }

    return new Response(
      JSON.stringify({ message: "OTP sent successfully" }),
      { status: 200, headers: corsHeaders() }
    );
  } catch (err: any) {
    console.error("RUNTIME ERROR:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: corsHeaders() }
    );
  }
});
