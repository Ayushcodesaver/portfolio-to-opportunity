import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, PageLoader } from "@/components/common/PageHeader";
import { Users, FileText, CheckCircle2, TrendingUp } from "lucide-react";

export default function HRDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["hr-overview"],
    queryFn: async () => {
      const [profiles, projects, pending, evals] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("status","pending"),
        supabase.from("evaluations").select("id", { count: "exact", head: true }),
      ]);
      return { interns: profiles.count ?? 0, projects: projects.count ?? 0, pending: pending.count ?? 0, evals: evals.count ?? 0 };
    },
  });

  if (isLoading || !data) return <PageLoader />;

  const stats = [
    { icon: Users, label: "Total interns", value: data.interns, color: "text-primary" },
    { icon: FileText, label: "Total projects", value: data.projects, color: "text-info" },
    { icon: CheckCircle2, label: "Pending reviews", value: data.pending, color: "text-warning" },
    { icon: TrendingUp, label: "Evaluations done", value: data.evals, color: "text-success" },
  ];

  return (
    <div className="container max-w-6xl py-8">
      <PageHeader title="HR Overview" description="Today's snapshot of your internship program." />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="glass rounded-xl p-5">
            <s.icon className={`h-5 w-5 ${s.color} mb-3`} />
            <p className="text-3xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
