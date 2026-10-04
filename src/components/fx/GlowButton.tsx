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
            ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-premium"
            : "border border-border bg-secondary text-secondary-foreground hover:border-foreground/30",
          className,
        )}
      >
        {tone === "primary" && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary-foreground/20 to-transparent transition-transform duration-700 hover:translate-x-full group-hover:translate-x-full"
          />
        )}
        <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      </Button>
    );
  },
);
GlowButton.displayName = "GlowButton";
