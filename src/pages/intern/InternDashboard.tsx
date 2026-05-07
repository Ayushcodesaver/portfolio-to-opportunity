import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar, Trophy, Target, CheckCircle2, Bell, FileText, ArrowRight, Sparkles, Megaphone, Flame,
} from "lucide-react";
import { PageHeader, PageLoader } from "@/components/common/PageHeader";
import { CountdownTimer } from "@/components/common/CountdownTimer";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { Button } from "@/components/ui/button";
import { useEnrollment } from "@/hooks/useEnrollment";
import { useGlobalNotifications } from "@/hooks/useGlobalNotifications";
import { formatDistanceToNow } from "date-fns";

export default function InternDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: enr, isLoading: enrLoading } = useEnrollment();
  const { data: notifs, unreadCount, markRead } = useGlobalNotifications();

  // Today's tasks
  const { data: todayTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["today-tasks", enr?.program?.id, enr?.currentDay, user?.id],
    queryFn: async () => {
      if (!enr) return [];
      const [tasksRes, subsRes] = await Promise.all([
        supabase.from("daily_tasks").select("*").eq("program_id", enr.program.id).eq("day_number", enr.currentDay).order("created_at"),
        supabase.from("task_submissions").select("*").eq("intern_id", user!.id),
      ]);
      const subMap = new Map((subsRes.data ?? []).map((s: any) => [s.task_id, s]));
      return (tasksRes.data ?? []).map((t: any) => ({ ...t, submission: subMap.get(t.id) }));
    },
    enabled: !!enr && !!user,
  });

  // Points
  const { data: points } = useQuery({
    queryKey: ["my-points", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("points_history").select("points").eq("intern_id", user!.id);
      return (data ?? []).reduce((sum, r: any) => sum + (r.points ?? 0), 0);
    },
    enabled: !!user,
  });

  // Active client requirements
  const { data: requirements } = useQuery({
    queryKey: ["active-requirements"],
    queryFn: async () => {
      const { data } = await supabase
        .from("client_requirements").select("*").eq("is_active", true)
        .order("updated_at", { ascending: false }).limit(3);
      return data ?? [];
    },
  });

  // Realtime: invalidate on changes
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("intern-dashboard-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_tasks" }, () => {
        qc.invalidateQueries({ queryKey: ["today-tasks"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "task_submissions", filter: `intern_id=eq.${user.id}` }, () => {
        qc.invalidateQueries({ queryKey: ["today-tasks"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "client_requirements" }, () => {
        qc.invalidateQueries({ queryKey: ["active-requirements"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "points_history", filter: `intern_id=eq.${user.id}` }, () => {
        qc.invalidateQueries({ queryKey: ["my-points"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, qc]);

  if (enrLoading) return <PageLoader />;

  if (!enr) {
    return (
      <div className="container max-w-3xl py-12 text-center">
        <div className="glass rounded-2xl p-10">
          <Sparkles className="h-10 w-10 text-primary mx-auto mb-3" />
          <h2 className="text-2xl font-bold mb-2">Welcome to Xebure</h2>
          <p className="text-muted-foreground mb-6">You haven't been enrolled in an internship program yet. Your HR will set this up for you. Once enrolled, your timeline, daily tasks, and progress will appear here.</p>
          <Link to="/feed"><Button className="bg-gradient-primary">Explore the feed</Button></Link>
        </div>
      </div>
    );
  }

  const { program, currentDay } = enr;
  const pct = (currentDay / program.total_days) * 100;
  const milestones = [25, 50, 75, 100];

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      <PageHeader
        title={`Day ${currentDay} of ${program.total_days}`}
        description={program.title}
        action={
          <div className="flex items-center gap-2">
            <div className="glass rounded-lg px-3 py-1.5 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold">{points ?? 0} pts</span>
            </div>
          </div>
        }
      />

      {/* Timeline progress */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Internship Timeline</span>
          </div>
          <span className="text-xs text-muted-foreground">{Math.round(pct)}% complete · {program.total_days - currentDay} days left</span>
        </div>
        <div className="relative h-3 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-primary"
            initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
          />
          {milestones.map((m) => (
            <div key={m} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2" style={{ left: `${m}%` }}>
              <div className={`h-4 w-4 rounded-full border-2 ${pct >= m ? "bg-primary border-primary glow-violet" : "bg-background border-border"}`} />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
          {milestones.map((m) => (
            <span key={m} className={pct >= m ? "text-primary font-semibold" : ""}>{m}%</span>
          ))}
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's tasks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">Today's Tasks</h2>
              </div>
              <Link to="/tasks" className="text-xs text-primary hover:underline flex items-center gap-1">
                All tasks <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {tasksLoading ? <PageLoader /> : (todayTasks?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No tasks for today. Enjoy the breather! 🎉</p>
            ) : (
              <div className="space-y-3">
                {todayTasks!.map((t: any) => (
                  <Link to="/tasks" key={t.id}
                    className="block p-4 rounded-lg border border-border hover:border-primary/50 transition-colors bg-card/40">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{t.title}</h3>
                          <PriorityBadge priority={t.priority} />
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs text-primary font-bold mb-1">+{t.points} pts</div>
                        {t.submission?.status === "approved" && <span className="text-xs text-success flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Approved</span>}
                        {t.submission?.status === "submitted" && <span className="text-xs text-info">Submitted</span>}
                        {t.submission?.status === "rejected" && <span className="text-xs text-destructive">Needs revision</span>}
                      </div>
                    </div>
                    {t.deadline_at && !t.submission && <CountdownTimer to={t.deadline_at} />}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Client Requirements */}
          {requirements && requirements.length > 0 && (
            <div className="glass rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold">Client Requirements</h2>
                </div>
                <Link to="/requirements" className="text-xs text-primary hover:underline flex items-center gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="space-y-2">
                {requirements.map((r: any) => (
                  <Link to="/requirements" key={r.id}
                    className="block p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">{r.title}</h3>
                      <span className="text-[10px] text-muted-foreground">v{r.version} · {formatDistanceToNow(new Date(r.updated_at), { addSuffix: true })}</span>
                    </div>
                    {r.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{r.description}</p>}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: notifications + stats */}
        <div className="space-y-4">
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-sm">Live Announcements</h2>
              </div>
              {unreadCount > 0 && <span className="text-[10px] bg-primary text-primary-foreground rounded-full px-2 py-0.5 font-bold">{unreadCount}</span>}
            </div>
            <div className="space-y-2 max-h-[360px] overflow-y-auto">
              {(notifs ?? []).slice(0, 8).map((n) => (
                <button key={n.id} onClick={() => !n.is_read && markRead(n.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${n.is_read ? "border-border/40 opacity-70" : "border-primary/30 bg-primary/5"}`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-xs font-semibold flex-1">{n.title}</p>
                    <PriorityBadge priority={n.priority} />
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                </button>
              ))}
              {(!notifs || notifs.length === 0) && (
                <p className="text-xs text-muted-foreground text-center py-6">No announcements yet</p>
              )}
            </div>
          </div>

          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-sm">Stats</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Current day</span><span className="font-bold">{currentDay}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Days remaining</span><span className="font-bold">{program.total_days - currentDay}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total points</span><span className="font-bold text-primary">{points ?? 0}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
