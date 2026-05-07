import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, PageLoader, EmptyState } from "@/components/common/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Inbox, Send } from "lucide-react";
import { format } from "date-fns";

export default function HRInbox() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [text, setText] = useState("");

  const { data: convos, isLoading } = useQuery({
    queryKey: ["hr-convos", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("conversations").select("*").or(`user_a.eq.${user!.id},user_b.eq.${user!.id}`).order("last_message_at", { ascending: false });
      const partnerIds = (data ?? []).map((c: any) => c.user_a === user!.id ? c.user_b : c.user_a);
      const { data: profs } = partnerIds.length ? await supabase.from("profiles").select("id, full_name, username, avatar_url").in("id", partnerIds) : { data: [] };
      return (data ?? []).map((c: any) => {
        const pid = c.user_a === user!.id ? c.user_b : c.user_a;
        return { ...c, partner: (profs ?? []).find((p: any) => p.id === pid) };
      });
    },
    enabled: !!user,
  });

  const { data: interns } = useQuery({
    queryKey: ["interns-list"],
    queryFn: async () => (await supabase.from("user_roles").select("user_id, profiles!inner(id, full_name, username)").eq("role", "intern")).data ?? [],
  });

  const { data: messages } = useQuery({
    queryKey: ["messages", activeId],
    queryFn: async () => (await supabase.from("messages").select("*").eq("conversation_id", activeId!).order("created_at")).data ?? [],
    enabled: !!activeId,
  });

  useEffect(() => {
    if (!activeId) return;
    const ch = supabase.channel(`msgs-${activeId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeId}` }, () => {
        qc.invalidateQueries({ queryKey: ["messages", activeId] });
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeId, qc]);

  const startConvo = async (internId: string) => {
    const { data: existing } = await supabase.from("conversations").select("*")
      .or(`and(user_a.eq.${user!.id},user_b.eq.${internId}),and(user_a.eq.${internId},user_b.eq.${user!.id})`).maybeSingle();
    if (existing) { setActiveId(existing.id); return; }
    const { data, error } = await supabase.from("conversations").insert({ user_a: user!.id, user_b: internId }).select().single();
    if (error) return;
    setActiveId(data.id);
    qc.invalidateQueries({ queryKey: ["hr-convos"] });
  };

  const send = async () => {
    if (!text.trim() || !activeId || !user) return;
    await supabase.from("messages").insert({ conversation_id: activeId, sender_id: user.id, content: text });
    await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", activeId);
    setText("");
    qc.invalidateQueries({ queryKey: ["hr-convos"] });
  };

  return (
    <div className="container max-w-6xl py-8">
      <PageHeader title="Inbox" description="Real-time messaging with interns." />
      <div className="grid lg:grid-cols-[300px_1fr] gap-4 h-[70vh]">
        <div className="glass rounded-xl p-3 overflow-y-auto">
          <p className="text-xs uppercase text-muted-foreground tracking-wider px-2 mb-2">Conversations</p>
          {isLoading ? <PageLoader /> : (convos ?? []).map((c: any) => (
            <button key={c.id} onClick={() => setActiveId(c.id)}
              className={`w-full text-left p-2 rounded-lg flex items-center gap-2 hover:bg-muted ${activeId === c.id ? "bg-primary/10" : ""}`}>
              <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold">{c.partner?.full_name?.[0]?.toUpperCase()}</div>
              <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{c.partner?.full_name}</p><p className="text-[11px] text-muted-foreground truncate">@{c.partner?.username}</p></div>
            </button>
          ))}
          <p className="text-xs uppercase text-muted-foreground tracking-wider px-2 mt-4 mb-2">Start new</p>
          {(interns ?? []).slice(0, 30).map((i: any) => (
            <button key={i.profiles.id} onClick={() => startConvo(i.profiles.id)}
              className="w-full text-left p-2 rounded-lg flex items-center gap-2 hover:bg-muted">
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">{i.profiles.full_name?.[0]?.toUpperCase()}</div>
              <span className="text-xs truncate">{i.profiles.full_name}</span>
            </button>
          ))}
        </div>

        <div className="glass rounded-xl flex flex-col">
          {!activeId ? (
            <div className="flex-1 flex items-center justify-center"><EmptyState icon={Inbox} title="Pick a conversation" description="Or start a new one with an intern." /></div>
          ) : (
            <>
              <div className="flex-1 p-4 overflow-y-auto space-y-2">
                {(messages ?? []).map((m: any) => (
                  <div key={m.id} className={`flex ${m.sender_id === user!.id ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${m.sender_id === user!.id ? "bg-gradient-primary text-primary-foreground" : "bg-muted"}`}>
                      {m.content}
                      <p className="text-[10px] opacity-70 mt-0.5">{format(new Date(m.created_at), "HH:mm")}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-border flex gap-2">
                <Input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") send(); }} placeholder="Type a message..." className="bg-input/50" />
                <Button onClick={send} className="bg-gradient-primary"><Send className="h-4 w-4" /></Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
