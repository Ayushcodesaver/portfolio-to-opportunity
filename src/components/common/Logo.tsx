import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import logoSrc from "@/assets/xebure-logo.png";

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2.5 group", className)}>
      <div className="relative">
        <div className="absolute inset-0 bg-primary/50 blur-lg group-hover:blur-xl transition-all opacity-70" />
        <div className="relative bg-gradient-primary p-1.5 rounded-lg flex items-center justify-center">
          <img src={logoSrc} alt="Xebure" className="h-6 w-6 invert brightness-0" style={{ filter: "brightness(0) invert(1)" }} />
        </div>
      </div>
      {showText && (
        <span className="text-xl font-bold text-gradient tracking-tight">Xebure</span>
      )}
    </Link>
  );
}
