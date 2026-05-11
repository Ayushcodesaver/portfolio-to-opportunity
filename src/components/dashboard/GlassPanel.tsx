import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function GlassPanel({
  children, className, tilt = true, accent = false,
}: { children: ReactNode; className?: string; tilt?: boolean; accent?: boolean }) {
  return (
    <div
      className={cn(
        accent ? "panel-3d-violet" : "panel-3d",
        tilt && "tilt-3d-soft",
        "p-5 sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PanelHeader({
  icon: Icon, title, action,
}: { icon?: any; title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-primary" />}
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      {action}
    </div>
  );
}
