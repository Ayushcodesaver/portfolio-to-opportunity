// Cashfree (sandbox) — create order + return payment_session_id
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CASHFREE_BASE = "https://sandbox.cashfree.com/pg"; // sandbox
const APP_ID = Deno.env.get("CASHFREE_APP_ID");
const SECRET = Deno.env.get("CASHFREE_SECRET_KEY");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    if (!APP_ID || !SECRET) throw new Error("Cashfree credentials missing");

    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: { user } } = await supabase.auth.getUser(auth.replace(/^Bearer\s+/i, ""));
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { plan_id, return_url } = await req.json();
    if (!plan_id) return json({ error: "plan_id required" }, 400);

    const { data: plan } = await supabase.from("plans").select("*").eq("id", plan_id).single();
    if (!plan) return json({ error: "Plan not found" }, 404);

    const orderId = `xeb_${user.id.slice(0, 8)}_${Date.now()}`;

    const { data: profile } = await supabase.from("profiles").select("full_name,username").eq("id", user.id).maybeSingle();

    const cfPayload = {
      order_id: orderId,
      order_amount: plan.price_inr,
      order_currency: "INR",
      customer_details: {
        customer_id: user.id,
        customer_name: profile?.full_name || profile?.username || "Xebure User",
        customer_email: user.email,
        customer_phone: "9999999999",
      },
      order_meta: {
        return_url: `${return_url || "https://xebure.com"}?order_id={order_id}`,
        notify_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/cashfree-webhook`,
      },
      order_note: `Xebure ${plan.name} plan`,
    };

    const cfResp = await fetch(`${CASHFREE_BASE}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": "2023-08-01",
        "x-client-id": APP_ID,
        "x-client-secret": SECRET,
      },
      body: JSON.stringify(cfPayload),
    });
    const cfData = await cfResp.json();
    if (!cfResp.ok) return json({ error: cfData.message || "Cashfree error", details: cfData }, 500);

    await supabase.from("payments").insert({
      user_id: user.id,
      plan_id,
      cashfree_order_id: orderId,
      amount_inr: plan.price_inr,
      status: "created",
      raw: cfData,
    });

    return json({
      order_id: orderId,
      payment_session_id: cfData.payment_session_id,
      amount: plan.price_inr,
    });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
