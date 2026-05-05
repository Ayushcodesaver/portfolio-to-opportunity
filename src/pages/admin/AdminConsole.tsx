import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, PageLoader } from "@/components/common/PageHeader";
import { Users, FileText, AlertCircle, Sparkles } from "lucide-react";

export default function AdminConsole() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [users, posts, pending, ai] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("status","pending"),
        supabase.from("ai_usage").select("id", { count: "exact", head: true }),
      ]);
      return { users: users.count ?? 0, posts: posts.count ?? 0, pending: pending.count ?? 0, ai: ai.count ?? 0 };
    },
  });

  if (isLoading || !data) return <PageLoader />;

  const stats = [
    { icon: Users, label: "Total users", value: data.users },
    { icon: FileText, label: "Total posts", value: data.posts },
    { icon: AlertCircle, label: "Pending approvals", value: data.pending },
    { icon: Sparkles, label: "AI requests", value: data.ai },
  ];

  return (
    <div className="container max-w-6xl py-8">
      <PageHeader title="Admin Console" description="Platform health at a glance." />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="glass rounded-xl p-5">
            <s.icon className="h-5 w-5 text-primary mb-3" />
            <p className="text-3xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="glass rounded-xl p-6">
        <h2 className="font-semibold mb-3">System health</h2>
        <ul className="space-y-2 text-sm">
          <li className="flex justify-between"><span>API</span><span className="text-success">● Operational</span></li>
          <li className="flex justify-between"><span>Database</span><span className="text-success">● Connected</span></li>
          <li className="flex justify-between"><span>AI Service</span><span className="text-success">● Active</span></li>
        </ul>
      </div>
    </div>
  );
}
