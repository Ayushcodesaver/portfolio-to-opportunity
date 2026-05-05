import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, Bookmark, Share2, TrendingUp, Hash, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/common/PageHeader";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type ProjectRow = {
  id: string; user_id: string; title: string; description: string;
  media_url: string | null; tags: string[]; created_at: string;
  profile?: { username: string; full_name: string; avatar_url: string | null };
  likes_count: number; comments_count: number; liked_by_me: boolean; saved_by_me: boolean;
};

export default function Feed() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"foryou"|"following"|"trending">("foryou");

  const { data: projects, isLoading } = useQuery({
    queryKey: ["feed", tab, user?.id],
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("projects")
        .select("*, profiles:user_id(username, full_name, avatar_url)")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(50);

      if (!rows) return [];

      const ids = rows.map(r => r.id);
      const [likes, saves, myLikes, mySaves, comments] = await Promise.all([
        supabase.from("project_likes").select("project_id").in("project_id", ids),
        supabase.from("project_saves").select("project_id").in("project_id", ids),
        user ? supabase.from("project_likes").select("project_id").in("project_id", ids).eq("user_id", user.id) : Promise.resolve({ data: [] as any[] }),
        user ? supabase.from("project_saves").select("project_id").in("project_id", ids).eq("user_id", user.id) : Promise.resolve({ data: [] as any[] }),
        supabase.from("comments").select("project_id").in("project_id", ids),
      ]);

      const count = (arr: any[] | null, id: string) => (arr ?? []).filter(x => x.project_id === id).length;
      const has = (arr: any[] | null, id: string) => (arr ?? []).some(x => x.project_id === id);

      return rows.map((r: any) => ({
        ...r,
        profile: r.profiles,
        likes_count: count(likes.data, r.id),
        comments_count: count(comments.data, r.id),
        liked_by_me: has(myLikes.data, r.id),
        saved_by_me: has(mySaves.data, r.id),
      })) as ProjectRow[];
    },
  });

  const toggleLike = async (p: ProjectRow) => {
    if (!user) return;
    if (p.liked_by_me) {
      await supabase.from("project_likes").delete().eq("project_id", p.id).eq("user_id", user.id);
    } else {
      await supabase.from("project_likes").insert({ project_id: p.id, user_id: user.id });
    }
    qc.invalidateQueries({ queryKey: ["feed"] });
  };

  const toggleSave = async (p: ProjectRow) => {
    if (!user) return;
    if (p.saved_by_me) {
      await supabase.from("project_saves").delete().eq("project_id", p.id).eq("user_id", user.id);
    } else {
      await supabase.from("project_saves").insert({ project_id: p.id, user_id: user.id });
    }
    qc.invalidateQueries({ queryKey: ["feed"] });
  };

  return (
    <div className="container max-w-7xl py-8">
      <div className="grid lg:grid-cols-[1fr_2fr_1fr] gap-6">
        {/* LEFT */}
        <aside className="hidden lg:block space-y-4 sticky top-8 self-start">
          <div className="glass rounded-xl p-5">
            <div className="h-14 w-14 rounded-full bg-gradient-primary mb-3 flex items-center justify-center text-lg font-bold">
              {user?.email?.[0]?.toUpperCase()}
            </div>
            <p className="font-semibold">{user?.email}</p>
            <p className="text-xs text-muted-foreground">Welcome to your feed</p>
          </div>
          <div className="glass rounded-xl p-5 space-y-2">
            <p className="text-xs uppercase text-muted-foreground tracking-wider mb-2">Quick stats</p>
            <div className="flex justify-between text-sm"><span>Projects</span><span className="text-primary font-semibold">0</span></div>
            <div className="flex justify-between text-sm"><span>Likes received</span><span className="text-primary font-semibold">0</span></div>
            <div className="flex justify-between text-sm"><span>Comments</span><span className="text-primary font-semibold">0</span></div>
          </div>
        </aside>

        {/* CENTER */}
        <div>
          {/* Compose box */}
          <Link to="/create-project" className="block glass rounded-xl p-4 mb-6 hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-semibold">
                {user?.email?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 text-sm text-muted-foreground bg-muted/30 px-4 py-2.5 rounded-full">
                What project are you showing off today?
              </div>
              <Button size="sm" className="bg-gradient-primary">Create</Button>
            </div>
          </Link>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 border-b border-border/50">
            {(["foryou","following","trending"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                  tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}>
                {t === "foryou" ? "For You" : t === "following" ? "Following" : "Trending"}
                {tab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-primary" />}
              </button>
            ))}
          </div>

          {isLoading ? <PageLoader /> : projects && projects.length > 0 ? (
            <div className="space-y-4">
              {projects.map((p) => (
                <article key={p.id} className="glass rounded-xl overflow-hidden">
                  <header className="p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-semibold">
                      {p.profile?.full_name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <Link to={`/profile/${p.profile?.username}`} className="font-semibold text-sm hover:text-primary">
                        {p.profile?.full_name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        @{p.profile?.username} · {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </header>

                  <div className="px-4 pb-3">
                    <h2 className="text-lg font-semibold mb-1">{p.title}</h2>
                    <p className="text-sm text-muted-foreground line-clamp-2 whitespace-pre-wrap">{p.description}</p>
                  </div>

                  {p.media_url && (
                    <div className="aspect-video bg-muted">
                      <img src={p.media_url} alt={p.title} className="w-full h-full object-cover" />
                    </div>
                  )}

                  {p.tags?.length > 0 && (
                    <div className="px-4 pt-3 flex flex-wrap gap-1.5">
                      {p.tags.map((t) => (
                        <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary-glow">{t}</span>
                      ))}
                    </div>
                  )}

                  <div className="px-4 py-3 flex items-center gap-1 border-t border-border/50 mt-3">
                    <Button variant="ghost" size="sm" onClick={() => toggleLike(p)}
                      className={p.liked_by_me ? "text-primary" : ""}>
                      <Heart className={`h-4 w-4 mr-1.5 ${p.liked_by_me ? "fill-primary" : ""}`} />
                      {p.likes_count}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MessageCircle className="h-4 w-4 mr-1.5" />
                      {p.comments_count}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleSave(p)}
                      className={p.saved_by_me ? "text-primary" : ""}>
                      <Bookmark className={`h-4 w-4 ${p.saved_by_me ? "fill-primary" : ""}`} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(window.location.origin + "/profile/" + p.profile?.username); toast.success("Link copied"); }}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="glass rounded-xl p-10 text-center">
              <p className="text-muted-foreground mb-4">No projects yet. Be the first to share!</p>
              <Link to="/create-project"><Button className="bg-gradient-primary">Create your first project</Button></Link>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <aside className="hidden lg:block space-y-4 sticky top-8 self-start">
          <div className="glass rounded-xl p-5">
            <h3 className="flex items-center gap-2 font-semibold mb-3"><TrendingUp className="h-4 w-4 text-primary" /> Trending</h3>
            <p className="text-xs text-muted-foreground">Popular this week</p>
            <ul className="mt-3 space-y-2 text-sm">
              {(projects ?? []).slice(0, 5).map((p, i) => (
                <li key={p.id} className="flex gap-2">
                  <span className="text-primary font-bold">{i+1}.</span>
                  <span className="truncate">{p.title}</span>
                </li>
              ))}
              {(!projects || projects.length === 0) && <li className="text-muted-foreground text-xs">Nothing yet</li>}
            </ul>
          </div>
          <div className="glass rounded-xl p-5">
            <h3 className="flex items-center gap-2 font-semibold mb-3"><Hash className="h-4 w-4 text-primary" /> Popular tags</h3>
            <div className="flex flex-wrap gap-1.5">
              {["React","TypeScript","Node.js","Python","AI","Tailwind"].map(t => (
                <span key={t} className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary-glow">#{t}</span>
              ))}
            </div>
          </div>
          <div className="glass rounded-xl p-5">
            <h3 className="flex items-center gap-2 font-semibold mb-3"><Users className="h-4 w-4 text-primary" /> Top interns</h3>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
