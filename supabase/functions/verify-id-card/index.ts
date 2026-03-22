// File overview: Implements this module's main behavior and UI/data flow.
const OCR_API_URL = "https://api.ocr.space/parse/image";
const OCR_API_KEY = Deno.env.get("OCR_SPACE_API_KEY");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  // Helpers: reusable utility logic used by this module.
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
    "Content-Type": "application/json",
  };
}

function normalizeDigits(value: string) {
  return value.replace(/\D/g, "");
}

function decodeDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    throw new Error("Invalid image data format.");
  }

  const contentType = match[1];
  const base64 = match[2];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  if (bytes.byteLength === 0) {
    throw new Error("Uploaded image is empty.");
  }

  return {
    bytes: bytes.buffer,
    contentType,
  };
}

async function downloadImage(url: string) {
  let response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
  });

  // If object is public, retry without authorization when first request fails.
  if (!response.ok) {
    response = await fetch(url);
  }

  if (!response.ok) {
    throw new Error("Unable to fetch ID card image from storage.");
  }

  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength === 0) {
    throw new Error("Uploaded image is empty.");
  }

  return {
    bytes: arrayBuffer,
    contentType: response.headers.get("content-type") || "image/jpeg",
  };
}

  // Data loading: retrieves records from APIs or the database.
async function getImageBytes(input: string) {
  if (input.startsWith("data:image/")) {
    return decodeDataUrl(input);
  }

  if (/^https?:\/\//i.test(input)) {
    return downloadImage(input);
  }

  throw new Error("Invalid ID card image input.");
}

async function runOcr(imageBytes: ArrayBuffer, contentType: string) {
  if (!OCR_API_KEY) {
    throw new Error("OCR service is not configured.");
  }

  const formData = new FormData();
  formData.append("apikey", OCR_API_KEY);
  formData.append("language", "eng");
  formData.append("isOverlayRequired", "false");
  formData.append("OCREngine", "2");
  formData.append("detectOrientation", "true");
  formData.append(
    "file",
    new Blob([imageBytes], { type: contentType }),
    "id-card-back.jpg",
  );

  const response = await fetch(OCR_API_URL, {
    method: "POST",
    body: formData,
  });

  const responseText = await response.text();
  let payload: any = {};
  try {
    payload = JSON.parse(responseText);
  } catch {
    payload = {};
  }

  if (!response.ok) {
    const providerError =
      payload?.ErrorMessage ||
      payload?.ErrorDetails ||
      responseText ||
      "Unknown OCR provider error";
    throw new Error(`OCR request failed (${response.status}): ${providerError}`);
  }

  if (payload?.IsErroredOnProcessing) {
    const providerError =
      payload?.ErrorMessage ||
      payload?.ErrorDetails ||
      "OCR could not process this image.";
    throw new Error(String(providerError));
  }

  const parsed = Array.isArray(payload?.ParsedResults) ? payload.ParsedResults : [];
  return parsed
    .map((entry: { ParsedText?: string }) => entry?.ParsedText || "")
    .join(" ")
    .trim();
}

// Request handling: receives HTTP calls and returns API responses.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: corsHeaders() },
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const idCardNumber = normalizeDigits(String(body.id_card_number ?? ""));
    const idCardBackInput = String(body.id_card_back_url ?? "").trim();

    if (!/^\d{17}$/.test(idCardNumber)) {
      return new Response(
        JSON.stringify({ error: "ID card number must be exactly 17 digits." }),
        { status: 400, headers: corsHeaders() },
      );
    }

    if (
      !idCardBackInput ||
      (!idCardBackInput.startsWith("data:image/") && !/^https?:\/\//i.test(idCardBackInput))
    ) {
      return new Response(
        JSON.stringify({ error: "Invalid ID card image input." }),
        { status: 400, headers: corsHeaders() },
      );
    }

    const { bytes, contentType } = await getImageBytes(idCardBackInput);
    const ocrText = await runOcr(bytes, contentType);
    const textDigits = normalizeDigits(ocrText);

    if (!ocrText || textDigits.length < 8) {
      return new Response(
        JSON.stringify({
          status: "unclear",
          error: "ID image is unclear. Please upload a clearer image.",
        }),
        { status: 200, headers: corsHeaders() },
      );
    }

    if (textDigits.includes(idCardNumber)) {
      return new Response(
        JSON.stringify({ status: "match", message: "ID card verified." }),
        { status: 200, headers: corsHeaders() },
      );
    }

    const candidates = textDigits.match(/\d{17}/g) || [];
    if (candidates.length === 0) {
      return new Response(
        JSON.stringify({
          status: "unclear",
          error: "Could not read a valid 17-digit number from image.",
        }),
        { status: 200, headers: corsHeaders() },
      );
    }

    return new Response(
      JSON.stringify({
        status: "mismatch",
        error: "ID number does not match the uploaded ID card image.",
      }),
      { status: 200, headers: corsHeaders() },
    );
  } catch (error) {
    console.error("VERIFY ID CARD ERROR:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || "Internal server error" }),
      { status: 500, headers: corsHeaders() },
    );
  }
});
