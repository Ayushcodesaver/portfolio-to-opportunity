import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useRealtimeInvalidate } from "./useRealtimeInvalidate";

export type PlanTier = "none" | "basic" | "pro" | "premium";

const RANK: Record<PlanTier, number> = { none: 0, basic: 1, pro: 2, premium: 3 };

export type Feature =
  | "basic_tasks"
  | "all_tasks"
  | "bonus_tasks"
  | "community"
  | "notifications"
  | "task_submission"
  | "standard_certificate"
  | "certificate_qr"
  | "verified_certificate"
  | "group_mentorship"
  | "one_on_one"
  | "monthly_mentor_session"
  | "resume_review_1"
  | "resume_review_unlimited"
  | "priority_support"
  | "mock_interviews"
  | "job_portal"
  | "alumni_network"
  | "ai_assistant";

// Single source of truth — minimum tier required for each feature.
const REQUIRES: Record<Feature, PlanTier> = {
  basic_tasks: "basic",
  community: "basic",
  notifications: "basic",
  task_submission: "basic",
  standard_certificate: "basic",

  all_tasks: "pro",
  group_mentorship: "pro",
  certificate_qr: "pro",
  resume_review_1: "pro",
  priority_support: "pro",
  ai_assistant: "pro",

  bonus_tasks: "premium",
  one_on_one: "premium",
  monthly_mentor_session: "premium",
  verified_certificate: "premium",
  resume_review_unlimited: "premium",
  mock_interviews: "premium",
  job_portal: "premium",
  alumni_network: "premium",
};

export function usePlan() {
  const { user } = useAuth();

  const q = useQuery({
    queryKey: ["my-plan", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("plan_id, status, expires_at, started_at")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data ?? null;
    },
  });

  useRealtimeInvalidate(
    `plan-${user?.id ?? "anon"}`,
    user ? [{ table: "subscriptions", filter: `user_id=eq.${user.id}`, keys: [["my-plan", user.id]] }] : [],
    !!user,
  );

  const active =
    q.data?.status === "active" &&
    (!q.data.expires_at || new Date(q.data.expires_at) > new Date());

  const tier: PlanTier = active ? ((q.data!.plan_id as PlanTier) ?? "none") : "none";
  const rank = RANK[tier];

  const has = (feature: Feature) => rank >= RANK[REQUIRES[feature]];
  const meets = (min: PlanTier) => rank >= RANK[min];
  const required = (feature: Feature) => REQUIRES[feature];

  return {
    loading: q.isLoading,
    tier,
    rank,
    active,
    expiresAt: q.data?.expires_at ?? null,
    subscription: q.data ?? null,
    has,
    meets,
    required,
  };
}

export const PLAN_RANK = RANK;
