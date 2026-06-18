import { forwardRef } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GlowButtonProps extends ButtonProps {
  tone?: "primary" | "glass";
}

export const GlowButton = forwardRef<HTMLButtonElement, GlowButtonProps>(
  ({ tone = "primary", className, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        {...props}
        className={cn(
          "relative overflow-hidden transition-all duration-300 hover:scale-[1.02]",
          tone === "primary"
            ? "bg-gradient-primary text-primary-foreground hover:opacity-95 shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.6)] hover:shadow-[0_20px_50px_-12px_hsl(var(--primary)/0.7)]"
            : "glass-strong text-foreground hover:border-primary/50",
          className,
        )}
      >
        {tone === "primary" && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 hover:translate-x-full group-hover:translate-x-full"
          />
        )}
        <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      </Button>
    );
  },
);
GlowButton.displayName = "GlowButton";
