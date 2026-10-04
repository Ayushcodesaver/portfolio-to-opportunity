import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Lock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { usePlan, type Feature, type PlanTier } from "@/hooks/usePlan";
import { GlowButton } from "@/components/fx/GlowButton";

interface Props {
  feature?: Feature;
  min?: PlanTier;
  title?: string;
  description?: string;
  children: ReactNode;
  fallback?: ReactNode;
  soft?: boolean; // render children blurred behind paywall
}

const LABEL: Record<PlanTier, string> = {
  none: "any plan", basic: "Basic", pro: "Pro", premium: "Premium",
};

export function PlanGate({ feature, min, title, description, children, fallback, soft = true }: Props) {
  const plan = usePlan();
  if (plan.loading) {
    return <div className="h-32 rounded-xl glass animate-pulse" />;
  }
  const allowed = feature ? plan.has(feature) : min ? plan.meets(min) : true;
  if (allowed) return <>{children}</>;
  if (fallback) return <>{fallback}</>;

  const need = feature ? plan.required(feature) : min ?? "basic";

  return (
    <div className="relative">
      {soft && (
        <div className="pointer-events-none select-none blur-md opacity-40 max-h-72 overflow-hidden">
          {children}
        </div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className={`${soft ? "absolute inset-0" : ""} flex items-center justify-center p-6`}
      >
        <div className="glass-strong rounded-2xl p-6 max-w-md text-center border border-primary/30 shadow-premium">
          <div className="inline-flex p-3 rounded-xl bg-gradient-primary mb-4 shadow-premium">
            <Lock className="h-5 w-5 text-primary-foreground" />
          </div>
          <h3 className="text-lg font-bold mb-1">{title ?? `${LABEL[need]} feature`}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {description ?? `Upgrade to ${LABEL[need]} to unlock this.`}
          </p>
          <Link to="/pricing">
            <GlowButton tone="primary" className="h-10 px-5">
              <Sparkles className="h-4 w-4 mr-1.5" /> Upgrade to {LABEL[need]}
            </GlowButton>
          </Link>
          <p className="text-[10px] text-muted-foreground mt-3 uppercase tracking-wider">
            Current: {LABEL[plan.tier]}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
