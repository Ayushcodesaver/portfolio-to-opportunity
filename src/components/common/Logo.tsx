import { Link } from "react-router-dom";
import { Hammer } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2 group", className)}>
      <div className="relative">
        <div className="absolute inset-0 bg-primary/40 blur-md group-hover:blur-lg transition-all" />
        <div className="relative bg-gradient-primary p-2 rounded-lg">
          <Hammer className="h-5 w-5 text-primary-foreground" />
        </div>
      </div>
      {showText && (
        <span className="text-xl font-bold text-gradient tracking-tight">DevForge</span>
      )}
    </Link>
  );
}
