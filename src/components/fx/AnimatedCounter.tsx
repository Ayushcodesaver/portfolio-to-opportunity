import { useEffect, useRef, useState } from "react";

export function AnimatedCounter({
  value,
  duration = 1400,
  suffix = "",
  prefix = "",
  className,
}: {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}) {
  const [n, setN] = useState(0);
  const startTs = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    startTs.current = null;
    const step = (ts: number) => {
      if (startTs.current === null) startTs.current = ts;
      const t = Math.min((ts - startTs.current) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setN(Math.floor(eased * value));
      if (t < 1) rafId.current = requestAnimationFrame(step);
    };
    rafId.current = requestAnimationFrame(step);
    return () => { if (rafId.current) cancelAnimationFrame(rafId.current); };
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}
      {n.toLocaleString()}
      {suffix}
    </span>
  );
}
