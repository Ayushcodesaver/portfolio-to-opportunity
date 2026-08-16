// AI-powered resume generator — Lovable AI Gateway (Gemini)
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are an elite technical resume writer. Produce a polished, ATS-friendly, single-page resume as STRICT JSON.

Rules:
- Use crisp, quantified bullets starting with strong action verbs ("Built", "Shipped", "Led", "Optimized").
- Each bullet ≤ 22 words. Prefer impact + metric where possible.
- Skills: 8–14 most relevant. Group implicitly by relevance order.
- Summary: 2–3 sentences, role-targeted, no fluff.
- Never invent employers, degrees, or dates. Only use what the user provides.
- If a section has no input, return an empty array for it.

Return ONLY this JSON shape, no prose, no markdown fences:
{
  "name": string,
  "headline": string,
  "contact": { "email": string, "phone": string, "location": string, "links": [{"label": string, "url": string}] },
  "summary": string,
  "skills": string[],
  "experience": [{"role": string, "company": string, "location": string, "start": string, "end": string, "bullets": string[]}],
  "projects": [{"name": string, "tech": string[], "bullets": string[], "url": string}],
  "education": [{"degree": string, "school": string, "start": string, "end": string, "details": string}],
  "achievements": string[],
  "certifications": [{"name": string, "issuer": string, "date": string}]
}`;
// per-user token bucket: 5 generations / 10 min
type Bucket = { tokens: number; updated: number };
const RATE = { capacity: 5, refillPerSec: 5 / 600 };
const buckets = new Map<string, Bucket>();
function take(key: string): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const b = buckets.get(key) ?? { tokens: RATE.capacity, updated: now };
  b.tokens = Math.min(RATE.capacity, b.tokens + ((now - b.updated) / 1000) * RATE.refillPerSec);
  b.updated = now;
  if (b.tokens < 1) { buckets.set(key, b); return { ok: false, retryAfter: Math.ceil((1 - b.tokens) / RATE.refillPerSec) }; }
  b.tokens -= 1;
  buckets.set(key, b);
  return { ok: true, retryAfter: 0 };
}

Deno.serve(async (req) => {

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: { user } } = await supabase.auth.getUser(auth.replace(/^Bearer\s+/i, ""));
    if (!user) return json({ error: "Unauthorized" }, 401);

    const gate = take(user.id);
    if (!gate.ok) return json({ error: `Too many resume generations — retry in ${gate.retryAfter}s.` }, 429);



    // Plan gate: Pro+ only
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan_id, status, expires_at")
      .eq("user_id", user.id)
      .maybeSingle();
    const active = sub?.status === "active" && (!sub.expires_at || new Date(sub.expires_at) > new Date());
    const tier = active ? sub!.plan_id : "none";
    if (tier !== "pro" && tier !== "premium") {
      return json({ error: "Resume builder is a Pro feature. Please upgrade.", code: "upgrade_required" }, 403);
    }

    const body = await req.json();
    const { targetRole, extra } = body ?? {};

    // Auto-pull profile + projects + completed tasks for richer context
    const [{ data: profile }, { data: projects }, { data: subs }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("projects").select("title, description, tech_stack, demo_url").eq("intern_id", user.id).limit(8),
      supabase.from("task_submissions").select("task_id, status, daily_tasks(title, description)").eq("intern_id", user.id).eq("status", "approved").limit(20),
    ]);

    const userPayload = {
      target_role: targetRole || "Software Engineer Intern",
      extra_info: extra ?? {},
      profile: {
        name: profile?.full_name,
        username: profile?.username,
        email: user.email,
        bio: profile?.bio,
        location: profile?.location,
        skills: profile?.skills ?? [],
        github: profile?.github_url,
        linkedin: profile?.linkedin_url,
        twitter: profile?.twitter_url,
        internship_type: profile?.internship_type,
        internship_start: profile?.internship_start,
        internship_end: profile?.internship_end,
      },
      xebure_projects: (projects ?? []).map((p: any) => ({
        name: p.title, tech: p.tech_stack, bullets: [p.description].filter(Boolean), url: p.demo_url,
      })),
      approved_tasks: (subs ?? []).map((s: any) => s.daily_tasks?.title).filter(Boolean),
    };

    const KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!KEY) return json({ error: "LOVABLE_API_KEY missing" }, 500);

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Build a resume from this data:\n${JSON.stringify(userPayload, null, 2)}` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.6,
      }),
    });

    if (resp.status === 429) return json({ error: "AI is rate-limited, please retry shortly." }, 429);
    if (resp.status === 402) return json({ error: "AI credits exhausted. Contact admin." }, 402);
    if (!resp.ok) {
      const t = await resp.text();
      return json({ error: `AI error: ${t.slice(0, 200)}` }, 500);
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content ?? "{}";
    let resume: any;
    try { resume = JSON.parse(content); }
    catch { return json({ error: "AI returned invalid JSON" }, 500); }

    return json({ resume, plan: tier });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
