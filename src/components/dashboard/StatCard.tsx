import { GlassPanel } from "./GlassPanel";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon, label, value, hint, accent = false, className,
}: {
  icon?: any; label: string; value: React.ReactNode; hint?: string;
  accent?: boolean; className?: string;
}) {
  return (
    <GlassPanel accent={accent} className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
        {Icon && <Icon className="h-3.5 w-3.5 text-primary" />}
        {label}
      </div>
      <div className="text-3xl font-bold leading-none">{value}</div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </GlassPanel>
  );
}
