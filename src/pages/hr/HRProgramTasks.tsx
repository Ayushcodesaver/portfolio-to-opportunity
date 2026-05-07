import { useState } from "react";
import { useParams, Link } from "react-router-dom";
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
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { Plus, Trash2, ArrowLeft, Target } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function HRProgramTasks() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: program } = useQuery({
    queryKey: ["program", id],
    queryFn: async () => (await supabase.from("internship_programs").select("*").eq("id", id!).single()).data,
    enabled: !!id,
  });

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["program-tasks", id],
    queryFn: async () => (await supabase.from("daily_tasks").select("*").eq("program_id", id!).order("day_number")).data ?? [],
    enabled: !!id,
  });

  const remove = async (tid: string) => {
    if (!confirm("Delete this task?")) return;
    await supabase.from("daily_tasks").delete().eq("id", tid);
    qc.invalidateQueries({ queryKey: ["program-tasks", id] });
  };

  return (
    <div className="container max-w-5xl py-8">
      <Link to="/hr/programs" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3"><ArrowLeft className="h-3 w-3" /> Back to programs</Link>
      <PageHeader
        title="Program Tasks"
        description={program ? `${program.title} — ${program.total_days} days` : ""}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="bg-gradient-primary"><Plus className="h-4 w-4 mr-1.5" />New task</Button></DialogTrigger>
            <DialogContent className="glass-strong max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Add daily task</DialogTitle></DialogHeader>
              <TaskForm programId={id!} totalDays={program?.total_days ?? 90} userId={user?.id}
                onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["program-tasks", id] }); }} />
            </DialogContent>
          </Dialog>
        }
      />
      {isLoading ? <PageLoader /> : (tasks ?? []).length === 0 ? (
        <EmptyState icon={Target} title="No tasks yet" description="Add your first task for this program." />
      ) : (
        <div className="space-y-3">
          {tasks!.map((t: any) => (
            <div key={t.id} className="glass rounded-xl p-5 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary-glow font-bold">Day {t.day_number}</span>
                  <PriorityBadge priority={t.priority} />
                  <span className="text-xs text-primary font-bold">+{t.points} pts</span>
                  {t.deadline_at && <span className="text-xs text-muted-foreground">⏰ {format(new Date(t.deadline_at), "PP p")}</span>}
                </div>
                <h3 className="font-semibold">{t.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 whitespace-pre-wrap">{t.description}</p>
              </div>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove(t.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TaskForm({ programId, totalDays, userId, onDone }: { programId: string; totalDays: number; userId?: string; onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [day, setDay] = useState("1");
  const [points, setPoints] = useState("10");
  const [priority, setPriority] = useState<"low"|"medium"|"high">("medium");
  const [deadline, setDeadline] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!title.trim() || !userId) return;
    setBusy(true);
    const { error } = await supabase.from("daily_tasks").insert({
      program_id: programId, title, description: desc, day_number: Number(day),
      points: Number(points), priority, deadline_at: deadline ? new Date(deadline).toISOString() : null,
      created_by: userId,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Task created");
    onDone();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} className="bg-input/50" /></div>
      <div className="space-y-2"><Label>Description</Label><Textarea value={desc} onChange={e => setDesc(e.target.value)} rows={4} className="bg-input/50 resize-none" /></div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2"><Label>Day (1–{totalDays})</Label><Input type="number" min={1} max={totalDays} value={day} onChange={e => setDay(e.target.value)} className="bg-input/50" /></div>
        <div className="space-y-2"><Label>Points</Label><Input type="number" min={1} value={points} onChange={e => setPoints(e.target.value)} className="bg-input/50" /></div>
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
            <SelectTrigger className="bg-input/50"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2"><Label>Deadline (optional)</Label><Input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} className="bg-input/50" /></div>
      <Button onClick={submit} disabled={busy} className="w-full bg-gradient-primary">{busy ? "Creating..." : "Create task"}</Button>
    </div>
  );
}
