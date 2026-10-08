import { lazy, Suspense, useEffect, useState } from "react";
import { KineticTextLoader } from "@/components/vengeance/kinetic-text-loader";
import logoSrc from "@/assets/xebure-logo.png";

const InteractiveParticles = lazy(() =>
  import("@/components/vengeance/interactive-particles").then((module) => ({ default: module.InteractiveParticles })),
);
const steps = ["Initializing system", "Loading workspace", "Preparing interface", "Ready"];

export function StartupSequence() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setVisible(false); return; }
    const statusTimer = window.setInterval(() => setStep((current) => Math.min(current + 1, steps.length - 1)), 300);
    const leaveTimer = window.setTimeout(() => setLeaving(true), 1250);
    const removeTimer = window.setTimeout(() => setVisible(false), 1500);
    return () => { window.clearInterval(statusTimer); window.clearTimeout(leaveTimer); window.clearTimeout(removeTimer); };
  }, []);

  if (!visible) return null;
  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-background transition-opacity duration-300 ${leaving ? "opacity-0" : "opacity-100"}`}
      aria-live="polite"
      aria-label={`Xebure ${steps[step]}`}
    >
      <Suspense fallback={null}>
        <InteractiveParticles src={logoSrc} allowUpload={false} maxDimension={96} randomness={1.2} depth={2} className="absolute inset-0 opacity-35" />
      </Suspense>
      <div className="relative z-10 flex flex-col items-center">
        <p className="mb-5 text-xs font-semibold uppercase text-muted-foreground">Xebure system</p>
        <KineticTextLoader text="XEBURE" className="scale-75 sm:scale-100" />
        <p className="mt-8 text-xs uppercase text-muted-foreground">{steps[step]}</p>
      </div>
    </div>
  );
}
