// XEBURE AI Assistant — strict scope + in-memory rate limiter
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are XEBURE Assistant, a guide for interns on the XEBURE internship platform.

STRICT RULES:
1. ONLY answer questions about XEBURE platform features.
2. ONLY suggest actions within the website (tasks, projects, communities, certificates, plans).
3. NEVER give generic coding advice, debugging help, or external tool recommendations.
4. If asked anything off-topic, respond EXACTLY:
   "💡 Suggestion: I can only help with XEBURE-related questions. Try asking about tasks, projects, certificates, communities, or your plan."
5. ALWAYS start every helpful response with "💡 Suggestion:" followed by actionable, step-by-step guidance.
6. Keep answers short, friendly, and practical (3-6 lines max).

WEBSITE FEATURES:
Dashboard, My Tasks, Internship Progress, My Projects, Feed, Communities, Client Requirements,
Global Announcements, Notifications, Leaderboard, Blog, Settings, Certificates.

PLANS (all include certificate, community access, notifications, task submission):
- Basic ₹999 / 3 months — basic tasks, standard certificate
- Pro ₹1,799 / 6 months — all tasks, group mentorship, certificate + QR, 1 resume review
- Premium ₹2,499 / 12 months — bonus tasks, bi-weekly 1-on-1, monthly 1hr session, verified certificate + LinkedIn badge, unlimited resume reviews, mock interviews, job portal, alumni

UPGRADES (first 30 days = 20% off): Basic→Pro +₹800, Basic→Premium +₹1,500, Pro→Premium +₹700.

CERTIFICATE: auto-emails on 100% milestone — name, plan, duration, skills, projects, seal, unique ID, QR.`;

// ---- in-memory token bucket per user (per cold-start instance) ----
type Bucket = { tokens: number; updated: number };
const RATE = { capacity: 20, refillPerSec: 20 / 60 }; // 20 req / minute / user
const buckets = new Map<string, Bucket>();

function take(key: string): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const b = buckets.get(key) ?? { tokens: RATE.capacity, updated: now };
  const elapsed = (now - b.updated) / 1000;
  b.tokens = Math.min(RATE.capacity, b.tokens + elapsed * RATE.refillPerSec);
  b.updated = now;
  if (b.tokens < 1) {
    buckets.set(key, b);
    return { ok: false, retryAfter: Math.ceil((1 - b.tokens) / RATE.refillPerSec) };
  }
  b.tokens -= 1;
  buckets.set(key, b);
  return { ok: true, retryAfter: 0 };
}

// best-effort decode of a JWT to extract user id (sub)
function userFromJwt(auth: string | null): string | null {
  if (!auth) return null;
  try {
    const tok = auth.replace(/^Bearer\s+/i, "");
    const payload = JSON.parse(atob(tok.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.sub ?? null;
  } catch { return null; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    const userId = userFromJwt(auth) ?? req.headers.get("x-forwarded-for") ?? "anon";

    const gate = take(userId);
    if (!gate.ok) {
      return new Response(
        JSON.stringify({ error: `Slow down 🌊 — try again in ${gate.retryAfter}s.` }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(gate.retryAfter) } },
      );
    }

    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages[] required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        stream: true,
      }),
    });

    if (resp.status === 429) return new Response(JSON.stringify({ error: "Upstream rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (resp.status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!resp.ok) return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    return new Response(resp.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
