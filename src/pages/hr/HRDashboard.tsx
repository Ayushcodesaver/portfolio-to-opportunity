import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, PageLoader } from "@/components/common/PageHeader";
import { Users, FileText, CheckCircle2, TrendingUp, Activity } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { GlassPanel, PanelHeader } from "@/components/dashboard/GlassPanel";
import { GaugeChart } from "@/components/dashboard/GaugeChart";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { useRealtimeInvalidate } from "@/hooks/useRealtimeInvalidate";
import { formatDistanceToNow } from "date-fns";

export default function HRDashboard() {
  useRealtimeInvalidate("hr-dashboard-rt", [
    { table: "profiles",        keys: [["hr-overview"]] },
    { table: "projects",        keys: [["hr-overview"], ["hr-recent-projects"]] },
    { table: "evaluations",     keys: [["hr-overview"]] },
    { table: "task_submissions",keys: [["hr-overview"], ["hr-recent-subs"]] },
  ]);

  const { data, isLoading } = useQuery({
    queryKey: ["hr-overview"],
    queryFn: async () => {
      const [profiles, projects, pending, evals, subs, approved] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("status","pending"),
        supabase.from("evaluations").select("id", { count: "exact", head: true }),
        supabase.from("task_submissions").select("id", { count: "exact", head: true }),
        supabase.from("task_submissions").select("id", { count: "exact", head: true }).eq("status","approved"),
      ]);
      return {
        interns: profiles.count ?? 0,
        projects: projects.count ?? 0,
        pending: pending.count ?? 0,
        evals: evals.count ?? 0,
        subs: subs.count ?? 0,
        approved: approved.count ?? 0,
      };
    },
  });

  const { data: recentSubs } = useQuery({
    queryKey: ["hr-recent-subs"],
    queryFn: async () => {
      const { data } = await supabase.from("task_submissions")
        .select("id, status, submitted_at, intern_id, task_id")
        .order("submitted_at", { ascending: false }).limit(6);
      return data ?? [];
    },
  });

  if (isLoading || !data) return <PageLoader />;

  const approvalRate = data.subs ? Math.round((data.approved / data.subs) * 100) : 0;

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      <PageHeader title="HR Overview" description="Live snapshot of your internship program." />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}        label="Total interns"     value={data.interns}  hint="across all programs" accent />
        <StatCard icon={FileText}     label="Total projects"    value={data.projects} />
        <StatCard icon={CheckCircle2} label="Pending reviews"   value={data.pending}  hint="awaiting your action" />
        <StatCard icon={TrendingUp}   label="Evaluations done"  value={data.evals} />
      </div>

      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6">
        <GlassPanel>
          <PanelHeader icon={Activity} title="Approval Rate" />
          <div className="flex items-center justify-center py-2">
            <GaugeChart value={approvalRate} centerLabel={`${approvalRate}%`} centerSub="Approved / Submitted" />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="text-center p-2 rounded-lg bg-card/40 border border-border/40">
              <div className="text-xs text-muted-foreground">Submissions</div>
              <div className="text-xl font-bold">{data.subs}</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-card/40 border border-border/40">
              <div className="text-xs text-muted-foreground">Approved</div>
              <div className="text-xl font-bold text-success">{data.approved}</div>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel>
          <PanelHeader icon={Activity} title="Activity (live)" />
          {(recentSubs ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No submissions yet.</p>
          ) : (
            <ul className="space-y-2">
              {recentSubs!.map((s: any) => (
                <li key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-card/40 border border-border/40">
                  <div className="h-8 w-8 rounded-full bg-primary/15 grid place-items-center text-xs font-bold text-primary">
                    {String(s.intern_id).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">New submission</p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(s.submitted_at), { addSuffix: true })}
                    </p>
                  </div>
                  <StatusPill kind={s.status as any} />
                </li>
              ))}
            </ul>
          )}
        </GlassPanel>
      </div>
    </div>
  );
}
