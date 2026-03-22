// File overview: Implements this module's main behavior and UI/data flow.
// supabase/functions/register-candidate/index.ts
// Edge Function: Register Candidate -> Send Email -> Insert Candidate
// Uses: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, APP_URL (optional)

// Imports: external libraries and shared modules used in this file.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { hash } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

// Configuration: environment values and service clients.
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const APP_URL = Deno.env.get("APP_URL") || "http://localhost:5173";
const FROM_EMAIL = "VoteSecure <no-reply@ballotium.app>";

  // Helpers: reusable utility logic used by this module.
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function isValidEmail(email: string) {
  // Practical validation (not perfect, but solid)
  // Rejects obvious bad formats like "a@a", "test@.com", "abc@domain"
  const re = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,63}$/;
  return re.test(email);
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "<")
    .replaceAll(">", ">")
    .replaceAll('"', """)
    .replaceAll("'", "&#039;");
}

function buildEmailHtml(payload: {
  fullName: string;
  email: string;
  password: string;
  electionName: string;
  region: string;
  party: string;
}) {
  const fullName = escapeHtml(payload.fullName);
  const email = escapeHtml(payload.email);
  const password = escapeHtml(payload.password);
  const electionName = escapeHtml(payload.electionName);
  const region = escapeHtml(payload.region);
  const party = escapeHtml(payload.party);

  return `
  <div style="margin:0;padding:0;background:#f5f7fb;font-family:Inter,Segoe UI,Arial,sans-serif;">
    <div style="max-width:620px;margin:0 auto;padding:28px 16px;">
      <div style="background:linear-gradient(135deg,#4f46e5,#1d4ed8);border-radius:18px;padding:22px 22px 18px;color:#fff;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-weight:800;">
            VS
          </div>
          <div>
            <div style="font-size:18px;font-weight:800;letter-spacing:.2px;">VoteSecure</div>
            <div style="font-size:12px;opacity:.9;">Candidate Account Invitation</div>
          </div>
        </div>
        <div style="margin-top:16px;font-size:14px;opacity:.95;line-height:1.6;">
          Hello <b>${fullName}</b>, your candidate account has been created successfully.
          Please use the credentials below to sign in.
        </div>
      </div>

      <div style="margin-top:14px;background:#ffffff;border-radius:18px;border:1px solid #e6e9f3;box-shadow:0 8px 24px rgba(15,23,42,.06);overflow:hidden;">
        <div style="padding:18px 20px;border-bottom:1px solid #eef1f8;">
          <div style="font-size:14px;font-weight:800;color:#0f172a;">Your Details</div>
          <div style="font-size:12px;color:#64748b;margin-top:4px;">Keep this information private.</div>
        </div>

        <div style="padding:18px 20px;">
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <tr>
              <td style="padding:10px 12px;border:1px solid #eef1f8;border-radius:10px;background:#fafbff;color:#475569;width:38%;">Election</td>
              <td style="padding:10px 12px;border:1px solid #eef1f8;border-radius:10px;color:#0f172a;font-weight:700;">${electionName}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;border:1px solid #eef1f8;border-radius:10px;background:#fafbff;color:#475569;">Party</td>
              <td style="padding:10px 12px;border:1px solid #eef1f8;border-radius:10px;color:#0f172a;font-weight:700;">${party}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;border:1px solid #eef1f8;border-radius:10px;background:#fafbff;color:#475569;">Region</td>
              <td style="padding:10px 12px;border:1px solid #eef1f8;border-radius:10px;color:#0f172a;font-weight:700;">${region}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;border:1px solid #eef1f8;border-radius:10px;background:#fafbff;color:#475569;">Email</td>
              <td style="padding:10px 12px;border:1px solid #eef1f8;border-radius:10px;color:#0f172a;font-weight:700;">${email}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;border:1px solid #eef1f8;border-radius:10px;background:#fafbff;color:#475569;">Temporary Password</td>
              <td style="padding:10px 12px;border:1px solid #eef1f8;border-radius:10px;color:#0f172a;font-weight:800;letter-spacing:.3px;">${password}</td>
            </tr>
          </table>

          <div style="margin-top:16px;padding:14px 14px;border-radius:14px;background:#ecfeff;border:1px solid #a5f3fc;color:#0e7490;font-size:13px;line-height:1.6;">
            <b>Tip:</b> For better security, you are advised to change your password before logging in.
            If you did not expect this email, please contact the election administrator.
          </div>

          <div style="margin-top:18px;text-align:center;">
            <a href="${APP_URL}/auth/login"
               style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 18px;border-radius:12px;font-weight:800;font-size:14px;">
              Sign in to VoteSecure
            </a>
            <div style="margin-top:10px;font-size:12px;color:#64748b;">
              If the button doesn't work, copy and paste this link:
              <div style="margin-top:6px;word-break:break-all;color:#1d4ed8;">${APP_URL}/auth/login</div>
            </div>
          </div>
        </div>

        <div style="padding:14px 20px;border-top:1px solid #eef1f8;background:#fbfcff;color:#64748b;font-size:12px;line-height:1.5;">
          © ${new Date().getFullYear()} VoteSecure • This message was sent automatically. Please do not reply.
        </div>
      </div>
    </div>
  </div>
  `;
}

function buildEmailText(payload: {
  fullName: string;
  email: string;
  password: string;
  electionName: string;
  region: string;
  party: string;
}) {
  return `VoteSecure - Candidate Account Invitation

Hello ${payload.fullName},

Your candidate account has been created.

Election: ${payload.electionName}
Party: ${payload.party}
Region: ${payload.region}

Login Email: ${payload.email}
Temporary Password: ${payload.password}

Tip: For better security, you are advised to change your password before logging in.

Login: ${APP_URL}/auth/login
`;
}

async function sendResendEmail(
  to: string,
  subject: string,
  html: string,
  text: string,
) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || data?.error || "Failed to send email";
    throw new Error(msg);
  }
}

// Request handling: receives HTTP calls and returns API responses.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  try {
    const body = await req.json().catch(() => ({}));

    const full_name = String(body.full_name ?? "").trim();
    const emailRaw = String(body.email ?? "").trim().toLowerCase();
    const party = String(body.party ?? "").trim();
    const region = String(body.region ?? "").trim();
    const election_id = String(body.election_id ?? "").trim();
    const photo_url = String(body.photo_url ?? "").trim();
    const plainPassword = String(body.password ?? "").trim();

    if (
      !full_name || !emailRaw || !party || !region || !election_id ||
      !photo_url || !plainPassword
    ) {
      return new Response(
        JSON.stringify({ error: "Missing required fields." }),
        { status: 400, headers: corsHeaders() },
      );
    }

    if (!isValidEmail(emailRaw)) {
      return new Response(
        JSON.stringify({ error: "Please enter a valid email address." }),
        { status: 400, headers: corsHeaders() },
      );
    }

    // 1) Ensure election exists + fetch election name
    const { data: election, error: electionErr } = await supabase
      .from("elections")
      .select(`id, election_types(name)`)
      .eq("id", election_id)
      .maybeSingle();

    if (electionErr || !election) {
      return new Response(
        JSON.stringify({ error: "Election not found." }),
        { status: 404, headers: corsHeaders() },
      );
    }

    const electionName = election?.election_types?.name || "Election";

    // 2) Check email is not already used in admins/voters/candidates
    const [adminRes, voterRes, candRes] = await Promise.all([
      supabase.from("admins").select("id").eq("email", emailRaw).maybeSingle(),
      supabase.from("voters").select("id").eq("email", emailRaw).maybeSingle(),
      supabase.from("candidates").select("id").eq("email", emailRaw).maybeSingle(),
    ]);

    if (adminRes.data) {
      return new Response(
        JSON.stringify({ error: "This email is already registered as an Admin." }),
        { status: 409, headers: corsHeaders() },
      );
    }
    if (voterRes.data) {
      return new Response(
        JSON.stringify({ error: "This email is already registered as a Voter." }),
        { status: 409, headers: corsHeaders() },
      );
    }
    if (candRes.data) {
      return new Response(
        JSON.stringify({
          error: "This email is already registered as a Candidate.",
        }),
        { status: 409, headers: corsHeaders() },
      );
    }

    // 3) Send email FIRST (so fake emails won't get inserted)
    const subject = `VoteSecure: Your Candidate Account (${electionName})`;
    const html = buildEmailHtml({
      fullName: full_name,
      email: emailRaw,
      password: plainPassword,
      electionName,
      region,
      party,
    });
    const text = buildEmailText({
      fullName: full_name,
      email: emailRaw,
      password: plainPassword,
      electionName,
      region,
      party,
    });

    await sendResendEmail(emailRaw, subject, html, text);

    // 4) Hash password and insert candidate
    const hashed = await hash(plainPassword);

    const { data: inserted, error: insertErr } = await supabase
      .from("candidates")
      .insert({
        full_name: full_name.toUpperCase(),
        email: emailRaw,
        party: party.toUpperCase(),
        region,
        election_id,
        photo_url,
        password: hashed,
        must_change_password: true,
      })
      .select("id, full_name, email, party, region, election_id, photo_url")
      .single();

    if (insertErr) {
      return new Response(
        JSON.stringify({
          error:
            "Email was sent, but candidate could not be saved. Please contact admin.",
          details: insertErr.message,
        }),
        { status: 500, headers: corsHeaders() },
      );
    }

    return new Response(
      JSON.stringify({
        message: "Candidate registered and email sent.",
        candidate: inserted,
      }),
      { status: 200, headers: corsHeaders() },
    );
  } catch (err) {
    console.error("register-candidate error:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Server error" }),
      { status: 500, headers: corsHeaders() },
    );
  }
});
