import { createClient } from "jsr:@supabase/supabase-js@2";

// ─────────────────────────────────────────────
// Supabase (SERVICE ROLE – EDGE ONLY)
// ─────────────────────────────────────────────
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// ─────────────────────────────────────────────
// Resend API Key
// ─────────────────────────────────────────────
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// ─────────────────────────────────────────────
// LOCK CONFIG (MUST MATCH resend-otp)
// ─────────────────────────────────────────────
const MAX_RESENDS = 3;
const LOCK_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

// ─────────────────────────────────────────────
// CORS helper
// ─────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// ─────────────────────────────────────────────
// Edge Function
// ─────────────────────────────────────────────
Deno.serve(async (req) => {
  // ─────────── CORS ───────────
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const { email, otp } = await req.json();

    // ─────────── Validate Input ───────────
    if (!email || !otp) {
      return new Response(JSON.stringify({ error: "Missing email or OTP" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // ─────────── Find Pending User (case-insensitive email) ───────────
    const { data: user, error } = await supabase
      .from("pending_users")
      .select("*")
      .ilike("email", email) // ✅ case-insensitive
      .single();

    if (error || !user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // ─────────── 🔒 LOCK VERIFICATION IF RESEND LOCKED ───────────
    const resendCount = user.resend_count ?? 0;
    const lastResendAt = user.last_resend_at
      ? new Date(user.last_resend_at).getTime()
      : 0;

    if (resendCount >= MAX_RESENDS) {
      const elapsed = Date.now() - lastResendAt;

      if (elapsed < LOCK_WINDOW_MS) {
        const retryAfter = Math.ceil((LOCK_WINDOW_MS - elapsed) / 1000);

        return new Response(
          JSON.stringify({
            error:
              "OTP verification is temporarily locked. Please wait before retrying.",
            retry_after: retryAfter,
          }),
          { status: 429, headers: corsHeaders }
        );
      }
    }

    // ─────────── Verify OTP ───────────
    if (user.otp_code !== otp) {
      return new Response(JSON.stringify({ error: "Invalid OTP" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // ─────────── Check Expiry ───────────
    if (new Date() > new Date(user.expires_at)) {
      return new Response(JSON.stringify({ error: "OTP expired" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // ─────────── Prevent Duplicate Voters (case-insensitive) ───────────
    const { data: existingVoter, error: existingErr } = await supabase
      .from("voters")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    if (existingErr) {
      console.error("CHECK VOTER ERROR:", existingErr);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // ─────────── Insert into voters (✅ INCLUDE region_id & department_id) ───────────
    if (!existingVoter) {
      const { error: insertErr } = await supabase.from("voters").insert({
        full_name: user.full_name,
        email: user.email,
        password: user.password,
        has_voted: false,
        region_id: user.region_id, // ✅ FIX
        department_id: user.department_id, // ✅ FIX
      });

      if (insertErr) {
        console.error("INSERT VOTER ERROR:", insertErr);
        return new Response(
          JSON.stringify({ error: insertErr.message || "Failed to create voter" }),
          { status: 400, headers: corsHeaders }
        );
      }
    } else {
      // If voter already exists, but region/department are null, you may want to backfill (optional)
      // This ensures old records get updated when user verifies again.
      // NOTE: Only updates if existing values are null.
      await supabase
        .from("voters")
        .update({
          region_id: user.region_id,
          department_id: user.department_id,
        })
        .eq("id", existingVoter.id)
        .is("region_id", null);
    }

    // ─────────── Cleanup Pending User ───────────
    const { error: delErr } = await supabase
      .from("pending_users")
      .delete()
      .ilike("email", email);

    if (delErr) {
      console.error("DELETE PENDING ERROR:", delErr);
      // Not fatal, but log it
    }

    // ─────────── Send PREMIUM Welcome Email ───────────
    if (RESEND_API_KEY) {
      const welcomeRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "VoteSecure <no-reply@ballotium.app>",
          to: email,
          subject: "Welcome to VoteSecure 🎉",
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
              <td style="background:#1f2937;padding:28px;text-align:center;">
                <h1 style="color:#ffffff;margin:0;font-size:24px;letter-spacing:1px;">
                  Welcome to VoteSecure
                </h1>
                <p style="color:#d1d5db;margin:8px 0 0;font-size:14px;">
                  Secure • Transparent • Trusted Voting
                </p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:36px;color:#374151;">
                <p style="font-size:16px;margin:0 0 16px;">
                  Hello <strong>${user.full_name}</strong>,
                </p>

                <p style="font-size:15px;line-height:1.7;margin:0 0 20px;">
                  Your email has been successfully verified, and your
                  <strong>VoteSecure</strong> account is now active.
                </p>

                <p style="font-size:15px;line-height:1.7;margin:0 0 20px;">
                  You can now log in, access available elections, and
                  participate in secure digital voting with confidence.
                </p>

                <div style="margin:32px 0;padding:18px 20px;background:#f9fafb;border-left:4px solid #2563eb;border-radius:8px;">
                  <p style="margin:0;font-size:14px;color:#374151;">
                    🔐 Your account is protected with advanced verification
                    and security controls.
                  </p>
                </div>

                <p style="font-size:14px;color:#6b7280;line-height:1.6;">
                  If you ever notice suspicious activity or need assistance,
                  our support team is always ready to help.
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
                  Contact support:
                  <a href="mailto:support@ballotium.app" style="color:#2563eb;text-decoration:none;">
                    support@ballotium.app
                  </a>
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

      if (!welcomeRes.ok) {
        const t = await welcomeRes.text();
        console.error("WELCOME EMAIL ERROR:", t);
        // Not fatal
      }
    }

    // ─────────── Success ───────────
    return new Response(JSON.stringify({ message: "OTP verified successfully" }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
