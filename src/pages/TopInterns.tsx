import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Crown, Trophy, Medal, ArrowLeft, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/common/Logo";
import { GlowButton } from "@/components/fx/GlowButton";
import { TiltCard } from "@/components/fx/TiltCard";
import { Button } from "@/components/ui/button";
import { useRealtimeInvalidate } from "@/hooks/useRealtimeInvalidate";

export default function TopInterns() {
  const navigate = useNavigate();

  const { data: rows } = useQuery({
    queryKey: ["top-interns-public"],
    queryFn: async () => {
      const { data: lb } = await supabase.from("leaderboard_v").select("*");
      const sorted = [...(lb ?? [])].sort((a: any, b: any) => (b.total_points ?? 0) - (a.total_points ?? 0)).slice(0, 30);
      const ids = sorted.map((r: any) => r.user_id);
      const profs = ids.length
        ? (await supabase.from("profiles").select("id, username, full_name, avatar_url, bio, skills").in("id", ids)).data ?? []
        : [];
      const m = new Map(profs.map((p: any) => [p.id, p]));
      return sorted.map((r: any) => ({ ...r, profile: m.get(r.user_id) }));
    },
  });

  useRealtimeInvalidate("top-interns-public", [
    { table: "points_history", keys: [["top-interns-public"]] },
  ]);

  const podium = (rows ?? []).slice(0, 3);
  const rest = (rows ?? []).slice(3);

  const podiumOrder = [podium[1], podium[0], podium[2]].filter(Boolean);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden relative">
      <nav className="fixed top-0 inset-x-0 z-50 glass-strong border-b border-primary/20">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <Button variant="ghost" onClick={() => navigate(-1)} size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </div>
      </nav>

      <div className="absolute top-32 left-1/4 w-[32rem] h-[32rem] bg-primary/20 rounded-full blur-3xl animate-orb" />

      <section className="relative pt-32 pb-12">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="text-center max-w-2xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-[11px] uppercase tracking-[0.2em] text-primary mb-6">
              <Sparkles className="h-3 w-3" /> Live rankings
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
              Top <span className="text-gradient">Xebure Interns</span>
            </h1>
            <p className="text-muted-foreground">
              Real interns. Real projects. Real impact. Updated in real time.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Podium */}
      {podium.length > 0 && (
        <section className="relative pb-12">
          <div className="container max-w-5xl">
            <div className="grid grid-cols-3 gap-4 md:gap-6 items-end">
              {podiumOrder.map((r: any, idx) => {
                const rank = r === podium[0] ? 1 : r === podium[1] ? 2 : 3;
                const heights = { 1: "h-72 md:h-80", 2: "h-56 md:h-64", 3: "h-48 md:h-56" } as const;
                const ringColor = { 1: "ring-yellow-400", 2: "ring-gray-300", 3: "ring-orange-400" } as const;
                const Icon = rank === 1 ? Crown : rank === 2 ? Trophy : Medal;
                return (
                  <motion.div
                    key={r.user_id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.15, duration: 0.5 }}
                    className="flex flex-col items-center"
                  >
                    <TiltCard className="w-full" max={4}>
                      <div className={`panel-3d ${heights[rank]} w-full p-4 md:p-5 flex flex-col items-center justify-end relative ${
                        rank === 1 ? "border-yellow-400/50 shadow-[0_0_60px_-10px_rgba(251,208,124,0.5)]" : ""
                      }`}>
                        <Icon className={`h-7 w-7 md:h-9 md:w-9 absolute top-3 ${
                          rank === 1 ? "text-yellow-400" : rank === 2 ? "text-gray-300" : "text-orange-400"
                        }`} />
                        {r.profile?.avatar_url ? (
                          <img src={r.profile.avatar_url} alt="" className={`h-16 w-16 md:h-20 md:w-20 rounded-full object-cover ring-4 ${ringColor[rank]} mb-3`} />
                        ) : (
                          <div className={`h-16 w-16 md:h-20 md:w-20 rounded-full bg-gradient-primary flex items-center justify-center font-bold text-primary-foreground ring-4 ${ringColor[rank]} mb-3`}>
                            {(r.profile?.full_name ?? "U")[0]}
                          </div>
                        )}
                        <p className="font-bold text-sm md:text-base text-center line-clamp-1">{r.profile?.full_name ?? "User"}</p>
                        <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-1">@{r.profile?.username ?? "—"}</p>
                        <div className="mt-3 text-xl md:text-2xl font-extrabold text-gradient">{r.total_points ?? 0}</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">points</div>
                      </div>
                    </TiltCard>
                    <div className={`mt-3 px-4 py-1 rounded-full text-xs font-bold ${
                      rank === 1 ? "bg-yellow-400/20 text-yellow-400" :
                      rank === 2 ? "bg-gray-300/20 text-gray-300" :
                      "bg-orange-400/20 text-orange-400"
                    }`}>#{rank}</div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* List */}
      <section className="relative pb-24">
        <div className="container max-w-3xl">
          <div className="space-y-2">
            {rest.map((r: any, i) => (
              <motion.div
                key={r.user_id}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 p-3 rounded-xl glass border border-border/40 hover:border-primary/40 transition"
              >
                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center font-bold text-sm shrink-0">
                  #{i + 4}
                </div>
                {r.profile?.avatar_url ? (
                  <img src={r.profile.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gradient-primary" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{r.profile?.full_name ?? "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">@{r.profile?.username ?? "—"}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-primary">{r.total_points ?? 0}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">pts</p>
                </div>
              </motion.div>
            ))}
            {rows && rows.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-12">
                The leaderboard is just getting started — be the first to climb it!
              </p>
            )}
          </div>

          <div className="text-center mt-12">
            <GlowButton onClick={() => navigate("/register")}>
              Join Xebure & climb the ranks
            </GlowButton>
          </div>
        </div>
      </section>
    </div>
  );
}
