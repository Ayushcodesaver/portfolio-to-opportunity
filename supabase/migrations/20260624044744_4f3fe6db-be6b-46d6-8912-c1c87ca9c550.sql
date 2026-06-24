
CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id uuid REFERENCES public.internship_programs(id) ON DELETE SET NULL,
  certificate_code text NOT NULL UNIQUE,
  plan_tier text NOT NULL DEFAULT 'basic',
  verified boolean NOT NULL DEFAULT false,
  holder_name text NOT NULL,
  program_title text NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  pdf_url text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.certificates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view certificates for verification"
  ON public.certificates FOR SELECT USING (true);

CREATE POLICY "Owners can insert their own certificates"
  ON public.certificates FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = intern_id);

CREATE POLICY "Admins can manage certificates"
  ON public.certificates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr'));

CREATE INDEX certificates_intern_idx ON public.certificates(intern_id);
CREATE INDEX certificates_code_idx ON public.certificates(certificate_code);

CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own push subs"
  ON public.push_subscriptions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_prefs jsonb NOT NULL DEFAULT
    '{"email":{"tasks":true,"milestones":true,"certificates":true,"payments":true,"reminders":true},"push":{"tasks":true,"milestones":true,"certificates":true,"messages":true}}'::jsonb;
