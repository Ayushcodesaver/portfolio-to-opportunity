-- Achievements catalog
CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT 'trophy',
  points integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view achievements" ON public.achievements FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manage achievements" ON public.achievements FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

INSERT INTO public.achievements (key, name, description, icon, points) VALUES
  ('first_task','First Steps','Got your very first task approved','sparkles',10),
  ('streak_7','One Week Strong','Logged in 7 days in a row','flame',25),
  ('streak_30','Unstoppable','Logged in 30 days in a row','flame',100),
  ('milestone_25','Quarter Way','Reached 25% of your internship','medal',25),
  ('milestone_50','Halfway Hero','Reached 50% of your internship','medal',50),
  ('milestone_75','Almost There','Reached 75% of your internship','medal',75),
  ('milestone_100','Internship Complete','Finished the internship 🎉','crown',150),
  ('top_performer','Top Performer','Ranked top 3 on the weekly leaderboard','trophy',50);

-- User achievements (unique per user/key)
CREATE TABLE public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  achievement_key text NOT NULL,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view achievements (own or staff)" ON public.user_achievements FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(),'hr') OR has_role(auth.uid(),'admin'));
-- inserts only via SECURITY DEFINER functions / triggers; no direct insert policy

-- Streaks
CREATE TABLE public.daily_streaks (
  user_id uuid PRIMARY KEY,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_check_in date,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.daily_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view own streak" ON public.daily_streaks FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(),'hr') OR has_role(auth.uid(),'admin'));

-- Helper: award badge (idempotent) + points entry
CREATE OR REPLACE FUNCTION public.award_achievement(_user uuid, _key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pts integer;
  v_exists boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.user_achievements WHERE user_id=_user AND achievement_key=_key) INTO v_exists;
  IF v_exists THEN RETURN; END IF;
  SELECT points INTO v_pts FROM public.achievements WHERE key=_key;
  IF v_pts IS NULL THEN RETURN; END IF;
  INSERT INTO public.user_achievements (user_id, achievement_key) VALUES (_user, _key);
  IF v_pts > 0 THEN
    INSERT INTO public.points_history (intern_id, points, reason, source_type)
    VALUES (_user, v_pts, 'Achievement: '||_key, 'achievement');
  END IF;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.award_achievement(uuid,text) FROM PUBLIC, authenticated;

-- RPC: record daily check-in (called from client on login)
CREATE OR REPLACE FUNCTION public.record_streak()
RETURNS public.daily_streaks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_row public.daily_streaks;
  v_today date := current_date;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_row FROM public.daily_streaks WHERE user_id = v_user;
  IF NOT FOUND THEN
    INSERT INTO public.daily_streaks (user_id, current_streak, longest_streak, last_check_in)
    VALUES (v_user, 1, 1, v_today) RETURNING * INTO v_row;
  ELSIF v_row.last_check_in = v_today THEN
    -- already checked in today
    RETURN v_row;
  ELSIF v_row.last_check_in = v_today - 1 THEN
    UPDATE public.daily_streaks
      SET current_streak = current_streak + 1,
          longest_streak = GREATEST(longest_streak, current_streak + 1),
          last_check_in = v_today, updated_at = now()
      WHERE user_id = v_user RETURNING * INTO v_row;
  ELSE
    UPDATE public.daily_streaks
      SET current_streak = 1, last_check_in = v_today, updated_at = now()
      WHERE user_id = v_user RETURNING * INTO v_row;
  END IF;
  -- award streak badges
  IF v_row.current_streak >= 7 THEN PERFORM public.award_achievement(v_user, 'streak_7'); END IF;
  IF v_row.current_streak >= 30 THEN PERFORM public.award_achievement(v_user, 'streak_30'); END IF;
  RETURN v_row;
END;
$$;
GRANT EXECUTE ON FUNCTION public.record_streak() TO authenticated;

-- Trigger: first task approved
CREATE OR REPLACE FUNCTION public.trg_first_task_approved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    PERFORM public.award_achievement(NEW.intern_id, 'first_task');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_task_first_approved
AFTER UPDATE ON public.task_submissions
FOR EACH ROW EXECUTE FUNCTION public.trg_first_task_approved();

-- Trigger: milestone badges on enrollment current_day update
CREATE OR REPLACE FUNCTION public.trg_milestone_check()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total integer;
  v_pct numeric;
BEGIN
  SELECT total_days INTO v_total FROM public.internship_programs WHERE id = NEW.program_id;
  IF v_total IS NULL OR v_total = 0 THEN RETURN NEW; END IF;
  v_pct := (NEW.current_day::numeric / v_total::numeric) * 100;
  IF v_pct >= 25 THEN PERFORM public.award_achievement(NEW.intern_id, 'milestone_25'); END IF;
  IF v_pct >= 50 THEN PERFORM public.award_achievement(NEW.intern_id, 'milestone_50'); END IF;
  IF v_pct >= 75 THEN PERFORM public.award_achievement(NEW.intern_id, 'milestone_75'); END IF;
  IF v_pct >= 100 THEN PERFORM public.award_achievement(NEW.intern_id, 'milestone_100'); END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_enrollment_milestone
AFTER INSERT OR UPDATE OF current_day ON public.program_enrollments
FOR EACH ROW EXECUTE FUNCTION public.trg_milestone_check();

-- Leaderboard view (all-time)
CREATE OR REPLACE VIEW public.leaderboard_v AS
SELECT
  ph.intern_id AS user_id,
  COALESCE(SUM(ph.points), 0) AS total_points,
  COALESCE(SUM(CASE WHEN ph.created_at > now() - interval '7 days' THEN ph.points ELSE 0 END), 0) AS weekly_points,
  COALESCE(SUM(CASE WHEN ph.created_at > now() - interval '30 days' THEN ph.points ELSE 0 END), 0) AS monthly_points,
  COUNT(DISTINCT ph.id) FILTER (WHERE ph.source_type = 'achievement') AS badges_count
FROM public.points_history ph
GROUP BY ph.intern_id;
GRANT SELECT ON public.leaderboard_v TO authenticated;