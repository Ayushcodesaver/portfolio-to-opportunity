import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import logoSrc from "@/assets/xebure-logo.png";

type LogoSize = "sm" | "md" | "lg";

const SIZES: Record<LogoSize, { img: string; icon: string; text: string; gap: string }> = {
  sm: { img: "h-11", icon: "h-10 w-auto", text: "text-[10px]", gap: "gap-2.5" },
  md: { img: "h-14", icon: "h-12 w-auto", text: "text-xs", gap: "gap-3" },
  lg: { img: "h-24", icon: "h-20 w-auto", text: "text-sm", gap: "gap-4" },
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
        
        <img
          src={logoSrc}
          alt="Xebure"
          className={cn("relative object-contain max-w-full", showText ? `${s.img} w-auto` : s.icon)}
          style={{ filter: "grayscale(1) brightness(0) invert(1)" }}
        />
      </div>
      {showText && (
        <span
          className={cn("hidden sm:block font-semibold uppercase text-muted-foreground whitespace-nowrap", s.text)}
          
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
