import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, X, Sparkles, ArrowLeft, Loader2, Crown, Zap, Star, Shield, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/common/Logo";
import { GlowButton } from "@/components/fx/GlowButton";
import { TiltCard } from "@/components/fx/TiltCard";
import { ParticleBackground } from "@/components/fx/ParticleBackground";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { usePlan, PLAN_RANK, type PlanTier } from "@/hooks/usePlan";
import { format, formatDistanceToNow } from "date-fns";

const ICON_MAP: Record<string, any> = { basic: Zap, pro: Star, premium: Crown };

declare global { interface Window { Cashfree?: any } }

async function loadCashfreeSDK() {
  if (window.Cashfree) return window.Cashfree;
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Cashfree SDK"));
    document.head.appendChild(s);
  });
  return window.Cashfree;
}

// Comparison matrix derived from plan features (single source of truth = DB).
// Master feature list — used for the comparison table.
const COMPARE: { label: string; tiers: PlanTier[] }[] = [
  { label: "Basic tasks",              tiers: ["basic", "pro", "premium"] },
  { label: "Task submission",          tiers: ["basic", "pro", "premium"] },
  { label: "Community access",         tiers: ["basic", "pro", "premium"] },
  { label: "Notifications",            tiers: ["basic", "pro", "premium"] },
  { label: "Standard certificate",     tiers: ["basic", "pro", "premium"] },
  { label: "All program tasks",        tiers: ["pro", "premium"] },
  { label: "Group mentorship",         tiers: ["pro", "premium"] },
  { label: "Certificate + QR",         tiers: ["pro", "premium"] },
  { label: "Priority support",         tiers: ["pro", "premium"] },
  { label: "AI Assistant",             tiers: ["pro", "premium"] },
  { label: "Resume review",            tiers: ["pro", "premium"] },
  { label: "Bonus tasks",              tiers: ["premium"] },
  { label: "Bi-weekly 1-on-1",         tiers: ["premium"] },
  { label: "Monthly 1hr mentor",       tiers: ["premium"] },
  { label: "Verified cert + LinkedIn", tiers: ["premium"] },
  { label: "Unlimited resume reviews", tiers: ["premium"] },
  { label: "Mock interviews",          tiers: ["premium"] },
  { label: "Job portal",               tiers: ["premium"] },
  { label: "Alumni network",           tiers: ["premium"] },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const plan = usePlan();
  const [paying, setPaying] = useState<string | null>(null);

  const { data: plans } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data } = await supabase.from("plans").select("*").order("sort_order");
      return data ?? [];
    },
  });

  const checkout = async (planId: string) => {
    if (!user) { navigate("/login"); return; }
    setPaying(planId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cashfree-create-order`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ plan_id: planId, return_url: `${window.location.origin}/pricing` }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Order create failed");

      const Cashfree = await loadCashfreeSDK();
      const cf = Cashfree({ mode: "sandbox" });
      const result = await cf.checkout({
        paymentSessionId: data.payment_session_id,
        redirectTarget: "_modal",
      });
      if (result?.error) throw new Error(result.error.message || "Payment cancelled");
      toast.success("Payment received! Activating your plan…");
    } catch (e: any) {
      toast.error(e.message || "Checkout failed");
    } finally {
      setPaying(null);
    }
  };

  const ctaFor = (planId: string, price: number) => {
    if (!plan.active) return { label: `Get ${planId}`, disabled: false, kind: "buy" as const };
    const target = PLAN_RANK[planId as PlanTier];
    if (target === plan.rank) return { label: "✓ Active plan", disabled: true, kind: "active" as const };
    if (target < plan.rank) return { label: "Included in your plan", disabled: true, kind: "below" as const };
    const diff = price - (priceOf(plans, plan.tier) ?? 0);
    return { label: `Upgrade · pay ₹${diff > 0 ? diff.toLocaleString() : price.toLocaleString()}`, disabled: false, kind: "upgrade" as const };
  };

  const expiresIn = useMemo(() => {
    if (!plan.expiresAt) return null;
    return formatDistanceToNow(new Date(plan.expiresAt), { addSuffix: true });
  }, [plan.expiresAt]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <nav className="fixed top-0 inset-x-0 z-50 glass-strong border-b border-primary/20">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <Button variant="ghost" onClick={() => navigate(-1)} size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </div>
      </nav>

      <div className="absolute top-1/4 left-1/4 w-[36rem] h-[36rem] bg-primary/20 rounded-full blur-3xl animate-orb" />
      <div className="absolute bottom-1/4 right-1/4 w-[28rem] h-[28rem] bg-primary-glow/15 rounded-full blur-3xl animate-orb" style={{ animationDelay: "3s" }} />
      <ParticleBackground count={30} />

      <section className="relative pt-32 pb-12">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="text-center max-w-2xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-[11px] uppercase tracking-[0.2em] text-primary mb-6">
              <Sparkles className="h-3 w-3" /> Pricing
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
              Pick your <span className="text-gradient">growth plan</span>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg">
              Plans stack: Pro includes everything in Basic. Premium includes everything in Pro.
              No double billing — only pay the difference when you upgrade.
            </p>
          </motion.div>

          {plan.active && (
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="mt-8 max-w-xl mx-auto glass-strong rounded-2xl px-5 py-4 border border-primary/30 flex items-center gap-4"
            >
              <div className="p-2 rounded-lg bg-gradient-primary shadow-[0_8px_20px_-8px_hsl(var(--primary)/0.7)]">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  You're on <span className="font-bold text-primary capitalize">{plan.tier}</span>.
                  {expiresIn && <span className="text-muted-foreground"> Renews/expires {expiresIn}.</span>}
                </p>
                {plan.expiresAt && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Until {format(new Date(plan.expiresAt), "PP")}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      <section className="relative pb-16">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {(plans ?? []).map((p: any, i) => {
              const Icon = ICON_MAP[p.id] ?? Star;
              const popular = p.is_popular;
              const cta = ctaFor(p.id, p.price_inr);
              const isActive = cta.kind === "active";
              const isBelow = cta.kind === "below";

              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                >
                  <TiltCard className="h-full" max={popular ? 7 : 4}>
                    <div className={`relative h-full rounded-2xl p-7 flex flex-col transition-all ${
                      isActive
                        ? "panel-3d border-2 border-primary shadow-[0_0_70px_-10px_hsl(var(--primary)/0.6)]"
                        : popular
                        ? "panel-3d border-2 border-primary/60 shadow-[0_0_60px_-10px_hsl(var(--primary)/0.4)]"
                        : "glass border border-border/40"
                    }`}>
                      {isActive ? (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-success text-white text-[10px] uppercase tracking-wider font-bold">
                          Your plan
                        </div>
                      ) : popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-primary text-primary-foreground text-[10px] uppercase tracking-wider font-bold shadow-[0_8px_20px_-5px_hsl(var(--primary)/0.6)]">
                          Most Popular
                        </div>
                      )}

                      <div className="inline-flex p-3 rounded-xl bg-gradient-primary mb-5 self-start shadow-[0_10px_25px_-10px_hsl(var(--primary)/0.7)]">
                        <Icon className="h-6 w-6 text-primary-foreground" />
                      </div>

                      <div className="flex items-center gap-2">
                        <h3 className="text-2xl font-bold">{p.name}</h3>
                        {p.id !== "basic" && (
                          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
                            includes {p.id === "pro" ? "Basic" : "Pro"}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                        {p.duration_months} months access
                      </p>

                      <div className="my-5 flex items-baseline gap-2">
                        <span className="text-5xl font-extrabold text-gradient">₹{p.price_inr.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground">
                          ≈ ₹{Math.round(p.price_inr / p.duration_months)}/mo
                        </span>
                      </div>

                      <ul className="space-y-2.5 flex-1 mb-6">
                        {(p.features as string[]).map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <span className="text-foreground/90">{f}</span>
                          </li>
                        ))}
                      </ul>

                      {isActive ? (
                        <Button disabled className="w-full h-11 bg-success/15 text-success border border-success/40 hover:bg-success/15">
                          {cta.label}
                        </Button>
                      ) : isBelow ? (
                        <Button disabled className="w-full h-11 bg-muted/30 text-muted-foreground border border-border/40">
                          {cta.label}
                        </Button>
                      ) : (
                        <GlowButton
                          tone={popular ? "primary" : "glass"}
                          className="w-full h-11"
                          onClick={() => checkout(p.id)}
                          disabled={paying === p.id || cta.disabled}
                        >
                          {paying === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : cta.label}
                        </GlowButton>
                      )}
                    </div>
                  </TiltCard>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="relative pb-24">
        <div className="container max-w-5xl">
          <motion.h2
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-2xl md:text-3xl font-bold text-center mb-2"
          >
            What's included <span className="text-gradient">at a glance</span>
          </motion.h2>
          <p className="text-center text-sm text-muted-foreground mb-8">
            Higher tiers inherit everything below them. Live updates the moment your plan changes.
          </p>

          <div className="glass-strong rounded-2xl border border-primary/20 overflow-hidden">
            <div className="grid grid-cols-[1.6fr_repeat(3,1fr)] text-xs uppercase tracking-wider bg-primary/5 border-b border-primary/15">
              <div className="p-4 font-semibold">Feature</div>
              {(["basic", "pro", "premium"] as PlanTier[]).map((t) => (
                <div key={t} className={`p-4 text-center font-bold capitalize ${
                  plan.tier === t ? "text-primary" : "text-muted-foreground"
                }`}>
                  {t}
                  {plan.tier === t && <span className="ml-1 text-[9px]">●</span>}
                </div>
              ))}
            </div>

            {COMPARE.map((row, i) => (
              <div
                key={row.label}
                className={`grid grid-cols-[1.6fr_repeat(3,1fr)] text-sm border-b border-border/30 last:border-0 ${
                  i % 2 === 0 ? "bg-transparent" : "bg-primary/[0.025]"
                }`}
              >
                <div className="p-3.5 px-4 font-medium">{row.label}</div>
                {(["basic", "pro", "premium"] as PlanTier[]).map((t) => (
                  <div key={t} className="p-3.5 flex justify-center">
                    {row.tiers.includes(t) ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/40" />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-10">
            Secure checkout via Cashfree (sandbox) · UPI · Cards · Netbanking ·{" "}
            <Link to="/terms" className="text-primary hover:underline">Terms</Link> ·{" "}
            <Link to="/privacy" className="text-primary hover:underline">Privacy</Link>
          </p>
        </div>
      </section>
    </div>
  );
}

function priceOf(plans: any[] | undefined, tier: PlanTier): number | null {
  if (!plans || tier === "none") return null;
  return plans.find((p) => p.id === tier)?.price_inr ?? null;
}
