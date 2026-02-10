// supabase/functions/register-candidate/index.ts
import { createClient } from "jsr:@supabase/supabase-js@2";

/* ================= INIT ================= */

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const APP_URL = Deno.env.get("APP_URL") || "http://localhost:5173";
const FROM_EMAIL = "VoteSecure <no-reply@ballotium.app>";

/* ================= CORS ================= */

const corsHeaders = () => ({
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
});

/* ================= HELPERS ================= */

const isValidEmail = (e: string) =>
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,63}$/.test(e);

const esc = (s: string) =>
  s.replaceAll("&","&amp;")
   .replaceAll("<","&lt;")
   .replaceAll(">","&gt;")
   .replaceAll('"',"&quot;")
   .replaceAll("'","&#039;");

/* ================= EMAIL TEMPLATE ================= */

function buildEmailHtml(p: {
  fullName:string; email:string; password:string;
  electionName:string; region:string; party:string;
}) {
  return `
<div style="background:#f4f6fb;padding:30px 12px;font-family:Segoe UI,Arial">
  <div style="max-width:620px;margin:auto;background:white;border-radius:18px;
              box-shadow:0 12px 30px rgba(0,0,0,.08);overflow:hidden">

    <div style="background:linear-gradient(135deg,#4f46e5,#1d4ed8);
                color:white;padding:26px">
      <h1 style="margin:0;font-size:22px">VoteSecure</h1>
      <p style="margin:6px 0 0;font-size:14px;opacity:.9">
        Candidate Account Created
      </p>
    </div>

    <div style="padding:26px">
      <p>Hello <b>${esc(p.fullName)}</b>,</p>
      <p>Your candidate account has been successfully created.</p>

      <table style="width:100%;border-collapse:collapse;font-size:14px">
        ${row("Election", p.electionName)}
        ${row("Party", p.party)}
        ${row("Region", p.region)}
        ${row("Email", p.email)}
        ${row("Temporary Password", p.password, true)}
      </table>

      <div style="margin:18px 0;padding:14px;border-radius:12px;
                  background:#fff7ed;border:1px solid #fed7aa;
                  color:#7c2d12;font-size:13px">
        ⚠️ Change your password after first login.
      </div>

      <div style="text-align:center;margin-top:18px">
        <a href="${APP_URL}/auth/login"
           style="background:#4f46e5;color:white;
                  padding:12px 20px;border-radius:12px;
                  text-decoration:none;font-weight:700">
          Login to VoteSecure
        </a>
      </div>
    </div>

    <div style="background:#f9fafb;padding:14px;
                font-size:12px;color:#6b7280;text-align:center">
      © ${new Date().getFullYear()} VoteSecure
    </div>

  </div>
</div>`;
}

const row = (k:string,v:string,strong=false)=>`
<tr>
  <td style="padding:10px;border:1px solid #eef1f8;background:#fafbff">${esc(k)}</td>
  <td style="padding:10px;border:1px solid #eef1f8;font-weight:${strong?800:600}">
    ${esc(v)}
  </td>
</tr>`;

/* ================= EMAIL SEND ================= */

async function sendEmail(to:string, subject:string, html:string, text:string) {
  const r = await fetch("https://api.resend.com/emails", {
    method:"POST",
    headers:{
      Authorization:`Bearer ${RESEND_API_KEY}`,
      "Content-Type":"application/json",
    },
    body:JSON.stringify({ from:FROM_EMAIL, to, subject, html, text }),
  });
  if(!r.ok) throw new Error("Email send failed");
}

/* ================= EDGE HANDLER ================= */

Deno.serve(async req => {

  if(req.method==="OPTIONS")
    return new Response(null,{status:204,headers:corsHeaders()});

  try {

    const b = await req.json();

    /* ✅ READ CORRECT PASSWORD FIELDS */
    const full_name = b.full_name?.trim();
    const emailRaw = b.email?.trim().toLowerCase();
    const party = b.party?.trim();
    const region = b.region?.trim();
    const election_id = b.election_id?.trim();
    const photo_url = b.photo_url?.trim();

    const password_hash = b.password_hash?.trim();
    const password_plain = b.password_plain?.trim();

    /* ✅ VALIDATION */
    if(!full_name||!emailRaw||!party||!region||!election_id||!photo_url||!password_hash||!password_plain)
      return err("Missing required fields",400);

    if(!isValidEmail(emailRaw))
      return err("Invalid email",400);

    const { data:election } = await supabase
      .from("elections")
      .select(`id, election_types(name)`)
      .eq("id", election_id)
      .maybeSingle();

    if(!election) return err("Election not found",404);

    const electionName = election.election_types?.name || "Election";

    const { data:dup } = await supabase
      .from("candidates")
      .select("id")
      .eq("email", emailRaw)
      .maybeSingle();

    if(dup) return err("Email already registered",409);

    /* ✅ STORE HASH ONLY */
    const { data, error } = await supabase
      .from("candidates")
      .insert({
        full_name: full_name.toUpperCase(),
        email: emailRaw,
        party: party.toUpperCase(),
        region,
        election_id,
        photo_url,
        password: password_hash,
      })
      .select()
      .single();

    if(error){
      console.error(error);
      return err(error.message,400);
    }

    /* ✅ EMAIL PLAIN PASSWORD */
    await sendEmail(
      emailRaw,
      `VoteSecure Candidate Account (${electionName})`,
      buildEmailHtml({
        fullName: full_name,
        email: emailRaw,
        password: password_plain,
        electionName,
        region,
        party,
      }),
      `Login: ${APP_URL}/auth/login`
    );

    return ok({ message:"Candidate registered", candidate:data });

  } catch(e:any){
    console.error(e);
    return err(e.message||"Server error",500);
  }
});

/* ================= RESP HELPERS ================= */

const ok = (d:any)=> new Response(JSON.stringify(d),{status:200,headers:corsHeaders()});
const err = (m:string,s=400)=> new Response(JSON.stringify({message:m}),{status:s,headers:corsHeaders()});
