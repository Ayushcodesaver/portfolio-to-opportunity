import { useId } from "react";

/**
 * Monochrome half-arc gauge for live progress.
 */
export function GaugeChart({
  value,
  max = 100,
  centerLabel,
  centerSub,
  size = 200,
  thickness = 14,
}: {
  value: number;
  max?: number;
  centerLabel?: string;
  centerSub?: string;
  size?: number;
  thickness?: number;
}) {
  const id = useId();
  const radius = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = Math.PI * radius;
  const pct = Math.max(0, Math.min(1, value / max));
  const dash = circumference * pct;

  return (
    <div className="relative" style={{ width: size, height: size / 2 + 24 }}>
      <svg width={size} height={size / 2 + 8} viewBox={`0 0 ${size} ${size / 2 + 8}`}>
        <defs>
          <linearGradient id={`g-${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="hsl(var(--gauge-1))" />
            <stop offset="25%"  stopColor="hsl(var(--gauge-2))" />
            <stop offset="50%"  stopColor="hsl(var(--gauge-3))" />
            <stop offset="75%"  stopColor="hsl(var(--gauge-4))" />
            <stop offset="100%" stopColor="hsl(var(--gauge-5))" />
          </linearGradient>
        </defs>
        {/* Track */}
        <path
          d={`M ${thickness / 2} ${cy} A ${radius} ${radius} 0 0 1 ${size - thickness / 2} ${cy}`}
          stroke="hsl(var(--border))"
          strokeWidth={thickness}
          fill="none"
          strokeLinecap="round"
        />
        {/* Value */}
        <path
          d={`M ${thickness / 2} ${cy} A ${radius} ${radius} 0 0 1 ${size - thickness / 2} ${cy}`}
          stroke={`url(#g-${id})`}
          strokeWidth={thickness}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-2 text-center">
        <div className="text-2xl font-bold leading-none">{centerLabel ?? `${Math.round(pct * 100)}%`}</div>
        {centerSub && <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{centerSub}</div>}
      </div>
    </div>
  );
}
