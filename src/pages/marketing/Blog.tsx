import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Calendar, ArrowRight } from "lucide-react";
import { MarketingLayout, Card3D } from "@/components/marketing/MarketingLayout";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

export default function Blog() {
  const [activeCat, setActiveCat] = useState<string | null>(null);

  const { data: categories } = useQuery({
    queryKey: ["blog-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("blog_categories").select("*").order("name");
      return data ?? [];
    },
  });

  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts", activeCat],
    queryFn: async () => {
      let q = supabase
        .from("blog_posts")
        .select("id, slug, title, excerpt, cover_image_url, published_at, category_id, author_id, blog_categories(name, slug)")
        .eq("status", "published")
        .order("published_at", { ascending: false });
      if (activeCat) q = q.eq("category_id", activeCat);
      const { data } = await q;
      return data ?? [];
    },
  });

  return (
    <MarketingLayout
      eyebrow="Blog"
      title="Notes from the field."
      subtitle="Playbooks, stories, and lessons from internships happening right now on Xebure."
    >
      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-10">
        <button
          onClick={() => setActiveCat(null)}
          className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-wider transition ${
            activeCat === null ? "bg-primary text-primary-foreground" : "glass border border-primary/20 hover:border-primary/50"
          }`}
        >
          All
        </button>
        {categories?.map((c: any) => (
          <button
            key={c.id}
            onClick={() => setActiveCat(c.id)}
            className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-wider transition ${
              activeCat === c.id ? "bg-primary text-primary-foreground" : "glass border border-primary/20 hover:border-primary/50"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-12">Loading…</p>
      ) : (posts?.length ?? 0) === 0 ? (
        <div className="text-center py-16 glass rounded-2xl">
          <p className="text-muted-foreground">No posts published yet. Check back soon.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts!.map((p: any, i: number) => (
            <Link key={p.id} to={`/blog/${p.slug}`}>
              <Card3D delay={i * 0.04} className="h-full cursor-pointer">
                {p.cover_image_url && (
                  <img src={p.cover_image_url} alt={p.title} className="w-full h-40 object-cover rounded-lg mb-4" />
                )}
                <div className="text-xs uppercase tracking-wider text-primary-glow mb-3">
                  {p.blog_categories?.name ?? "Uncategorized"}
                </div>
                <h3 className="text-xl font-semibold mb-2 line-clamp-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{p.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    {p.published_at ? formatDistanceToNow(new Date(p.published_at), { addSuffix: true }) : "Draft"}
                  </span>
                  <span className="flex items-center gap-1 text-primary">
                    Read <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Card3D>
            </Link>
          ))}
        </div>
      )}
    </MarketingLayout>
  );
}
