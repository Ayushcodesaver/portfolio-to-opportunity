import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, PageLoader, EmptyState } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { Megaphone, Plus, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function HRBroadcast() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["hr-broadcast"],
    queryFn: async () => {
      const [notifs, reads] = await Promise.all([
        supabase.from("global_notifications").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("notification_reads").select("notification_id, user_id"),
      ]);
      const readMap = new Map<string, number>();
      (reads.data ?? []).forEach((r: any) => readMap.set(r.notification_id, (readMap.get(r.notification_id) ?? 0) + 1));
      return (notifs.data ?? []).map((n: any) => ({ ...n, reads: readMap.get(n.id) ?? 0 }));
    },
  });

  const { data: internCount } = useQuery({
    queryKey: ["intern-count"],
    queryFn: async () => (await supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "intern")).count ?? 0,
  });

  useEffect(() => {
    const ch = supabase.channel("hr-broadcast-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "global_notifications" }, () => qc.invalidateQueries({ queryKey: ["hr-broadcast"] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "notification_reads" }, () => qc.invalidateQueries({ queryKey: ["hr-broadcast"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const remove = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    await supabase.from("global_notifications").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["hr-broadcast"] });
  };

  return (
    <div className="container max-w-4xl py-8">
      <PageHeader title="Global Announcements" description="Real-time broadcast to all interns."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="bg-gradient-primary"><Plus className="h-4 w-4 mr-1.5" />New broadcast</Button></DialogTrigger>
            <DialogContent className="glass-strong">
              <DialogHeader><DialogTitle>Send announcement</DialogTitle></DialogHeader>
              <BroadcastForm userId={user?.id} onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["hr-broadcast"] }); }} />
            </DialogContent>
          </Dialog>
        }
      />
      {isLoading ? <PageLoader /> : (data ?? []).length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements yet" description="Send your first broadcast." />
      ) : (
        <div className="space-y-3">
          {data!.map((n: any) => (
            <div key={n.id} className="glass rounded-xl p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold">{n.title}</h3>
                    <PriorityBadge priority={n.priority} />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{n.category}</span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{n.body}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove(n.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</span>
                <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> {n.reads} / {internCount ?? 0} read</span>
                <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-primary" style={{ width: `${internCount ? (n.reads / internCount) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BroadcastForm({ userId, onDone }: { userId?: string; onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<"low"|"medium"|"high"|"urgent">("medium");
  const [category, setCategory] = useState("announcement");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!title.trim() || !body.trim() || !userId) return toast.error("Title and body required");
    setBusy(true);
    const { error } = await supabase.from("global_notifications").insert({
      title, body, priority, category, link: link || null, created_by: userId,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Broadcast sent to all interns");
    onDone();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} className="bg-input/50" /></div>
      <div className="space-y-2"><Label>Message</Label><Textarea value={body} onChange={e => setBody(e.target.value)} rows={5} className="bg-input/50 resize-none" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
            <SelectTrigger className="bg-input/50"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="bg-input/50"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="announcement">Announcement</SelectItem>
              <SelectItem value="event">Event</SelectItem>
              <SelectItem value="reminder">Reminder</SelectItem>
              <SelectItem value="client_update">Client Update</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2"><Label>Link (optional)</Label><Input value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." className="bg-input/50" /></div>
      <Button onClick={submit} disabled={busy} className="w-full bg-gradient-primary">{busy ? "Sending..." : "🚀 Broadcast now"}</Button>
    </div>
  );
}
