import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL = "VoteSecure <no-reply@ballotium.app>";

const MAX_SENDS = 3;
const LOCK_MINUTES = 10;

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

async function hashOTP(otp: string) {
  const data = new TextEncoder().encode(otp);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors() });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email required" }),
        { status: 400, headers: cors() }
      );
    }

    // Check user exists
    const { data: voter } = await supabase
      .from("voters")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    const { data: admin } = await supabase
      .from("admins")
      .select("id")
      .eq("email", email)
      .maybeSingle();


    const { data: candidate } = await supabase
      .from("candidates")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (!voter && !admin && !candidate) {
      return new Response(
        JSON.stringify({ error: "Account not found" }),
        { status: 404, headers: cors() }
      );
    }

    // Get existing reset row (if any)
    const { data: existing } = await supabase
      .from("password_resets")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    // Lock check
    if (existing?.locked_until && new Date() < new Date(existing.locked_until)) {
      const seconds = Math.ceil(
        (new Date(existing.locked_until).getTime() - Date.now()) / 1000
      );

      return new Response(
        JSON.stringify({ error: "Too many requests", retry_after: seconds }),
        { status: 429, headers: cors() }
      );
    }

    // Send count check
    if ((existing?.send_count ?? 0) >= MAX_SENDS) {
      const lockedUntil = new Date(
        Date.now() + LOCK_MINUTES * 60 * 1000
      ).toISOString();

      await supabase
        .from("password_resets")
        .update({ locked_until: lockedUntil })
        .eq("email", email);

      return new Response(
        JSON.stringify({
          error: "Too many requests",
          retry_after: LOCK_MINUTES * 60,
        }),
        { status: 429, headers: cors() }
      );
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await hashOTP(otp);

    // UPSERT reset record
    await supabase.from("password_resets").upsert({
      email,
      otp_hash: otpHash,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      send_count: (existing?.send_count ?? 0) + 1,
      last_send_at: new Date().toISOString(),
      locked_until: null,
      reset_token: null,
      reset_token_expires_at: null,
    });

    // Send email
    await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${RESEND_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from: FROM_EMAIL,
    to: email,
    subject: "VoteSecure Password Reset Code",
    html: `
      <div style="font-family: Arial, sans-serif; background:#f5f7fa; padding:24px;">
        <div style="max-width:480px; margin:auto; background:#ffffff; padding:24px; border-radius:8px;">

          <h2 style="margin-top:0; color:#1e40af;">VoteSecure</h2>

          <p style="font-size:14px; color:#111827;">
            Hello,
          </p>

          <p style="font-size:14px; color:#374151;">
            Use the verification code below to reset your password.
          </p>

          <div style="
            margin:20px 0;
            padding:12px;
            text-align:center;
            font-size:24px;
            font-weight:600;
            letter-spacing:4px;
            background:#eef2ff;
            border-radius:6px;
            color:#1e40af;
          ">
            ${otp}
          </div>

          <p style="font-size:13px; color:#6b7280;">
            This code expires in <strong>10 minutes</strong>.
          </p>

          <p style="font-size:13px; color:#6b7280;">
            If you did not request a password reset, you can safely ignore this email.
          </p>

          <p style="margin-top:20px; font-size:13px; color:#374151;">
            — VoteSecure Team
          </p>

        </div>
      </div>
    `,
  }),
});

    return new Response(
      JSON.stringify({ message: "OTP sent" }),
      { status: 200, headers: cors() }
    );

  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "Server error" }),
      { status: 500, headers: cors() }
    );
  }
});
