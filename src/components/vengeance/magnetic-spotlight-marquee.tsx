import { motion, useMotionTemplate, useMotionValue, useReducedMotion } from "framer-motion";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface MagneticSpotlightMarqueeProps {
  items: string[];
  className?: string;
}

export function MagneticSpotlightMarquee({ items, className }: MagneticSpotlightMarqueeProps) {
  const x = useMotionValue(0);
  const reduced = useReducedMotion();
  const mask = useMotionTemplate`radial-gradient(180px circle at ${x}px 50%, black, transparent)`;
  const content = [...items, ...items];

  return (
    <div
      className={cn("relative overflow-hidden border-y border-border bg-card/70 py-2", className)}
      onPointerMove={(event) => x.set(event.currentTarget.getBoundingClientRect().width / 2 - event.currentTarget.getBoundingClientRect().left + event.clientX - event.currentTarget.getBoundingClientRect().width / 2)}
      aria-label={`Live Xebure capabilities: ${items.join(", ")}`}
    >
      <motion.div
        className="flex w-max items-center gap-8 text-[10px] font-medium uppercase text-muted-foreground"
        animate={reduced ? undefined : { x: [0, -420] }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      >
        {content.map((item, index) => (
          <span key={`${item}-${index}`} className="flex items-center gap-2 whitespace-nowrap">
            <Activity className="h-3 w-3" /> {item}
          </span>
        ))}
      </motion.div>
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 bg-foreground/10" style={{ WebkitMaskImage: mask, maskImage: mask }} />
    </div>
  );
}
