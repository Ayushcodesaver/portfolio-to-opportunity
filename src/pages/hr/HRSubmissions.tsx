import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, PageLoader, EmptyState } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { Check, X, ExternalLink, FileText, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function HRSubmissions() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["hr-submissions"],
    queryFn: async () => {
      const { data: subs } = await supabase
        .from("task_submissions")
        .select("*, daily_tasks!inner(*), profiles:intern_id(full_name, username, avatar_url)")
        .order("submitted_at", { ascending: false }).limit(200);
      return subs ?? [];
    },
  });

  useEffect(() => {
    const ch = supabase.channel("hr-subs-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "task_submissions" }, () => qc.invalidateQueries({ queryKey: ["hr-submissions"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const filterFn = (t: "submitted" | "approved" | "rejected" | "all") => (s: any) => t === "all" ? true : s.status === t;

  return (
    <div className="container max-w-5xl py-8">
      <PageHeader title="Task Submissions" description="Review and approve intern work." />
      <Tabs defaultValue="submitted">
        <TabsList className="bg-muted">
          <TabsTrigger value="submitted">Pending Review ({(data ?? []).filter(filterFn("submitted")).length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({(data ?? []).filter(filterFn("approved")).length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({(data ?? []).filter(filterFn("rejected")).length})</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        {(["submitted","approved","rejected","all"] as const).map((t) => (
          <TabsContent value={t} key={t} className="mt-6 space-y-3">
            {isLoading ? <PageLoader /> : (data ?? []).filter(filterFn(t)).length === 0 ? (
              <EmptyState icon={ClipboardCheck} title="Nothing here" description="No submissions match." />
            ) : (data ?? []).filter(filterFn(t)).map((s: any) => <SubCard s={s} hrId={user?.id} key={s.id} />)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function SubCard({ s, hrId }: { s: any; hrId?: string }) {
  const qc = useQueryClient();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedback, setFeedback] = useState(s.feedback ?? "");
  const [busy, setBusy] = useState(false);

  const decide = async (status: "approved" | "rejected") => {
    if (!hrId) return;
    setBusy(true);
    const points = status === "approved" ? s.daily_tasks.points : 0;
    const { error } = await supabase.from("task_submissions").update({
      status, feedback, points_awarded: points, reviewed_at: new Date().toISOString(), reviewed_by: hrId,
    }).eq("id", s.id);
    if (!error && status === "approved") {
      await supabase.from("points_history").insert({
        intern_id: s.intern_id, points, reason: `Task: ${s.daily_tasks.title}`, source_type: "task", source_id: s.id,
      });
      await supabase.from("notifications").insert({
        user_id: s.intern_id, type: "task_approved", title: "Task approved 🎉",
        body: `"${s.daily_tasks.title}" was approved (+${points} pts)`, link: "/tasks",
      });
    }
    if (!error && status === "rejected") {
      await supabase.from("notifications").insert({
        user_id: s.intern_id, type: "task_rejected", title: "Task needs revision",
        body: `"${s.daily_tasks.title}" — please review feedback.`, link: "/tasks",
      });
    }
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(status === "approved" ? "Approved" : "Rejected");
    setFeedbackOpen(false);
    qc.invalidateQueries({ queryKey: ["hr-submissions"] });
  };

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-start gap-3 mb-3">
        <div className="h-9 w-9 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold shrink-0">
          {s.profiles?.full_name?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{s.profiles?.full_name} <span className="text-muted-foreground">@{s.profiles?.username}</span></p>
          <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(s.submitted_at), { addSuffix: true })}</p>
        </div>
        <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold ${
          s.status === "approved" ? "bg-success/20 text-success" : s.status === "rejected" ? "bg-destructive/20 text-destructive" : "bg-info/20 text-info"
        }`}>{s.status}</span>
      </div>

      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary-glow font-bold">Day {s.daily_tasks.day_number}</span>
        <PriorityBadge priority={s.daily_tasks.priority} />
        <span className="text-xs text-primary font-bold">+{s.daily_tasks.points} pts</span>
      </div>
      <h3 className="font-semibold mb-2">{s.daily_tasks.title}</h3>

      {s.content && <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-3 p-3 rounded-lg bg-muted/30">{s.content}</p>}
      <div className="flex flex-wrap gap-2 mb-3">
        {s.submission_url && <a href={s.submission_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1"><ExternalLink className="h-3 w-3" /> Link</a>}
        {s.file_url && <a href={s.file_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1"><FileText className="h-3 w-3" /> File</a>}
      </div>

      {s.feedback && (
        <div className="p-3 rounded-lg bg-muted/40 border border-border mb-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">HR Feedback</p>
          <p className="text-sm">{s.feedback}</p>
        </div>
      )}

      {s.status === "submitted" && (
        <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
          <div className="flex gap-2">
            <DialogTrigger asChild><Button size="sm" className="bg-gradient-primary"><Check className="h-3.5 w-3.5 mr-1.5" /> Review</Button></DialogTrigger>
          </div>
          <DialogContent className="glass-strong">
            <DialogHeader><DialogTitle>Review submission</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={4} className="bg-input/50 resize-none" placeholder="Optional feedback..." />
              <div className="flex gap-2">
                <Button onClick={() => decide("approved")} disabled={busy} className="flex-1 bg-success hover:bg-success/90 text-background"><Check className="h-4 w-4 mr-1.5" /> Approve</Button>
                <Button onClick={() => decide("rejected")} disabled={busy} variant="outline" className="flex-1 border-destructive text-destructive hover:bg-destructive/10"><X className="h-4 w-4 mr-1.5" /> Reject</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
