import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader, PageLoader } from "@/components/common/PageHeader";
import { Hash, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

type Channel = { id: string; name: string; description: string };
type Msg = { id: string; channel_id: string; user_id: string; content: string; created_at: string; profile?: any };

export default function Community() {
  const { user, isHR, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: channels } = useQuery({
    queryKey: ["channels"],
    queryFn: async () => {
      const { data } = await supabase.from("channels").select("*").order("name");
      return (data ?? []) as Channel[];
    },
  });

  useEffect(() => {
    if (!activeId && channels?.length) setActiveId(channels[0].id);
  }, [channels, activeId]);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["channel-messages", activeId],
    enabled: !!activeId,
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("channel_messages").select("*")
        .eq("channel_id", activeId!).order("created_at", { ascending: true }).limit(200);
      const ids = Array.from(new Set((rows ?? []).map(r => r.user_id)));
      const profs = ids.length
        ? (await supabase.from("profiles").select("id, username, full_name, avatar_url").in("id", ids)).data ?? []
        : [];
      const pmap = new Map(profs.map((p: any) => [p.id, p]));
      return (rows ?? []).map((r: any) => ({ ...r, profile: pmap.get(r.user_id) })) as Msg[];
    },
  });

  useEffect(() => {
    if (!activeId) return;
    const ch = supabase.channel(`chan-${activeId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "channel_messages", filter: `channel_id=eq.${activeId}` },
        () => qc.invalidateQueries({ queryKey: ["channel-messages", activeId] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeId, qc]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeId) return;
    const content = text.trim();
    if (!content) return;
    if (content.length > 2000) { toast.error("Message too long (max 2000 chars)"); return; }
    setText("");
    const { error } = await supabase.from("channel_messages").insert({ channel_id: activeId, user_id: user.id, content });
    if (error) toast.error(error.message);
  };

  const del = async (id: string) => {
    await supabase.from("channel_messages").delete().eq("id", id);
  };

  const createChannel = async () => {
    const name = prompt("Channel name (lowercase, no spaces)")?.trim().toLowerCase();
    if (!name) return;
    const { error } = await supabase.from("channels").insert({ name, description: "" });
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["channels"] });
  };

  return (
    <div className="container max-w-7xl py-8">
      <PageHeader title="Community" description="Chat with interns, HR, and the team — in real time." />
      <div className="grid md:grid-cols-[240px_1fr] gap-4 mt-6 h-[calc(100vh-220px)]">
        <aside className="glass rounded-xl p-3 overflow-y-auto">
          <div className="flex items-center justify-between px-2 mb-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Channels</p>
            {(isHR || isAdmin) && <button onClick={createChannel} className="text-xs text-primary hover:underline">+ New</button>}
          </div>
          {channels?.map(c => (
            <button key={c.id} onClick={() => setActiveId(c.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition ${
                activeId === c.id ? "bg-primary/15 text-primary" : "hover:bg-card/60 text-muted-foreground"
              }`}>
              <Hash className="h-4 w-4" /> {c.name}
            </button>
          ))}
        </aside>

        <section className="glass rounded-xl flex flex-col min-h-0">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoading ? <PageLoader /> : messages?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No messages yet — be the first to say hi 👋</p>
            ) : (
              messages?.map(m => (
                <div key={m.id} className="group flex gap-3">
                  {m.profile?.avatar_url
                    ? <img src={m.profile.avatar_url} className="h-9 w-9 rounded-full object-cover shrink-0" alt="" />
                    : <div className="h-9 w-9 rounded-full bg-primary/20 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-sm">{m.profile?.full_name ?? "User"}</span>
                      <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}</span>
                      {(m.user_id === user?.id || isHR || isAdmin) && (
                        <button onClick={() => del(m.id)} className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <form onSubmit={send} className="border-t border-border/40 p-3 flex gap-2">
            <Input value={text} onChange={e => setText(e.target.value)} placeholder="Message…" disabled={!activeId} />
            <Button type="submit" disabled={!text.trim() || !activeId}><Send className="h-4 w-4" /></Button>
          </form>
        </section>
      </div>
    </div>
  );
}
