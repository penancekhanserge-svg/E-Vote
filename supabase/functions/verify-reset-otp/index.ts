// Import Supabase client library for Deno runtime
import { createClient } from "jsr:@supabase/supabase-js@2";

// Create Supabase admin client using environment variables
// SERVICE ROLE KEY is used because this function needs DB write access
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,              // Supabase project URL
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!  // Admin/service key (server-side only)
);



// CORS HEADERS HELPER FUNCTION
// Returns headers required to allow browser requests
function cors() {
  return {
    "Access-Control-Allow-Origin": "*", // allow all origins (can be restricted)
    "Access-Control-Allow-Methods": "POST, OPTIONS", // allowed HTTP methods
    "Access-Control-Allow-Headers": "Content-Type, Authorization", // allowed headers
  };
}



// OTP HASHING FUNCTION
// Hashes OTP using SHA-256 so OTP is never stored in plain text
async function hashOTP(otp: string) {

  // Convert OTP string into binary bytes
  const data = new TextEncoder().encode(otp);

  // Create SHA-256 hash buffer
  const hash = await crypto.subtle.digest("SHA-256", data);

  // Convert binary hash → hex string
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}



// EDGE FUNCTION ENTRY POINT
// Handles incoming HTTP requests
Deno.serve(async (req) => {

  // Handle browser CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors() });
  }

  // Reject any method that is not POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: cors() }
    );
  }

  try {

    // Parse JSON body from request
    const { email, otp } = await req.json();

    // Validate required inputs exist
    if (!email || !otp) {
      return new Response(
        JSON.stringify({ error: "Email and OTP are required" }),
        { status: 400, headers: cors() }
      );
    }

    // Hash the provided OTP to compare with stored hash
    const otpHash = await hashOTP(otp);


    
    // LOOKUP RESET RECORD
    // Search password_resets table for matching email + otp hash
    const { data: record } = await supabase
      .from("password_resets")
      .select("*")
      .eq("email", email)
      .eq("otp_hash", otpHash)
      .maybeSingle(); // returns null if not found


    // If no matching record → invalid OTP
    if (!record) {
      return new Response(
        JSON.stringify({ error: "Invalid OTP" }),
        { status: 400, headers: cors() }
      );
    }

    // OTP EXPIRY CHECK
    // Compare current time vs stored expiry time
    if (new Date() > new Date(record.expires_at)) {
      return new Response(
        JSON.stringify({ error: "OTP expired" }),
        { status: 400, headers: cors() }
      );
    }


    // GENERATE RESET TOKEN
    
    // Create a secure random reset token (UUID)
    const resetToken = crypto.randomUUID();

    // Save reset token and expiry in database
    await supabase
      .from("password_resets")
      .update({
        reset_token: resetToken, // token used in next reset step
        reset_token_expires_at: new Date(
          Date.now() + 10 * 60 * 1000 // valid for 10 minutes
        ).toISOString(),
      })
      .eq("id", record.id); // update the matched reset record

    // SUCCESS RESPONSE
    // Return reset token to frontend
    return new Response(
      JSON.stringify({ reset_token: resetToken }),
      { status: 200, headers: cors() }
    );


  } catch (err) {

    // Log server error for debugging
    console.error("VERIFY RESET OTP ERROR:", err);

    // Return generic error response
    return new Response(
      JSON.stringify({ error: "Server error" }),
      { status: 500, headers: cors() }
    );
  }
});
