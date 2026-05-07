import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function CountdownTimer({ to, className }: { to: string | Date; className?: string }) {
  const target = new Date(to).getTime();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);
  const diff = target - now;
  const overdue = diff <= 0;
  const abs = Math.abs(diff);
  const d = Math.floor(abs / 86400000);
  const h = Math.floor((abs % 86400000) / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);
  const s = Math.floor((abs % 60000) / 1000);

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-mono",
      overdue ? "text-destructive" : abs < 3600000 ? "text-warning" : "text-muted-foreground",
      className
    )}>
      <Clock className="h-3 w-3" />
      {overdue ? "Overdue " : ""}
      {d > 0 && `${d}d `}{`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`}
    </span>
  );
}
