import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, PageLoader, EmptyState } from "@/components/common/PageHeader";
import { CountdownTimer } from "@/components/common/CountdownTimer";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useEnrollment } from "@/hooks/useEnrollment";
import { CheckCircle2, XCircle, Clock, Upload, Target } from "lucide-react";
import { toast } from "sonner";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { validateUpload, UPLOAD_ACCEPT, MAX_UPLOAD_MB } from "@/lib/uploads";

export default function MyTasks() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: enr, isLoading: enrLoading } = useEnrollment();

  const { data: rows, isLoading } = useQuery({
    queryKey: ["all-tasks", enr?.program?.id, user?.id],
    queryFn: async () => {
      if (!enr) return [];
      const [tasksRes, subsRes] = await Promise.all([
        supabase.from("daily_tasks").select("*").eq("program_id", enr.program.id).order("day_number"),
        supabase.from("task_submissions").select("*").eq("intern_id", user!.id),
      ]);
      const subMap = new Map((subsRes.data ?? []).map((s: any) => [s.task_id, s]));
      return (tasksRes.data ?? []).map((t: any) => ({ ...t, submission: subMap.get(t.id) }));
    },
    enabled: !!enr && !!user,
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("tasks-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_tasks" }, () => qc.invalidateQueries({ queryKey: ["all-tasks"] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "task_submissions", filter: `intern_id=eq.${user.id}` }, () => qc.invalidateQueries({ queryKey: ["all-tasks"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  if (enrLoading) return <PageLoader />;
  if (!enr) return <EmptyState icon={Target} title="No active program" description="Once HR enrolls you, your tasks will show up here." />;

  const filterFn = (mode: "todo" | "submitted" | "approved" | "rejected" | "all") => (t: any) => {
    const s = t.submission?.status;
    if (mode === "all") return true;
    if (mode === "todo") return !s || s === "pending";
    if (mode === "submitted") return s === "submitted";
    if (mode === "approved") return s === "approved";
    if (mode === "rejected") return s === "rejected";
    return true;
  };

  return (
    <div className="container max-w-6xl py-8">
      <PageHeader title="My Tasks" description={`${enr.program.title} — Day ${enr.currentDay}/${enr.program.total_days}`} />
      <Tabs defaultValue="todo">
        <TabsList className="bg-muted">
          <TabsTrigger value="todo">To Do ({(rows ?? []).filter(filterFn("todo")).length})</TabsTrigger>
          <TabsTrigger value="submitted">Submitted ({(rows ?? []).filter(filterFn("submitted")).length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({(rows ?? []).filter(filterFn("approved")).length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({(rows ?? []).filter(filterFn("rejected")).length})</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        {(["todo","submitted","approved","rejected","all"] as const).map((tab) => (
          <TabsContent value={tab} key={tab} className="mt-6 space-y-3">
            {isLoading ? <PageLoader /> : (rows ?? []).filter(filterFn(tab)).length === 0 ? (
              <EmptyState icon={Target} title="Nothing here" description="No tasks match this filter." />
            ) : (rows ?? []).filter(filterFn(tab)).map((t: any) => <TaskCard key={t.id} task={t} currentDay={enr.currentDay} />)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function TaskCard({ task, currentDay }: { task: any; currentDay: number }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState(task.submission?.content ?? "");
  const [submissionUrl, setSubmissionUrl] = useState(task.submission?.submission_url ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const status = task.submission?.status;
  const locked = task.day_number > currentDay;

  const submit = async () => {
    if (!user) return;
    if (!content.trim() && !submissionUrl.trim() && !file && !task.submission?.file_url) {
      toast.error("Add some content, a link, or a file");
      return;
    }
    setBusy(true);
    let fileUrl = task.submission?.file_url ?? null;
    if (file) {
      const path = `${user.id}/${task.id}-${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("project-media").upload(path, file);
      if (error) { setBusy(false); return toast.error(error.message); }
      fileUrl = supabase.storage.from("project-media").getPublicUrl(path).data.publicUrl;
    }
    const payload = {
      task_id: task.id,
      intern_id: user.id,
      content,
      submission_url: submissionUrl || null,
      file_url: fileUrl,
      status: "submitted" as const,
      submitted_at: new Date().toISOString(),
      reviewed_at: null,
      reviewed_by: null,
      feedback: null,
    };
    const { error } = await supabase.from("task_submissions").upsert(payload, { onConflict: "task_id,intern_id" });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Submitted! HR will review it shortly.");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["all-tasks"] });
    qc.invalidateQueries({ queryKey: ["today-tasks"] });
  };

  const pillKind: "approved" | "rejected" | "submitted" | "todo" =
    status === "approved" ? "approved"
    : status === "rejected" ? "rejected"
    : status === "submitted" ? "submitted"
    : "todo";

  return (
    <div className="panel-3d tilt-3d-soft p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary-glow font-bold">Day {task.day_number}</span>
            <PriorityBadge priority={task.priority} />
            <span className="text-xs text-primary font-semibold">+{task.points} pts</span>
          </div>
          <h3 className="font-semibold">{task.title}</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">{task.description}</p>
        </div>
        <StatusPill kind={pillKind} />
      </div>

      {task.deadline_at && !status && <CountdownTimer to={task.deadline_at} className="mb-3" />}

      {task.submission?.feedback && (
        <div className="mt-3 p-3 rounded-lg bg-muted/40 border border-border">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">HR Feedback</p>
          <p className="text-sm">{task.submission.feedback}</p>
        </div>
      )}

      {!locked && status !== "approved" && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-gradient-primary mt-3">
              {status === "rejected" ? "Resubmit" : status === "submitted" ? "Edit submission" : "Submit work"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg glass-strong">
            <DialogHeader><DialogTitle>{task.title}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Description / notes</Label>
                <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5} className="bg-input/50 resize-none" placeholder="Describe what you did..." />
              </div>
              <div className="space-y-2">
                <Label>Link (GitHub, demo, etc.)</Label>
                <Input value={submissionUrl} onChange={(e) => setSubmissionUrl(e.target.value)} placeholder="https://..." className="bg-input/50" />
              </div>
              <div className="space-y-2">
                <Label>File (optional)</Label>
                <label className="flex items-center gap-2 p-3 border border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{file?.name ?? "Click to upload"}</span>
                  <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                </label>
              </div>
              <Button onClick={submit} disabled={busy} className="w-full bg-gradient-primary">
                {busy ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {locked && <p className="text-xs text-muted-foreground mt-2">Unlocks on Day {task.day_number}</p>}
    </div>
  );
}
