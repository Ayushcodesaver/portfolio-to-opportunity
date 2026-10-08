import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MarketingLayout, Card3D } from "@/components/marketing/MarketingLayout";
import { Heart, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Showcase() {
  const { data: projects } = useQuery({
    queryKey: ["showcase-public"],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, title, description, media_url, tags, profiles:user_id(username, full_name)")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(12);
      return data ?? [];
    },
  });

  return (
    <MarketingLayout
      eyebrow="Showcase"
      title="Real projects from real interns."
      subtitle="See what's being built right now on Xebure. Every project is live and approved."
    >
      {projects && projects.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p: any, i) => (
            <Card3D key={p.id} delay={i * 0.04} className="overflow-hidden p-0">
              {p.media_url ? (
                <div className="aspect-video bg-muted overflow-hidden">
                  <img src={p.media_url} alt={p.title} className="w-full h-full object-cover grayscale" />
                </div>
              ) : (
                <div className="aspect-video bg-secondary" />
              )}
              <div className="p-5">
                <h3 className="font-semibold mb-1 line-clamp-1">{p.title}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{p.description}</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(p.tags ?? []).slice(0, 3).map((t: string) => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{t}</span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">by @{p.profiles?.username}</p>
              </div>
            </Card3D>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 glass rounded-2xl">
          <p className="text-muted-foreground mb-4">No public projects yet — be the first to ship one.</p>
          <Link to="/register"><Button >Join Xebure</Button></Link>
        </div>
      )}
    </MarketingLayout>
  );
}
