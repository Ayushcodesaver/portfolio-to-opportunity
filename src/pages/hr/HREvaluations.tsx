import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, PageLoader, EmptyState } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardCheck, Star, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const CATEGORIES = ["code_quality", "communication", "problem_solving", "initiative", "teamwork"] as const;
const LABELS: Record<string, string> = {
  code_quality: "Code quality", communication: "Communication", problem_solving: "Problem solving", initiative: "Initiative", teamwork: "Teamwork",
};

export default function HREvaluations() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: interns } = useQuery({
    queryKey: ["interns-list"],
    queryFn: async () => (await supabase.from("user_roles").select("user_id, profiles!inner(id, full_name, username)").eq("role", "intern")).data ?? [],
  });

  const { data: evals, isLoading } = useQuery({
    queryKey: ["hr-evals"],
    queryFn: async () => (await supabase.from("evaluations").select("*, profiles:intern_id(full_name, username)").order("created_at", { ascending: false })).data ?? [],
  });

  return (
    <div className="container max-w-5xl py-8">
      <PageHeader title="Evaluations" description="Rate interns across 5 categories."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="bg-gradient-primary"><Plus className="h-4 w-4 mr-1.5" />New evaluation</Button></DialogTrigger>
            <DialogContent className="glass-strong max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>New evaluation</DialogTitle></DialogHeader>
              <EvalForm interns={interns ?? []} hrId={user?.id}
                onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["hr-evals"] }); }} />
            </DialogContent>
          </Dialog>
        }
      />
      {isLoading ? <PageLoader /> : (evals ?? []).length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="No evaluations yet" description="Start by rating an intern." />
      ) : (
        <div className="space-y-3">
          {evals!.map((e: any) => {
            const avg = CATEGORIES.reduce((s, c) => s + (e[c] ?? 0), 0) / 5;
            return (
              <div key={e.id} className="glass rounded-xl p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold">{e.profiles?.full_name} <span className="text-muted-foreground text-sm">@{e.profiles?.username}</span></p>
                    <p className="text-xs text-muted-foreground">{format(new Date(e.created_at), "PP")}</p>
                  </div>
                  <div className="flex items-center gap-1 text-primary font-bold"><Star className="h-4 w-4 fill-primary" /> {avg.toFixed(1)}/5</div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
                  {CATEGORIES.map(c => (
                    <div key={c} className="text-center p-2 rounded-lg bg-muted/30">
                      <p className="text-[10px] uppercase text-muted-foreground">{LABELS[c]}</p>
                      <p className="font-bold text-primary">{e[c] ?? "—"}/5</p>
                    </div>
                  ))}
                </div>
                {e.comments && <p className="text-sm text-muted-foreground italic">"{e.comments}"</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EvalForm({ interns, hrId, onDone }: { interns: any[]; hrId?: string; onDone: () => void }) {
  const [internId, setInternId] = useState("");
  const [scores, setScores] = useState<Record<string, number>>({ code_quality: 3, communication: 3, problem_solving: 3, initiative: 3, teamwork: 3 });
  const [comments, setComments] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!internId || !hrId) return toast.error("Select an intern");
    setBusy(true);
    const { error } = await supabase.from("evaluations").insert({ intern_id: internId, hr_id: hrId, ...scores, comments });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Evaluation saved");
    onDone();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Intern</Label>
        <Select value={internId} onValueChange={setInternId}>
          <SelectTrigger className="bg-input/50"><SelectValue placeholder="Select intern" /></SelectTrigger>
          <SelectContent>{interns.map((i: any) => <SelectItem key={i.profiles.id} value={i.profiles.id}>{i.profiles.full_name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {CATEGORIES.map(c => (
        <div key={c} className="space-y-1">
          <div className="flex justify-between text-sm"><Label>{LABELS[c]}</Label><span className="font-bold text-primary">{scores[c]}/5</span></div>
          <input type="range" min={1} max={5} value={scores[c]} onChange={e => setScores({ ...scores, [c]: Number(e.target.value) })} className="w-full accent-primary" />
        </div>
      ))}
      <div className="space-y-2"><Label>Comments</Label><Textarea value={comments} onChange={e => setComments(e.target.value)} rows={3} className="bg-input/50 resize-none" /></div>
      <Button onClick={submit} disabled={busy} className="w-full bg-gradient-primary">{busy ? "Saving..." : "Save evaluation"}</Button>
    </div>
  );
}
