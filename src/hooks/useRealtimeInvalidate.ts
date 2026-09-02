import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Sub = { table: string; filter?: string; keys: string[][] };

/**
 * Subscribe to postgres_changes on multiple tables and invalidate
 * the listed react-query keys whenever a row changes.
 */
export function useRealtimeInvalidate(channelName: string, subs: Sub[], enabled = true) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!enabled || subs.length === 0) return;
    const uniqueName = `${channelName}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    let ch: any = supabase.channel(uniqueName);
    subs.forEach((s) => {
      const cfg: any = { event: "*", schema: "public", table: s.table };
      if (s.filter) cfg.filter = s.filter;
      ch = ch.on("postgres_changes", cfg, () => {
        s.keys.forEach((k) => qc.invalidateQueries({ queryKey: k }));
      });
    });
    ch.subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, enabled, JSON.stringify(subs)]);
}
