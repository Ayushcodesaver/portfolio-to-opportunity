import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, PageLoader } from "@/components/common/PageHeader";
import { format } from "date-fns";

export default function SystemLogs() {
  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const { data } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(100);
      return data ?? [];
    },
  });
  if (isLoading) return <PageLoader />;
  return (
    <div className="container max-w-6xl py-8">
      <PageHeader title="System Logs" />
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left"><tr><th className="p-3">Time</th><th className="p-3">Action</th><th className="p-3">Target</th></tr></thead>
          <tbody>
            {data?.map((l: any) => (
              <tr key={l.id} className="border-t border-border/50">
                <td className="p-3 text-muted-foreground">{format(new Date(l.created_at), "MMM d, HH:mm")}</td>
                <td className="p-3"><span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary-glow">{l.action}</span></td>
                <td className="p-3 text-muted-foreground">{l.target_type} {l.target_id?.slice(0,8)}</td>
              </tr>
            ))}
            {(!data || data.length === 0) && <tr><td colSpan={3} className="p-6 text-center text-muted-foreground">No log entries yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
