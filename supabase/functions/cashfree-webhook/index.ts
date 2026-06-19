// Cashfree webhook — marks payment paid + activates subscription
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    // Cashfree v3 webhook payload
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
