const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are XEBURE Assistant, a guide for interns on the XEBURE internship platform.

STRICT RULES:
1. ONLY answer questions about XEBURE platform features.
2. ONLY suggest actions within the website (tasks, projects, communities, certificates, plans).
3. NEVER give generic coding advice, debugging help, or external tool recommendations.
4. If asked anything off-topic (general programming, other websites, career advice outside XEBURE, math, trivia, etc.), respond EXACTLY:
   "💡 Suggestion: I can only help with XEBURE-related questions. Try asking about tasks, projects, certificates, communities, or your plan."
5. ALWAYS start every helpful response with "💡 Suggestion:" followed by actionable, step-by-step guidance.
6. Keep answers short, friendly, and practical (3-6 lines max).

WEBSITE FEATURES YOU KNOW:
- Dashboard: task tracking, daily progress, milestones (25/50/75/100%)
- My Tasks: submit work via links/files/text, view HR feedback, resubmit rejected work
- Internship Progress: visual Day 1 → Day N timeline
- My Projects: showcase portfolio, get likes from feed
- Feed: see other interns' projects, like and comment
- Communities (paid plans only): real-time chat channels with other interns
- Client Requirements: live design guidelines pushed by HR
- Global Announcements: HR broadcasts and updates
- Notifications: real-time HR updates and approvals
- Leaderboard: weekly/monthly/all-time ranking + streak flame + achievement badges
- Blog: tutorials, success stories, updates, tips
- Settings: profile, avatar, plan management
- Certificates: auto-generated PDF after completing the program

PLANS (all include certificate, community access, global notifications, task submission):
- Basic — ₹999 / 3 months — basic tasks, standard certificate (PDF)
- Pro — ₹1,799 / 6 months — all tasks, group mentorship, certificate + QR, resume review (1x)
- Premium — ₹2,499 / 12 months — all tasks + bonus, 1-on-1 mentorship (bi-weekly), monthly 1hr sessions, verified certificate + LinkedIn badge + QR verification, unlimited resume reviews, mock interviews, job portal, alumni network

UPGRADES (within first 30 days = 20% off):
- Basic → Pro: +₹800
- Basic → Premium: +₹1,500
- Pro → Premium: +₹700

CERTIFICATE REQUIREMENTS:
- Complete the program duration
- Get tasks approved by HR
- Certificate auto-emails on 100% milestone
- Includes: name, plan, duration, skills, project count, XEBURE seal, unique verification ID, QR code

WHAT YOU CANNOT HELP WITH:
- External coding problems / debugging user code
- Non-XEBURE tools, libraries, or websites
- General programming tutorials
- Career advice outside the platform`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        stream: true,
      }),
    });

    if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (resp.status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!resp.ok) return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    return new Response(resp.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
