import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, PageLoader } from "@/components/common/PageHeader";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";
import { format, subDays } from "date-fns";

export default function Analytics() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const since = subDays(new Date(), 14).toISOString();
      const [users, projects] = await Promise.all([
        supabase.from("profiles").select("created_at").gte("created_at", since),
        supabase.from("projects").select("created_at").gte("created_at", since),
      ]);
      const days: Record<string, { date: string; users: number; projects: number }> = {};
      for (let i = 13; i >= 0; i--) {
        const d = format(subDays(new Date(), i), "MMM d");
        days[d] = { date: d, users: 0, projects: 0 };
      }
      (users.data ?? []).forEach((u: any) => { const d = format(new Date(u.created_at), "MMM d"); if (days[d]) days[d].users++; });
      (projects.data ?? []).forEach((p: any) => { const d = format(new Date(p.created_at), "MMM d"); if (days[d]) days[d].projects++; });
      return Object.values(days);
    },
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="container max-w-6xl py-8">
      <PageHeader title="Platform Analytics" description="Last 14 days of activity." />
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-6">
          <h3 className="font-semibold mb-4">User growth</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Line type="monotone" dataKey="users" stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="glass rounded-xl p-6">
          <h3 className="font-semibold mb-4">Posts created</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="projects" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
