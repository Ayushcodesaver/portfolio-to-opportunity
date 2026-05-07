import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, PageLoader, EmptyState } from "@/components/common/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Users, Ban, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function HRInterns() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["hr-interns"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id, profiles!inner(*)").eq("role", "intern");
      const ids = (roles ?? []).map((r: any) => r.user_id);
      const [points, subs] = await Promise.all([
        ids.length ? supabase.from("points_history").select("intern_id, points").in("intern_id", ids) : { data: [] as any[] },
        ids.length ? supabase.from("task_submissions").select("intern_id, status").in("intern_id", ids) : { data: [] as any[] },
      ]);
      return (roles ?? []).map((r: any) => {
        const profile = r.profiles;
        const myPts = (points.data ?? []).filter((p: any) => p.intern_id === r.user_id).reduce((s: number, p: any) => s + (p.points ?? 0), 0);
        const mySubs = (subs.data ?? []).filter((s: any) => s.intern_id === r.user_id);
        return { ...profile, points: myPts, total_subs: mySubs.length, approved_subs: mySubs.filter((s: any) => s.status === "approved").length };
      });
    },
  });

  const filtered = useMemo(() => (data ?? []).filter((r: any) => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.full_name?.toLowerCase().includes(q) || r.username?.toLowerCase().includes(q);
    const matchFilter = filter === "all" || (filter === "banned" ? r.is_banned : !r.is_banned);
    return matchSearch && matchFilter;
  }), [data, search, filter]);

  const exportCsv = () => {
    const rows = [["Name","Username","Points","Submissions","Approved","Status"], ...filtered.map((r: any) => [r.full_name, r.username, r.points, r.total_subs, r.approved_subs, r.is_banned ? "Banned" : "Active"])];
    const csv = rows.map(r => r.map(c => `"${String(c ?? "").replace(/"/g,'""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "interns.csv"; a.click();
  };

  const toggleBan = async (r: any) => {
    await supabase.from("profiles").update({ is_banned: !r.is_banned }).eq("id", r.id);
    toast.success(r.is_banned ? "Unbanned" : "Banned");
    qc.invalidateQueries({ queryKey: ["hr-interns"] });
  };

  return (
    <div className="container max-w-7xl py-8">
      <PageHeader title="Intern Management" description="Search, filter, and manage all interns."
        action={<Button variant="outline" onClick={exportCsv} className="border-border"><Download className="h-4 w-4 mr-1.5" />Export CSV</Button>}
      />
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or username..." className="pl-9 bg-input/50" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40 bg-input/50"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <PageLoader /> : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No interns" description="No results match your search." />
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-3">Intern</th>
                <th className="text-left p-3 hidden md:table-cell">Goal</th>
                <th className="text-right p-3">Points</th>
                <th className="text-right p-3 hidden sm:table-cell">Submissions</th>
                <th className="text-right p-3">Status</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r: any) => (
                <tr key={r.id} className="border-t border-border/50 hover:bg-muted/20">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold">{r.full_name?.[0]?.toUpperCase()}</div>
                      <div className="min-w-0"><p className="font-medium truncate">{r.full_name}</p><p className="text-xs text-muted-foreground truncate">@{r.username}</p></div>
                    </div>
                  </td>
                  <td className="p-3 hidden md:table-cell text-muted-foreground capitalize">{r.portfolio_goal ?? "—"}</td>
                  <td className="p-3 text-right text-primary font-bold">{r.points}</td>
                  <td className="p-3 text-right hidden sm:table-cell">{r.approved_subs}/{r.total_subs}</td>
                  <td className="p-3 text-right">
                    <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full ${r.is_banned ? "bg-destructive/20 text-destructive" : "bg-success/20 text-success"}`}>
                      {r.is_banned ? "Banned" : "Active"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => toggleBan(r)}>
                      {r.is_banned ? <ShieldCheck className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5 text-destructive" />}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
