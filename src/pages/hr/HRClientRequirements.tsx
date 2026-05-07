import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, PageLoader, EmptyState } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Plus, Pencil, History, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function HRClientRequirements() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["hr-requirements"],
    queryFn: async () => (await supabase.from("client_requirements").select("*").order("updated_at", { ascending: false })).data ?? [],
  });

  useEffect(() => {
    const ch = supabase.channel("hr-reqs-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "client_requirements" }, () => qc.invalidateQueries({ queryKey: ["hr-requirements"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const toggle = async (r: any) => {
    await supabase.from("client_requirements").update({ is_active: !r.is_active }).eq("id", r.id);
    qc.invalidateQueries({ queryKey: ["hr-requirements"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this requirement?")) return;
    await supabase.from("client_requirements").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["hr-requirements"] });
  };

  return (
    <div className="container max-w-5xl py-8">
      <PageHeader title="Client Requirements" description="Push specs and design guidelines to all interns. Versioned automatically."
        action={
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
            <DialogTrigger asChild><Button className="bg-gradient-primary" onClick={() => setEditing(null)}><Plus className="h-4 w-4 mr-1.5" />New requirement</Button></DialogTrigger>
            <DialogContent className="glass-strong max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editing ? "Update requirement" : "New requirement"}</DialogTitle></DialogHeader>
              <ReqForm existing={editing} userId={user?.id}
                onDone={() => { setOpen(false); setEditing(null); qc.invalidateQueries({ queryKey: ["hr-requirements"] }); }} />
            </DialogContent>
          </Dialog>
        }
      />
      {isLoading ? <PageLoader /> : (data ?? []).length === 0 ? (
        <EmptyState icon={FileText} title="No requirements yet" description="Create your first client requirement document." />
      ) : (
        <div className="space-y-3">
          {data!.map((r: any) => (
            <div key={r.id} className="glass rounded-xl p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{r.title}</h3>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/20 text-primary-glow font-bold">v{r.version}</span>
                    <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full ${r.is_active ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"}`}>{r.is_active ? "active" : "inactive"}</span>
                  </div>
                  {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                  <p className="text-xs text-muted-foreground mt-1">Updated {format(new Date(r.updated_at), "PP p")}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(r); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => toggle(r)}><Power className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3 mt-3 p-3 rounded-lg bg-muted/30">{r.content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReqForm({ existing, userId, onDone }: { existing: any; userId?: string; onDone: () => void }) {
  const [title, setTitle] = useState(existing?.title ?? "");
  const [desc, setDesc] = useState(existing?.description ?? "");
  const [content, setContent] = useState(existing?.content ?? "");
  const [active, setActive] = useState(existing?.is_active ?? true);
  const [changeNote, setChangeNote] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!title.trim() || !content.trim() || !userId) return toast.error("Title and content required");
    setBusy(true);

    if (existing) {
      // snapshot current to history first
      await supabase.from("client_requirement_versions").insert({
        requirement_id: existing.id, version: existing.version,
        title: existing.title, description: existing.description, content: existing.content,
        changed_by: userId, change_note: changeNote || `Updated by HR`,
      });
      const { error } = await supabase.from("client_requirements").update({
        title, description: desc, content, is_active: active, version: existing.version + 1,
      }).eq("id", existing.id);
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success(`Updated to v${existing.version + 1}`);
    } else {
      const { error } = await supabase.from("client_requirements").insert({
        title, description: desc, content, is_active: active, version: 1, created_by: userId,
      });
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Requirement created");
    }
    onDone();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} className="bg-input/50" /></div>
      <div className="space-y-2"><Label>Short description</Label><Input value={desc} onChange={e => setDesc(e.target.value)} className="bg-input/50" /></div>
      <div className="space-y-2"><Label>Content</Label><Textarea value={content} onChange={e => setContent(e.target.value)} rows={10} className="bg-input/50 resize-none font-mono text-sm" placeholder="Specs, design tokens, links, etc." /></div>
      {existing && <div className="space-y-2"><Label>Change note (optional)</Label><Input value={changeNote} onChange={e => setChangeNote(e.target.value)} className="bg-input/50" placeholder="What changed?" /></div>}
      <div className="flex items-center justify-between"><Label>Active</Label><Switch checked={active} onCheckedChange={setActive} /></div>
      <Button onClick={submit} disabled={busy} className="w-full bg-gradient-primary">{busy ? "Saving..." : existing ? "Save new version" : "Create"}</Button>
    </div>
  );
}
