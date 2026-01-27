import { createClient } from "jsr:@supabase/supabase-js@2";

// ─────────────────────────────────────────────
// Supabase (SERVICE ROLE – EDGE ONLY)
// ─────────────────────────────────────────────
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// ─────────────────────────────────────────────
// Resend API
// ─────────────────────────────────────────────
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// ─────────────────────────────────────────────
// Rate-limit config
// ─────────────────────────────────────────────
const LOCK_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_RESENDS = 3;

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

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    // ─────────── Find pending user ───────────
    const { data: user, error } = await supabase
      .from("pending_users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    const resendCount = user.resend_count ?? 0;
    const lastResendAt = user.last_resend_at
      ? new Date(user.last_resend_at).getTime()
      : 0;

    // ─────────── LOCK LOGIC ───────────
    if (resendCount >= MAX_RESENDS) {
      const elapsed = Date.now() - lastResendAt;

      if (elapsed < LOCK_WINDOW_MS) {
        const retryAfter = Math.ceil(
          (LOCK_WINDOW_MS - elapsed) / 1000
        );

        return new Response(
          JSON.stringify({
            error: "Too many OTP requests. Please wait before retrying.",
            retry_after: retryAfter,
          }),
          { status: 429, headers: { "Access-Control-Allow-Origin": "*" } }
        );
      }

      // cooldown elapsed → reset counter
      await supabase
        .from("pending_users")
        .update({ resend_count: 0 })
        .eq("email", email);
    }

    // ─────────── Generate OTP ───────────
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // ─────────── Update pending user (FIXED) ───────────
    await supabase
      .from("pending_users")
      .update({
        otp_code: otp,
        expires_at: expiresAt,
        resend_count: resendCount >= MAX_RESENDS ? 1 : resendCount + 1,
        last_resend_at: new Date().toISOString(),
      })
      .eq("email", email);

    // ─────────── Send email ───────────
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "VoteSecure <no-reply@ballotium.app>",
        to: email,
        subject: "Your VoteSecure OTP Code",
        html: `
          <h2>${otp}</h2>
          <p>This code expires in <strong>10 minutes</strong>.</p>
          <p>If you did not request this, please ignore this email.</p>
        `,
      }),
    });

    // ─────────── Success ───────────
    return new Response(
      JSON.stringify({ message: "OTP resent successfully" }),
      { status: 200, headers: { "Access-Control-Allow-Origin": "*" } }
    );

  } catch (err) {
    console.error("RESEND OTP ERROR:", err);

    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
});
