// Project description improver — auth required + per-user rate limit
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Bucket = { tokens: number; updated: number };
const RATE = { capacity: 10, refillPerSec: 10 / 60 }; // 10 req / min / user
const buckets = new Map<string, Bucket>();

function take(key: string): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const b = buckets.get(key) ?? { tokens: RATE.capacity, updated: now };
  b.tokens = Math.min(RATE.capacity, b.tokens + ((now - b.updated) / 1000) * RATE.refillPerSec);
  b.updated = now;
  if (b.tokens < 1) {
    buckets.set(key, b);
    return { ok: false, retryAfter: Math.ceil((1 - b.tokens) / RATE.refillPerSec) };
  }
  b.tokens -= 1;
  buckets.set(key, b);
  return { ok: true, retryAfter: 0 };
}

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extra },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: { user } } = await admin.auth.getUser(auth.replace(/^Bearer\s+/i, ""));
    if (!user) return json({ error: "Unauthorized" }, 401);

    const gate = take(user.id);
    if (!gate.ok) {
      return json({ error: `Slow down — try again in ${gate.retryAfter}s.` }, 429, {
        "Retry-After": String(gate.retryAfter),
      });
    }

    const { description, title } = await req.json();
    if (!description || typeof description !== "string") {
      return json({ error: "description required" }, 400);
    }
    if (description.length > 5000) return json({ error: "description too long (max 5000 chars)" }, 400);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You rewrite project descriptions for an intern's portfolio. Make them clear, engaging, and outcome-focused. Keep under 250 words. Return only the improved description text — no preamble, no markdown headings." },
          { role: "user", content: `Project title: ${String(title ?? "(untitled)").slice(0, 200)}\n\nDescription:\n${description}` },
        ],
      }),
    });

    if (resp.status === 429) return json({ error: "AI is rate-limited, please retry shortly." }, 429);
    if (resp.status === 402) return json({ error: "Payment required" }, 402);
    if (!resp.ok) return json({ error: "AI gateway error" }, 500);

    const data = await resp.json();
    const improved = data.choices?.[0]?.message?.content?.trim() ?? description;
    return json({ improved });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
