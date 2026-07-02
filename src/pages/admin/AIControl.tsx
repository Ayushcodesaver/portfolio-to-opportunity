import { useEffect, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/dashboard/StatCard";
import { Loader2, Cpu, Zap, Users, AlertTriangle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Stats {
  totalCalls: number;
  totalTokens: number;
  uniqueUsers: number;
  errors: number;
}

export default function AIControl() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ totalCalls: 0, totalTokens: 0, uniqueUsers: 0, errors: 0 });
  const [aiEnabled, setAiEnabled] = useState(true);
  const [dailyLimit, setDailyLimit] = useState<number>(50);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("ai_usage")
        .select("user_id, tokens_used, created_at")
        .gte("created_at", since);
      const rows = data ?? [];
      setStats({
        totalCalls: rows.length,
        totalTokens: rows.reduce((s, r: any) => s + (r.tokens_used ?? 0), 0),
        uniqueUsers: new Set(rows.map((r: any) => r.user_id)).size,
        errors: 0,
      });
      const { data: settings } = await supabase.from("admin_settings").select("key, value");
      const map = new Map((settings ?? []).map((r: any) => [r.key, r.value]));
      if (map.has("ai_enabled")) setAiEnabled(map.get("ai_enabled") === "true");
      if (map.has("ai_daily_limit")) setDailyLimit(Number(map.get("ai_daily_limit")) || 50);
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const rows = [
      { key: "ai_enabled", value: aiEnabled ? "true" : "false" },
      { key: "ai_daily_limit", value: String(dailyLimit) },
    ];
    for (const r of rows) {
      await supabase.from("admin_settings").upsert(r, { onConflict: "key" });
    }
    setSaving(false);
    toast.success("AI settings saved");
  };

  if (loading) {
    return (
      <div className="container max-w-6xl py-8 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <PageHeader title="AI Control" description="Usage, limits, and gateway health (last 7 days)." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total calls" value={stats.totalCalls} icon={Cpu} />
        <StatCard label="Tokens used" value={stats.totalTokens.toLocaleString()} icon={Zap} />
        <StatCard label="Active users" value={stats.uniqueUsers} icon={Users} />
        <StatCard label="Errors" value={stats.errors} icon={AlertTriangle} />
      </div>

      <div className="glass rounded-xl p-6 space-y-4 max-w-xl">
        <h3 className="text-lg font-semibold">Gateway configuration</h3>

        <div className="flex items-center justify-between">
          <div>
            <Label>AI Assistant enabled</Label>
            <p className="text-xs text-muted-foreground">Master switch for the intern AI features.</p>
          </div>
          <Switch checked={aiEnabled} onCheckedChange={setAiEnabled} />
        </div>

        <div className="space-y-2">
          <Label>Per-user daily message limit</Label>
          <Input
            type="number"
            min={1}
            max={1000}
            value={dailyLimit}
            onChange={(e) => setDailyLimit(Number(e.target.value))}
            className="bg-input/50 max-w-[160px]"
          />
          <p className="text-xs text-muted-foreground">Applies to free-plan users. Premium users are unlimited.</p>
        </div>

        <Button onClick={save} disabled={saving} className="bg-gradient-primary">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
        </Button>
      </div>
    </div>
  );
}
