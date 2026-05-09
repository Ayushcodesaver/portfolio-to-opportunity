import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Flame, Medal, Crown, Sparkles, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, PageLoader } from "@/components/common/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const ICONS: Record<string, any> = { trophy: Trophy, flame: Flame, medal: Medal, crown: Crown, sparkles: Sparkles, award: Award };

export default function Leaderboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"weekly" | "monthly" | "all">("weekly");

  const { data: rows, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data: lb } = await supabase.from("leaderboard_v").select("*");
      const ids = (lb ?? []).map((r: any) => r.user_id);
      const profs = ids.length ? (await supabase.from("profiles").select("id, username, full_name, avatar_url").in("id", ids)).data ?? [] : [];
      const pmap = new Map(profs.map((p: any) => [p.id, p]));
      return (lb ?? []).map((r: any) => ({ ...r, profile: pmap.get(r.user_id) }));
    },
  });

  const { data: streak } = useQuery({
    queryKey: ["my-streak", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("daily_streaks").select("*").eq("user_id", user!.id).maybeSingle()).data,
  });

  const { data: badges } = useQuery({
    queryKey: ["my-badges", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [a, b] = await Promise.all([
        supabase.from("achievements").select("*"),
        supabase.from("user_achievements").select("achievement_key, earned_at").eq("user_id", user!.id),
      ]);
      const earned = new Map((b.data ?? []).map((x: any) => [x.achievement_key, x.earned_at]));
      return (a.data ?? []).map((ach: any) => ({ ...ach, earned_at: earned.get(ach.key) }));
    },
  });

  const sortKey = tab === "weekly" ? "weekly_points" : tab === "monthly" ? "monthly_points" : "total_points";
  const sorted = [...(rows ?? [])].sort((a, b) => (b[sortKey] ?? 0) - (a[sortKey] ?? 0)).slice(0, 50);

  if (isLoading) return <PageLoader />;

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <PageHeader title="Leaderboard" description="Compete, learn, level up." />

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="glass rounded-xl p-6">
          <Tabs value={tab} onValueChange={(v: any) => setTab(v)}>
            <TabsList>
              <TabsTrigger value="weekly">This Week</TabsTrigger>
              <TabsTrigger value="monthly">This Month</TabsTrigger>
              <TabsTrigger value="all">All-Time</TabsTrigger>
            </TabsList>
            <TabsContent value={tab} className="mt-4">
              {sorted.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No points earned yet.</p>
              ) : (
                <div className="space-y-2">
                  {sorted.map((r, i) => {
                    const isMe = r.user_id === user?.id;
                    return (
                      <div
                        key={r.user_id}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition ${
                          isMe ? "border-primary/50 bg-primary/10" : "border-border/40 bg-card/30"
                        }`}
                      >
                        <div
                          className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                            i === 0 ? "bg-yellow-500/20 text-yellow-400" :
                            i === 1 ? "bg-gray-400/20 text-gray-300" :
                            i === 2 ? "bg-orange-500/20 text-orange-400" :
                            "bg-muted text-muted-foreground"
                          }`}
                        >
                          #{i + 1}
                        </div>
                        {r.profile?.avatar_url ? (
                          <img src={r.profile.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-primary/20" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {r.profile?.full_name ?? "User"} {isMe && <span className="text-xs text-primary">(you)</span>}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">@{r.profile?.username ?? "—"} · {r.badges_count ?? 0} badges</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-primary">{r[sortKey] ?? 0}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">pts</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="h-5 w-5 text-orange-400" />
              <h3 className="font-semibold">Your streak</h3>
            </div>
            <div className="text-4xl font-bold text-orange-400">{streak?.current_streak ?? 0} <span className="text-sm text-muted-foreground font-normal">days</span></div>
            <p className="text-xs text-muted-foreground mt-1">Longest: {streak?.longest_streak ?? 0} days</p>
          </div>

          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Award className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Badges</h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {badges?.map((b: any) => {
                const Ic = ICONS[b.icon] ?? Trophy;
                const earned = !!b.earned_at;
                return (
                  <div
                    key={b.key}
                    title={`${b.name} — ${b.description}`}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center p-2 text-center transition ${
                      earned ? "bg-primary/15 border border-primary/40" : "bg-muted/30 border border-border/40 opacity-40"
                    }`}
                  >
                    <Ic className={`h-6 w-6 mb-1 ${earned ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-[10px] leading-tight line-clamp-2">{b.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
