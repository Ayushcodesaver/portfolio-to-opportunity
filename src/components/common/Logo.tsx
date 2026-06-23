import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import logoSrc from "@/assets/xebure-logo.png";

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <Link to="/" className={cn("flex items-center gap-3 group", className)}>
      <div className="relative">
        <div className="absolute inset-0 bg-primary/60 blur-xl group-hover:blur-2xl transition-all opacity-80" />
        <div className="relative bg-gradient-primary p-2.5 rounded-xl flex items-center justify-center shadow-glow">
          <img src={logoSrc} alt="Xebure" className="h-9 w-9" style={{ filter: "brightness(0) invert(1)" }} />
        </div>
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className="text-2xl font-extrabold text-gradient tracking-tight">XEBURE</span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-1">Build. Learn. Get Noticed.</span>
        </div>
      )}
    </Link>
  );
}
