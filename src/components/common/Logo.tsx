import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import logoSrc from "@/assets/xebure-logo.png";

type LogoSize = "sm" | "md" | "lg";

const SIZES: Record<LogoSize, { img: string; icon: string; text: string; gap: string }> = {
  sm: { img: "h-7", icon: "h-7 w-7", text: "text-[8px]", gap: "gap-2" },
  md: { img: "h-10", icon: "h-9 w-9", text: "text-[10px]", gap: "gap-3" },
  lg: { img: "h-14", icon: "h-12 w-12", text: "text-[11px]", gap: "gap-3" },
};

export function Logo({
  className,
  showText = true,
  size = "md",
  linkTo = "/",
}: {
  className?: string;
  showText?: boolean;
  size?: LogoSize;
  linkTo?: string;
}) {
  const s = SIZES[size];
  const content = (
    <>
      <div className="relative shrink-0">
        <div className="absolute -inset-2 bg-primary/20 blur-xl opacity-60 group-hover:opacity-90 transition-opacity" />
        <img
          src={logoSrc}
          alt="Xebure"
          className={cn("relative object-contain max-w-full", showText ? `${s.img} w-auto` : s.icon)}
          style={{ filter: "brightness(0) invert(1)" }}
        />
      </div>
      {showText && (
        <span
          className={cn("hidden sm:block font-semibold uppercase text-muted-foreground whitespace-nowrap", s.text)}
          style={{ letterSpacing: "0.28em" }}
        >
          Build · Learn · Get Noticed
        </span>
      )}
    </>
  );

  return (
    <Link to={linkTo} className={cn("inline-flex items-center min-w-0", s.gap, "group", className)}>
      {content}
    </Link>
  );
}
