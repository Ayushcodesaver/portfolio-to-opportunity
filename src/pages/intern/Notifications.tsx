import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, PageLoader, EmptyState } from "@/components/common/PageHeader";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Notifications() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("notifications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(50);
      return data ?? [];
    },
    enabled: !!user,
  });

  return (
    <div className="container max-w-3xl py-8">
      <PageHeader title="Notifications" />
      {isLoading ? <PageLoader /> : data && data.length > 0 ? (
        <div className="space-y-2">
          {data.map((n: any) => (
            <div key={n.id} className={`glass rounded-lg p-4 flex gap-3 ${!n.is_read ? "border-primary/40" : ""}`}>
              <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center"><Bell className="h-4 w-4 text-primary" /></div>
              <div className="flex-1">
                <p className="text-sm font-medium">{n.title}</p>
                {n.body && <p className="text-xs text-muted-foreground">{n.body}</p>}
                <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={Bell} title="No notifications yet" description="When something happens, we'll let you know here." />
      )}
    </div>
  );
}
