import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export type GlobalNotification = {
  id: string;
  title: string;
  body: string;
  priority: "low" | "medium" | "high" | "urgent";
  category: string;
  link: string | null;
  created_by: string | null;
  created_at: string;
};

export function useGlobalNotifications() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["global-notifications", user?.id],
    queryFn: async () => {
      const [notifs, reads] = await Promise.all([
        supabase.from("global_notifications").select("*").order("created_at", { ascending: false }).limit(100),
        user ? supabase.from("notification_reads").select("notification_id").eq("user_id", user.id) : Promise.resolve({ data: [] as any[] }),
      ]);
      const readSet = new Set((reads.data ?? []).map((r: any) => r.notification_id));
      return (notifs.data ?? []).map((n: any) => ({ ...n, is_read: readSet.has(n.id) })) as (GlobalNotification & { is_read: boolean })[];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("global-notifs-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "global_notifications" }, () => {
        qc.invalidateQueries({ queryKey: ["global-notifications"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "notification_reads", filter: `user_id=eq.${user.id}` }, () => {
        qc.invalidateQueries({ queryKey: ["global-notifications"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, qc]);

  const markRead = async (id: string) => {
    if (!user) return;
    await supabase.from("notification_reads").upsert({ notification_id: id, user_id: user.id }, { onConflict: "notification_id,user_id" });
    qc.invalidateQueries({ queryKey: ["global-notifications"] });
  };

  const unreadCount = (query.data ?? []).filter(n => !n.is_read).length;
  return { ...query, markRead, unreadCount };
}
