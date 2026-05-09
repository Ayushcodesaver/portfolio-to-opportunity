-- Categories
CREATE TABLE public.blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view categories" ON public.blog_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "hr manage categories" ON public.blog_categories FOR ALL TO authenticated
  USING (has_role(auth.uid(),'hr') OR has_role(auth.uid(),'admin'))
  WITH CHECK (has_role(auth.uid(),'hr') OR has_role(auth.uid(),'admin'));

-- Posts
CREATE TYPE public.blog_status AS ENUM ('draft','published','archived');

CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text DEFAULT '',
  cover_image_url text,
  body text NOT NULL DEFAULT '',
  category_id uuid REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  author_id uuid NOT NULL,
  status public.blog_status NOT NULL DEFAULT 'draft',
  views_count integer DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_blog_posts_status ON public.blog_posts(status, published_at DESC);
CREATE INDEX idx_blog_posts_category ON public.blog_posts(category_id);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view published or own" ON public.blog_posts FOR SELECT TO authenticated
  USING (status='published' OR author_id=auth.uid() OR has_role(auth.uid(),'hr') OR has_role(auth.uid(),'admin'));
CREATE POLICY "hr create posts" ON public.blog_posts FOR INSERT TO authenticated
  WITH CHECK ((has_role(auth.uid(),'hr') OR has_role(auth.uid(),'admin')) AND author_id = auth.uid());
CREATE POLICY "author or hr update" ON public.blog_posts FOR UPDATE TO authenticated
  USING (author_id=auth.uid() OR has_role(auth.uid(),'admin'));
CREATE POLICY "author or admin delete" ON public.blog_posts FOR DELETE TO authenticated
  USING (author_id=auth.uid() OR has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_blog_posts_updated BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Comments
CREATE TABLE public.blog_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_blog_comments_post ON public.blog_comments(post_id, created_at DESC);
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view comments" ON public.blog_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "post comment" ON public.blog_comments FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid());
CREATE POLICY "delete own comment" ON public.blog_comments FOR DELETE TO authenticated
  USING (user_id=auth.uid() OR has_role(auth.uid(),'admin'));

-- Likes
CREATE TABLE public.blog_post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);
ALTER TABLE public.blog_post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view likes" ON public.blog_post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "like" ON public.blog_post_likes FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid());
CREATE POLICY "unlike" ON public.blog_post_likes FOR DELETE TO authenticated USING (user_id=auth.uid());

-- Seed categories
INSERT INTO public.blog_categories (slug, name, description) VALUES
  ('tutorials','Tutorials','Step-by-step learning content'),
  ('success-stories','Success Stories','Intern journeys and outcomes'),
  ('updates','Updates','Platform announcements and changelogs'),
  ('tips','Tips','Quick tips, tricks, and best practices');