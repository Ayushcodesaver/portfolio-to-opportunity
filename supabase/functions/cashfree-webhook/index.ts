// Cashfree webhook — verifies signature, marks payment paid + activates subscription
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

// Cashfree PG v3: signature = base64(HMAC_SHA256(timestamp + rawBody, secretKey))
async function verifySignature(rawBody: string, timestamp: string, signature: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(timestamp + rawBody));
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));
  if (expected.length !== signature.length) return false;
  // constant-time compare
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-webhook-signature") ?? "";
    const timestamp = req.headers.get("x-webhook-timestamp") ?? "";
    const secret = Deno.env.get("CASHFREE_SECRET_KEY") ?? "";

    if (!secret) return new Response("misconfigured", { status: 500, headers: corsHeaders });
    if (!signature || !timestamp || !(await verifySignature(rawBody, timestamp, signature, secret))) {
      return new Response("invalid signature", { status: 401, headers: corsHeaders });
    }
    // reject replays older than 15 minutes
    const tsMs = Number(timestamp) * (String(timestamp).length <= 10 ? 1000 : 1);
    if (!Number.isFinite(tsMs) || Math.abs(Date.now() - tsMs) > 15 * 60 * 1000) {
      return new Response("stale webhook", { status: 401, headers: corsHeaders });
    }

    const body = JSON.parse(rawBody);
    const orderId = body?.data?.order?.order_id ?? body?.order?.order_id;
    const paymentStatus = body?.data?.payment?.payment_status ?? body?.type;
    const paymentId = body?.data?.payment?.cf_payment_id ?? null;

    if (!orderId) return new Response("ok", { headers: corsHeaders });

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: payment } = await admin.from("payments").select("*").eq("cashfree_order_id", orderId).maybeSingle();
    if (!payment) return new Response("ok", { headers: corsHeaders });
    if (payment.status === "paid") return new Response("ok", { headers: corsHeaders });

    const success = paymentStatus === "SUCCESS" || paymentStatus === "PAYMENT_SUCCESS_WEBHOOK";

    await admin.from("payments").update({
      status: success ? "paid" : "failed",
      cashfree_payment_id: paymentId ? String(paymentId) : null,
      raw: body,
      updated_at: new Date().toISOString(),
    }).eq("id", payment.id);

    if (success) {
      const { data: plan } = await admin.from("plans").select("duration_months").eq("id", payment.plan_id).single();
      const months = plan?.duration_months ?? 3;
      const expires = new Date();
      expires.setMonth(expires.getMonth() + months);

      await admin.from("subscriptions").upsert({
        user_id: payment.user_id,
        plan_id: payment.plan_id,
        started_at: new Date().toISOString(),
        expires_at: expires.toISOString(),
        status: "active",
        payment_id: payment.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

      await admin.from("notifications").insert({
        user_id: payment.user_id,
        title: `${payment.plan_id.toUpperCase()} plan activated 🎉`,
        body: `Welcome to Xebure ${payment.plan_id}. Enjoy your benefits!`,
        type: "system",
      }).then(() => {}, () => {});
    }

    return new Response("ok", { headers: corsHeaders });
  } catch (e) {
    return new Response(`error: ${(e as Error).message}`, { status: 500, headers: corsHeaders });
  }
});
