CREATE TABLE IF NOT EXISTS public.plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  price_inr integer NOT NULL,
  duration_months integer NOT NULL,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_popular boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.plans TO anon, authenticated;
GRANT ALL ON public.plans TO service_role;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plans are public" ON public.plans FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.plans (id, name, price_inr, duration_months, features, is_popular, sort_order) VALUES
  ('basic',  'Basic',   999,  3,  '["Basic tasks","Standard certificate","Community access","Notifications","Task submission"]'::jsonb, false, 1),
  ('pro',    'Pro',    1799,  6,  '["All tasks","Group mentorship","Certificate + QR","1 resume review","Priority support"]'::jsonb, true,  2),
  ('premium','Premium',2499, 12,  '["Bonus tasks","Bi-weekly 1-on-1","Monthly 1hr mentor session","Verified certificate + LinkedIn badge","Unlimited resume reviews","Mock interviews","Job portal","Alumni network"]'::jsonb, false, 3)
ON CONFLICT (id) DO UPDATE SET
  name=EXCLUDED.name, price_inr=EXCLUDED.price_inr, duration_months=EXCLUDED.duration_months,
  features=EXCLUDED.features, is_popular=EXCLUDED.is_popular, sort_order=EXCLUDED.sort_order;

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id text NOT NULL REFERENCES public.plans(id),
  cashfree_order_id text UNIQUE,
  cashfree_payment_id text,
  amount_inr integer NOT NULL,
  status text NOT NULL DEFAULT 'created',
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own payments" ON public.payments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id text NOT NULL REFERENCES public.plans(id),
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active',
  payment_id uuid REFERENCES public.payments(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own subscription" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);