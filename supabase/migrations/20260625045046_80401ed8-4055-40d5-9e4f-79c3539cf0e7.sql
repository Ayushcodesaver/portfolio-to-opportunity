
CREATE TABLE public.channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text DEFAULT '',
  is_private boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.channels TO authenticated;
GRANT ALL ON public.channels TO service_role;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read public channels"
  ON public.channels FOR SELECT TO authenticated
  USING (NOT is_private OR public.has_role(auth.uid(), 'hr') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "HR/admin can create channels"
  ON public.channels FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'hr') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "HR/admin can update channels"
  ON public.channels FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'hr') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete channels"
  ON public.channels FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.channel_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  attachment_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.channel_messages TO authenticated;
GRANT ALL ON public.channel_messages TO service_role;
ALTER TABLE public.channel_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read messages in visible channels"
  ON public.channel_messages FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.channels c WHERE c.id = channel_id
            AND (NOT c.is_private OR public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'admin')))
  );

CREATE POLICY "Authenticated can post own messages"
  ON public.channel_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authors can update their messages"
  ON public.channel_messages FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authors or moderators can delete"
  ON public.channel_messages FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'admin'));

CREATE INDEX channel_messages_channel_created_idx ON public.channel_messages (channel_id, created_at DESC);

CREATE TRIGGER trg_channels_updated BEFORE UPDATE ON public.channels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_channel_messages_updated BEFORE UPDATE ON public.channel_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_messages;

INSERT INTO public.channels (name, description) VALUES
  ('general', 'Open chat for everyone'),
  ('help', 'Ask for help — interns & HR'),
  ('random', 'Off-topic'),
  ('showcase', 'Share what you built')
ON CONFLICT (name) DO NOTHING;
