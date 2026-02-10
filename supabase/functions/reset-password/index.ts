import { createClient } from "jsr:@supabase/supabase-js@2";
import bcrypt from "npm:bcryptjs@2.4.3";

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
    const { email, reset_token, new_password } = await req.json();

    if (!email || !reset_token || !new_password) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: cors() }
      );
    }

    if (new_password.length < 8) {
      return new Response(
        JSON.stringify({ error: "Password too short" }),
        { status: 400, headers: cors() }
      );
    }

    // Validate reset token
    const { data: resetRow } = await supabase
      .from("password_resets")
      .select("*")
      .eq("email", email)
      .eq("reset_token", reset_token)
      .maybeSingle();

    if (!resetRow) {
      return new Response(
        JSON.stringify({ error: "Invalid reset session" }),
        { status: 400, headers: cors() }
      );
    }

    if (new Date() > new Date(resetRow.reset_token_expires_at)) {
      return new Response(
        JSON.stringify({ error: "Reset session expired" }),
        { status: 400, headers: cors() }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Determine account type
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

    const table = voter ? "voters" : "admins";

    await supabase
      .from(table)
      .update({ password: hashedPassword })
      .eq("email", email);

    // Cleanup reset record
    await supabase
      .from("password_resets")
      .delete()
      .eq("email", email);

    return new Response(
      JSON.stringify({ message: "Password reset successful" }),
      { status: 200, headers: cors() }
    );

  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    return new Response(
      JSON.stringify({ error: "Server error" }),
      { status: 500, headers: cors() }
    );
  }
});
