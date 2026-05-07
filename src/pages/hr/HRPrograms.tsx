import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, PageLoader, EmptyState } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Calendar, Users, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format, addDays } from "date-fns";

export default function HRPrograms() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["hr-programs"],
    queryFn: async () => {
      const { data: progs } = await supabase.from("internship_programs").select("*").order("created_at", { ascending: false });
      const ids = (progs ?? []).map(p => p.id);
      const { data: enr } = ids.length ? await supabase.from("program_enrollments").select("program_id, intern_id") : { data: [] as any[] };
      return (progs ?? []).map(p => ({ ...p, enrolled: (enr ?? []).filter((e: any) => e.program_id === p.id).length }));
    },
  });

  const toggleActive = async (p: any) => {
    await supabase.from("internship_programs").update({ is_active: !p.is_active }).eq("id", p.id);
    qc.invalidateQueries({ queryKey: ["hr-programs"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this program (and all its tasks)?")) return;
    await supabase.from("internship_programs").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["hr-programs"] });
    toast.success("Program deleted");
  };

  return (
    <div className="container max-w-6xl py-8">
      <PageHeader title="Internship Programs" description="Define timelines, then enroll interns and add daily tasks."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="bg-gradient-primary"><Plus className="h-4 w-4 mr-1.5" />New program</Button></DialogTrigger>
            <DialogContent className="glass-strong">
              <DialogHeader><DialogTitle>New internship program</DialogTitle></DialogHeader>
              <ProgramForm onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["hr-programs"] }); }} userId={user?.id} />
            </DialogContent>
          </Dialog>
        }
      />
      {isLoading ? <PageLoader /> : (data ?? []).length === 0 ? (
        <EmptyState icon={Calendar} title="No programs yet" description="Create your first program to get started." />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data!.map((p: any) => (
            <div key={p.id} className="glass rounded-xl p-5">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold">{p.title}</h3>
                <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full ${p.is_active ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"}`}>
                  {p.is_active ? "active" : "inactive"}
                </span>
              </div>
              {p.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{p.description}</p>}
              <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                <div className="flex justify-between"><span>Duration</span><span className="text-foreground font-medium">{p.total_days} days</span></div>
                <div className="flex justify-between"><span>Start</span><span className="text-foreground">{format(new Date(p.start_date), "MMM d, yyyy")}</span></div>
                <div className="flex justify-between"><span>End</span><span className="text-foreground">{format(new Date(p.end_date), "MMM d, yyyy")}</span></div>
                <div className="flex justify-between"><span>Enrolled</span><span className="text-primary font-bold flex items-center gap-1"><Users className="h-3 w-3" />{p.enrolled}</span></div>
              </div>
              <div className="flex gap-2">
                <a href={`/hr/programs/${p.id}/tasks`} className="flex-1"><Button variant="outline" size="sm" className="w-full border-border">Manage tasks</Button></a>
                <a href={`/hr/programs/${p.id}/enroll`}><Button variant="outline" size="sm" className="border-border"><Users className="h-3.5 w-3.5" /></Button></a>
                <Button variant="outline" size="sm" className="border-border" onClick={() => toggleActive(p)}><Power className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProgramForm({ onDone, userId }: { onDone: () => void; userId?: string }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [days, setDays] = useState("90");
  const [start, setStart] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!title.trim() || !userId) return;
    setBusy(true);
    const total = Number(days) || 90;
    const end = format(addDays(new Date(start), total - 1), "yyyy-MM-dd");
    const { error } = await supabase.from("internship_programs").insert({
      title, description: desc, total_days: total, start_date: start, end_date: end, created_by: userId, is_active: true,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Program created");
    onDone();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} className="bg-input/50" /></div>
      <div className="space-y-2"><Label>Description</Label><Textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} className="bg-input/50 resize-none" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Total days</Label>
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="bg-input/50"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="60">60 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
              <SelectItem value="120">120 days</SelectItem>
              <SelectItem value="180">180 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label>Start date</Label><Input type="date" value={start} onChange={e => setStart(e.target.value)} className="bg-input/50" /></div>
      </div>
      <Button onClick={submit} disabled={busy} className="w-full bg-gradient-primary">{busy ? "Creating..." : "Create program"}</Button>
    </div>
  );
}
