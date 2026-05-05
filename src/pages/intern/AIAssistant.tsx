import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/common/PageHeader";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const QUICK_PROMPTS = [
  "Improve my project description",
  "Review my code for bugs",
  "Suggest a tech stack for an e-commerce app",
  "Write a great commit message for me",
];

export default function AIAssistant() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const newMessages: Msg[] = [...messages, { role: "user", content }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages: newMessages }),
      });
      if (resp.status === 429) { toast.error("Rate limit reached. Try again later."); setLoading(false); return; }
      if (resp.status === 402) { toast.error("AI credits exhausted. Add funds to your workspace."); setLoading(false); return; }
      if (!resp.ok || !resp.body) throw new Error("AI request failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let assistantContent = "";
      setMessages([...newMessages, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl); buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: assistantContent };
                return copy;
              });
            }
          } catch { buf = line + "\n" + buf; break; }
        }
      }
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-5xl py-8 h-screen flex flex-col">
      <PageHeader title="AI Assistant" description="Your coding sidekick — get help with code, descriptions, and more." />

      <div className="flex-1 glass rounded-xl p-6 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="p-4 rounded-full bg-primary/10 mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">How can I help today?</h3>
              <p className="text-sm text-muted-foreground mb-6">Ask me anything about code, projects, or career.</p>
              <div className="grid sm:grid-cols-2 gap-2 max-w-xl w-full">
                {QUICK_PROMPTS.map((p) => (
                  <button key={p} onClick={() => send(p)}
                    className="text-left text-sm p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors">
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  m.role === "user" ? "bg-card text-foreground" : "bg-gradient-primary text-primary-foreground"
                }`}>
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{m.content || "..."}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))
          )}
          {loading && messages[messages.length-1]?.role === "user" && (
            <div className="flex justify-start"><div className="bg-gradient-primary rounded-2xl px-4 py-3"><Loader2 className="h-4 w-4 animate-spin" /></div></div>
          )}
          <div ref={endRef} />
        </div>

        <div className="mt-4 flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask anything..."
            rows={1}
            className="bg-input/50 resize-none min-h-[44px]"
          />
          <Button onClick={() => send()} disabled={loading || !input.trim()} className="bg-gradient-primary self-end">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
