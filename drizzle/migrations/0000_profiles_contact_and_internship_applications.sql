-- 1. Profile contact + desired role fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS desired_role text;

-- 2. Internship postings created by HR
CREATE TABLE IF NOT EXISTS public.internship_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  role text NOT NULL,
  location text,
  stipend text,
  deadline date,
  is_open boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.internship_postings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.internship_postings TO authenticated;
GRANT ALL ON public.internship_postings TO service_role;

ALTER TABLE public.internship_postings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view open postings" ON public.internship_postings;
CREATE POLICY "Anyone can view open postings"
  ON public.internship_postings FOR SELECT
  USING (is_open OR public.has_role(auth.uid(), 'hr') OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "HR and admins manage postings" ON public.internship_postings;
CREATE POLICY "HR and admins manage postings"
  ON public.internship_postings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'hr') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'hr') OR public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS internship_postings_updated_at ON public.internship_postings;
CREATE TRIGGER internship_postings_updated_at
  BEFORE UPDATE ON public.internship_postings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 3. Applications submitted by students
CREATE TABLE IF NOT EXISTS public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  posting_id uuid NOT NULL REFERENCES public.internship_postings(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL,
  resume_id uuid REFERENCES public.resumes(id) ON DELETE SET NULL,
  cover_note text,
  status text NOT NULL DEFAULT 'pending',
  hr_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (posting_id, applicant_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Applicants view own applications" ON public.applications;
CREATE POLICY "Applicants view own applications"
  ON public.applications FOR SELECT
  TO authenticated
  USING (auth.uid() = applicant_id OR public.has_role(auth.uid(), 'hr') OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Applicants create own applications" ON public.applications;
CREATE POLICY "Applicants create own applications"
  ON public.applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = applicant_id);

DROP POLICY IF EXISTS "Applicants update own applications" ON public.applications;
CREATE POLICY "Applicants update own applications"
  ON public.applications FOR UPDATE
  TO authenticated
  USING (auth.uid() = applicant_id)
  WITH CHECK (auth.uid() = applicant_id);

DROP POLICY IF EXISTS "HR and admins update applications" ON public.applications;
CREATE POLICY "HR and admins update applications"
  ON public.applications FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'hr') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'hr') OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Applicants delete own applications" ON public.applications;
CREATE POLICY "Applicants delete own applications"
  ON public.applications FOR DELETE
  TO authenticated
  USING (auth.uid() = applicant_id);

DROP TRIGGER IF EXISTS applications_updated_at ON public.applications;
CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();