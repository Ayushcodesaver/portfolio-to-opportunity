CREATE TABLE public.ui_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  storage_path text NOT NULL,
  kind text NOT NULL DEFAULT 'sticker',
  page text NOT NULL DEFAULT 'global',
  position text NOT NULL DEFAULT 'top-right',
  opacity numeric NOT NULL DEFAULT 1,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ui_assets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ui_assets TO authenticated;
GRANT ALL ON public.ui_assets TO service_role;

ALTER TABLE public.ui_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active assets are viewable by everyone"
ON public.ui_assets FOR SELECT
USING (is_active OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert assets"
ON public.ui_assets FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update assets"
ON public.ui_assets FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete assets"
ON public.ui_assets FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER ui_assets_updated_at BEFORE UPDATE ON public.ui_assets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "ui-assets readable by all"
ON storage.objects FOR SELECT
USING (bucket_id = 'ui-assets');

CREATE POLICY "ui-assets admin insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'ui-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "ui-assets admin update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'ui-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "ui-assets admin delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'ui-assets' AND public.has_role(auth.uid(), 'admin'));