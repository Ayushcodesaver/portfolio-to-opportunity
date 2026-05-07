import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  low: "bg-muted text-muted-foreground border border-border",
  medium: "bg-info/15 text-info border border-info/30",
  high: "bg-warning/15 text-warning border border-warning/30",
  urgent: "bg-destructive/20 text-destructive border border-destructive/40 animate-pulse-glow",
};

export function PriorityBadge({ priority, className }: { priority: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold", styles[priority] ?? styles.medium, className)}>
      {priority}
    </span>
  );
}
