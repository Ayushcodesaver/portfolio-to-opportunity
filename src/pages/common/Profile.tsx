import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageLoader, EmptyState } from "@/components/common/PageHeader";
import { MapPin, Calendar, User as UserIcon, Github, Linkedin, Twitter } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";

export default function Profile() {
  const { username } = useParams();
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => {
      const { data: profile } = await supabase.from("profiles").select("*").eq("username", username!).single();
      if (!profile) return null;
      const [projects, followers, following] = await Promise.all([
        supabase.from("projects").select("*").eq("user_id", profile.id).eq("status", "approved").order("created_at", { ascending: false }),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", profile.id),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", profile.id),
      ]);
      return { profile, projects: projects.data ?? [], followers: followers.count ?? 0, following: following.count ?? 0 };
    },
    enabled: !!username,
  });

  if (isLoading) return <PageLoader />;
  if (!data) return <div className="container py-8"><EmptyState icon={UserIcon} title="User not found" description="No profile exists for this username." /></div>;

  const { profile, projects, followers, following } = data;
  const isOwn = user?.id === profile.id;

  return (
    <div>
      <div className="h-48 bg-gradient-to-br from-primary/40 via-primary-dark/30 to-background relative">
        <div className="absolute inset-0 grid-pattern opacity-50" />
      </div>

      <div className="container max-w-5xl -mt-20 relative">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
          <div className="flex items-end gap-4">
            <div className="h-32 w-32 rounded-full border-4 border-primary bg-gradient-primary flex items-center justify-center text-4xl font-bold shadow-soft">
              {profile.full_name?.[0]?.toUpperCase()}
            </div>
            <div className="pb-2">
              <h1 className="text-3xl font-bold">{profile.full_name}</h1>
              <p className="text-muted-foreground">@{profile.username}</p>
            </div>
          </div>
          {isOwn ? (
            <Button variant="outline" className="border-primary/30">Edit profile</Button>
          ) : (
            <Button className="bg-gradient-primary">Follow</Button>
          )}
        </div>

        {profile.bio && <p className="mb-3 max-w-2xl">{profile.bio}</p>}

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
          {profile.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{profile.location}</span>}
          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Joined {format(new Date(profile.created_at), "MMM yyyy")}</span>
        </div>

        <div className="flex gap-6 mb-8 text-sm">
          <span><strong>{projects.length}</strong> <span className="text-muted-foreground">Projects</span></span>
          <span><strong>{followers}</strong> <span className="text-muted-foreground">Followers</span></span>
          <span><strong>{following}</strong> <span className="text-muted-foreground">Following</span></span>
        </div>

        <Tabs defaultValue="projects">
          <TabsList className="bg-muted">
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>
          <TabsContent value="projects" className="mt-6">
            {projects.length === 0 ? (
              <EmptyState icon={UserIcon} title="No public projects yet" description="Once approved, projects will appear here." />
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((p: any) => (
                  <div key={p.id} className="glass rounded-xl overflow-hidden hover:border-primary/50 transition-colors">
                    <div className="aspect-video bg-gradient-to-br from-primary/20 to-background">
                      {p.media_url && <img src={p.media_url} alt={p.title} className="w-full h-full object-cover" />}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold mb-1">{p.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="about" className="mt-6">
            <div className="glass rounded-xl p-6 space-y-4">
              {profile.skills?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.map((s: string) => (
                      <span key={s} className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary-glow">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                {profile.github_url && <a href={profile.github_url} target="_blank" rel="noreferrer" className="p-2 rounded hover:bg-primary/10"><Github className="h-4 w-4" /></a>}
                {profile.twitter_url && <a href={profile.twitter_url} target="_blank" rel="noreferrer" className="p-2 rounded hover:bg-primary/10"><Twitter className="h-4 w-4" /></a>}
                {profile.linkedin_url && <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="p-2 rounded hover:bg-primary/10"><Linkedin className="h-4 w-4" /></a>}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
