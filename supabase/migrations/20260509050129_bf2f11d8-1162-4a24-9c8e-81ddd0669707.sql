-- Revoke public execute on internal/trigger functions
REVOKE EXECUTE ON FUNCTION public.trg_first_task_approved() FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_milestone_check() FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_streak() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_streak() TO authenticated;

-- Make leaderboard view honour caller's RLS
ALTER VIEW public.leaderboard_v SET (security_invoker = true);