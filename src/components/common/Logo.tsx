import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import logoSrc from "@/assets/xebure-logo.png";

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <Link to="/" className={cn("flex items-center gap-3 group", className)}>
      <div className="relative shrink-0">
        <div className="absolute -inset-2 bg-primary/20 blur-xl opacity-60 group-hover:opacity-90 transition-opacity" />
        <img
          src={logoSrc}
          alt="Xebure"
          className={cn("relative object-contain", showText ? "h-10 w-auto" : "h-9 w-9")}
          style={{ filter: "brightness(0) invert(1)" }}
        />
      </div>
      {showText && (
        <span
          className="hidden sm:block text-[10px] font-semibold uppercase text-muted-foreground"
          style={{ letterSpacing: "0.28em" }}
        >
          Build · Learn · Get Noticed
        </span>
      )}
    </Link>
  );
}
