import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import logoSrc from "@/assets/xebure-logo.png";

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2.5 group", className)}>
      <div className="relative shrink-0">
        <div className="absolute inset-0 bg-primary/30 blur-lg group-hover:blur-xl transition-all opacity-70" />
        <div className="relative bg-gradient-primary p-1.5 rounded-lg flex items-center justify-center shadow-glow">
          <img
            src={logoSrc}
            alt="Xebure"
            className="h-6 w-6"
            style={{ filter: "brightness(0)" }}
          />
        </div>
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span
            className="text-[28px] font-extrabold text-foreground"
            style={{ letterSpacing: "-0.03em" }}
          >
            XEBURE
          </span>
          <span
            className="text-[11px] uppercase text-muted-foreground mt-1.5"
            style={{ letterSpacing: "0.25em" }}
          >
            Build. Learn. Get Noticed.
          </span>
        </div>
      )}
    </Link>
  );
}
