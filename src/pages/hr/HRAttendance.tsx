import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, PageLoader } from "@/components/common/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isWeekend } from "date-fns";
import { toast } from "sonner";

const STATUSES = ["present", "absent", "late", "leave", "holiday"] as const;
const COLORS: Record<string, string> = {
  present: "bg-success/30 text-success border-success/40",
  absent: "bg-destructive/30 text-destructive border-destructive/40",
  late: "bg-warning/30 text-warning border-warning/40",
  leave: "bg-info/30 text-info border-info/40",
  holiday: "bg-muted text-muted-foreground border-border",
};

export default function HRAttendance() {
  const qc = useQueryClient();
  const [internId, setInternId] = useState<string>("");
  const today = new Date();
  const monthDays = eachDayOfInterval({ start: startOfMonth(today), end: endOfMonth(today) });

  const { data: interns } = useQuery({
    queryKey: ["interns-list"],
    queryFn: async () => (await supabase.from("user_roles").select("user_id, profiles!inner(id, full_name, username)").eq("role", "intern")).data ?? [],
  });

  const { data: attendance, isLoading } = useQuery({
    queryKey: ["attendance", internId],
    queryFn: async () => {
      if (!internId) return [];
      const { data } = await supabase.from("attendance").select("*").eq("intern_id", internId)
        .gte("date", format(startOfMonth(today), "yyyy-MM-dd")).lte("date", format(endOfMonth(today), "yyyy-MM-dd"));
      return data ?? [];
    },
    enabled: !!internId,
  });

  const setStatus = async (date: Date, status: string) => {
    if (!internId) return;
    const dateStr = format(date, "yyyy-MM-dd");
    const { error } = await supabase.from("attendance").upsert({ intern_id: internId, date: dateStr, status: status as any }, { onConflict: "intern_id,date" });
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["attendance", internId] });
  };

  const statusFor = (d: Date) => (attendance ?? []).find((a: any) => a.date === format(d, "yyyy-MM-dd"))?.status;

  return (
    <div className="container max-w-5xl py-8">
      <PageHeader title="Attendance" description="Track daily attendance per intern." />
      <div className="mb-6 max-w-sm">
        <Select value={internId} onValueChange={setInternId}>
          <SelectTrigger className="bg-input/50"><SelectValue placeholder="Select an intern" /></SelectTrigger>
          <SelectContent>{(interns ?? []).map((i: any) => <SelectItem key={i.profiles.id} value={i.profiles.id}>{i.profiles.full_name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {!internId ? (
        <p className="text-center text-muted-foreground py-12">Select an intern to view their attendance.</p>
      ) : isLoading ? <PageLoader /> : (
        <div className="glass rounded-xl p-6">
          <h3 className="font-semibold mb-4">{format(today, "MMMM yyyy")}</h3>
          <div className="grid grid-cols-7 gap-2 text-center text-xs text-muted-foreground mb-2">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: monthDays[0].getDay() }).map((_, i) => <div key={`pad-${i}`} />)}
            {monthDays.map(d => {
              const s = statusFor(d);
              return (
                <div key={d.toISOString()} className={`relative aspect-square rounded-lg border-2 p-1 flex flex-col items-center justify-between text-xs transition-all hover:scale-105 ${
                  s ? COLORS[s] : isWeekend(d) ? "bg-muted/20 border-border/50" : "bg-card border-border"
                } ${isToday(d) ? "ring-2 ring-primary" : ""}`}>
                  <span className="font-bold">{format(d, "d")}</span>
                  <select value={s ?? ""} onChange={(e) => setStatus(d, e.target.value)}
                    className="w-full text-[9px] bg-transparent border-none uppercase font-semibold focus:outline-none cursor-pointer">
                    <option value="">—</option>
                    {STATUSES.map(st => <option key={st} value={st}>{st[0].toUpperCase() + st.slice(1)}</option>)}
                  </select>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 mt-6 text-xs">
            {STATUSES.map(s => <span key={s} className={`px-2 py-1 rounded-full border-2 ${COLORS[s]}`}>{s}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}
