import { useGlobalNotifications } from "@/hooks/useGlobalNotifications";
import { PageHeader, PageLoader, EmptyState } from "@/components/common/PageHeader";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { Megaphone, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function GlobalAnnouncements() {
  const { data, isLoading, markRead } = useGlobalNotifications();

  return (
    <div className="container max-w-3xl py-8">
      <PageHeader title="Announcements" description="Live updates from your HR team." />
      {isLoading ? <PageLoader /> : (data ?? []).length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements yet" description="When HR posts something, it'll appear here in real time." />
      ) : (
        <div className="space-y-3">
          {data!.map((n) => (
            <div key={n.id}
              onMouseEnter={() => !n.is_read && markRead(n.id)}
              className={`glass rounded-xl p-5 transition-all ${n.is_read ? "opacity-70" : "border-primary/40"}`}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold">{n.title}</h3>
                    <PriorityBadge priority={n.priority} />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{n.category}</span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{n.body}</p>
                  {n.link && (
                    <a href={n.link} target="_blank" rel="noreferrer"
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-2">
                      Open link <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
