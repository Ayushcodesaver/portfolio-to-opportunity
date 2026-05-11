import { cn } from "@/lib/utils";

export type StatusKind =
  | "in_progress" | "ready" | "review" | "done" | "backlog"
  | "approved" | "submitted" | "rejected" | "pending" | "draft" | "todo";

const MAP: Record<StatusKind, { label: string; cssVar: string }> = {
  in_progress: { label: "In Progress",       cssVar: "--status-progress" },
  ready:       { label: "Ready to Design",   cssVar: "--status-ready" },
  review:      { label: "Final Review",      cssVar: "--status-review" },
  done:        { label: "Completed",         cssVar: "--status-done" },
  backlog:     { label: "Backlog",           cssVar: "--status-backlog" },
  approved:    { label: "Approved",          cssVar: "--status-done" },
  submitted:   { label: "Submitted",         cssVar: "--status-progress" },
  rejected:    { label: "Needs Revision",    cssVar: "--status-review" },
  pending:     { label: "Pending",           cssVar: "--status-ready" },
  draft:       { label: "Draft",             cssVar: "--status-backlog" },
  todo:        { label: "To Do",             cssVar: "--status-backlog" },
};

export function StatusPill({
  kind, label, className,
}: { kind: StatusKind; label?: string; className?: string }) {
  const m = MAP[kind] ?? MAP.backlog;
  const style = {
    color: `hsl(var(${m.cssVar}))`,
    backgroundColor: `hsl(var(${m.cssVar}) / 0.12)`,
    border: `1px solid hsl(var(${m.cssVar}) / 0.35)`,
    boxShadow: `0 0 12px -2px hsl(var(${m.cssVar}) / 0.45) inset`,
  } as React.CSSProperties;
  return <span style={style} className={cn("status-pill", className)}>{label ?? m.label}</span>;
}
