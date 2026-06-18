import { motion } from "framer-motion";

export function FloatingShapes() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Triangle */}
      <motion.svg
        className="absolute left-[8%] top-[18%]"
        width="80" height="80" viewBox="0 0 80 80"
        animate={{ y: [0, -20, 0], rotate: [0, 12, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      >
        <polygon points="40,8 72,68 8,68" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.55" />
      </motion.svg>

      {/* Square */}
      <motion.div
        className="absolute right-[10%] top-[14%] h-16 w-16 rotate-12 rounded-md border border-primary/40"
        style={{ background: "hsl(var(--primary) / 0.05)" }}
        animate={{ y: [0, 16, 0], rotate: [12, -6, 12] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Ring */}
      <motion.div
        className="absolute left-[12%] bottom-[18%] h-28 w-28 rounded-full border-2 border-primary/30"
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Code symbol */}
      <motion.div
        className="absolute right-[14%] bottom-[22%] font-mono text-3xl text-primary/50"
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        {"</>"}
      </motion.div>

      {/* Dotted ring */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-primary/15"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}
