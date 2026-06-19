import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Sparkles, ArrowLeft, Loader2, Crown, Zap, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/common/Logo";
import { GlowButton } from "@/components/fx/GlowButton";
import { TiltCard } from "@/components/fx/TiltCard";
import { ParticleBackground } from "@/components/fx/ParticleBackground";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRealtimeInvalidate } from "@/hooks/useRealtimeInvalidate";

const ICON_MAP: Record<string, any> = { basic: Zap, pro: Star, premium: Crown };

declare global {
  interface Window { Cashfree?: any }
}

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

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [paying, setPaying] = useState<string | null>(null);

  const { data: plans } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data } = await supabase.from("plans").select("*").order("sort_order");
      return data ?? [];
    },
  });

  const { data: sub } = useQuery({
    queryKey: ["my-sub", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase.from("subscriptions").select("*").eq("user_id", user!.id).maybeSingle()).data,
  });

  useRealtimeInvalidate(
    `pricing-${user?.id ?? "anon"}`,
    user ? [{ table: "subscriptions", filter: `user_id=eq.${user.id}`, keys: [["my-sub", user.id]] }] : [],
    !!user,
  );

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

  const isCurrent = (id: string) => sub?.status === "active" && sub.plan_id === id;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
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

      <section className="relative pt-32 pb-16">
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
              Every plan includes the certificate, community, notifications, and task submission.
              Upgrade anytime — first 30 days get 20% off.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="relative pb-24">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {(plans ?? []).map((p: any, i) => {
              const Icon = ICON_MAP[p.id] ?? Star;
              const popular = p.is_popular;
              const current = isCurrent(p.id);
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                >
                  <TiltCard className="h-full" max={popular ? 7 : 4}>
                    <div className={`relative h-full rounded-2xl p-7 flex flex-col ${
                      popular
                        ? "panel-3d border-2 border-primary/60 shadow-[0_0_60px_-10px_hsl(var(--primary)/0.4)]"
                        : "glass border border-border/40"
                    }`}>
                      {popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-primary text-primary-foreground text-[10px] uppercase tracking-wider font-bold shadow-[0_8px_20px_-5px_hsl(var(--primary)/0.6)]">
                          Most Popular
                        </div>
                      )}

                      <div className="inline-flex p-3 rounded-xl bg-gradient-primary mb-5 self-start shadow-[0_10px_25px_-10px_hsl(var(--primary)/0.7)]">
                        <Icon className="h-6 w-6 text-primary-foreground" />
                      </div>

                      <h3 className="text-2xl font-bold">{p.name}</h3>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                        {p.duration_months} months
                      </p>

                      <div className="my-5 flex items-baseline gap-1">
                        <span className="text-5xl font-extrabold text-gradient">₹{p.price_inr.toLocaleString()}</span>
                      </div>

                      <ul className="space-y-2.5 flex-1 mb-6">
                        {(p.features as string[]).map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <span className="text-foreground/90">{f}</span>
                          </li>
                        ))}
                      </ul>

                      {current ? (
                        <Button disabled className="w-full h-11 bg-primary/20 text-primary border border-primary/40">
                          ✓ Active plan
                        </Button>
                      ) : (
                        <GlowButton
                          tone={popular ? "primary" : "glass"}
                          className="w-full h-11"
                          onClick={() => checkout(p.id)}
                          disabled={paying === p.id}
                        >
                          {paying === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : `Get ${p.name}`}
                        </GlowButton>
                      )}
                    </div>
                  </TiltCard>
                </motion.div>
              );
            })}
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
