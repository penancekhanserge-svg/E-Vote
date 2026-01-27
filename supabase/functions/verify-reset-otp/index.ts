import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
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

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: cors() }
    );
  }

  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return new Response(
        JSON.stringify({ error: "Email and OTP are required" }),
        { status: 400, headers: cors() }
      );
    }

    const otpHash = await hashOTP(otp);

    // Find matching reset record
    const { data: record } = await supabase
      .from("password_resets")
      .select("*")
      .eq("email", email)
      .eq("otp_hash", otpHash)
      .maybeSingle();

    if (!record) {
      return new Response(
        JSON.stringify({ error: "Invalid OTP" }),
        { status: 400, headers: cors() }
      );
    }

    // Expiry check
    if (new Date() > new Date(record.expires_at)) {
      return new Response(
        JSON.stringify({ error: "OTP expired" }),
        { status: 400, headers: cors() }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomUUID();

    await supabase
      .from("password_resets")
      .update({
        reset_token: resetToken,
        reset_token_expires_at: new Date(
          Date.now() + 10 * 60 * 1000
        ).toISOString(),
      })
      .eq("id", record.id);

    return new Response(
      JSON.stringify({ reset_token: resetToken }),
      { status: 200, headers: cors() }
    );

  } catch (err) {
    console.error("VERIFY RESET OTP ERROR:", err);
    return new Response(
      JSON.stringify({ error: "Server error" }),
      { status: 500, headers: cors() }
    );
  }
});
