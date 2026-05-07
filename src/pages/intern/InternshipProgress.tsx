import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Calendar, Code, Heart, Award, CheckCircle2, Circle } from "lucide-react";
import { PageHeader, PageLoader } from "@/components/common/PageHeader";
import { differenceInDays } from "date-fns";

export default function InternshipProgress() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["progress", user?.id],
    queryFn: async () => {
      const [profile, projects, likes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user!.id).single(),
        supabase.from("projects").select("id, status").eq("user_id", user!.id),
        supabase.from("project_likes").select("project_id, projects!inner(user_id)").eq("projects.user_id", user!.id),
      ]);
      return { profile: profile.data, projects: projects.data ?? [], likes: likes.data ?? [] };
    },
    enabled: !!user,
  });

  if (isLoading || !data) return <PageLoader />;

  const today = new Date();
  const start = data.profile?.internship_start ? new Date(data.profile.internship_start) : today;
  const end = data.profile?.internship_end ? new Date(data.profile.internship_end) : today;
  const totalDays = Math.max(differenceInDays(end, start), 90);
  const elapsed = Math.max(differenceInDays(today, start), 0);
  const daysLeft = Math.max(differenceInDays(end, today), 0);
  const pct = Math.min(100, (elapsed / totalDays) * 100);

  const approvedCount = data.projects.filter(p => p.status === "approved").length;
  const skills = data.profile?.skills ?? [];

  const stats = [
    { icon: Calendar, label: "Days completed", value: `${elapsed}/${totalDays}`, sub: `${daysLeft} days left`, pct },
    { icon: Code, label: "Projects approved", value: `${approvedCount}/8`, sub: "Keep building", pct: (approvedCount/8)*100 },
    { icon: Heart, label: "Total engagement", value: data.likes.length, sub: "Likes received" },
    { icon: Award, label: "Skills", value: skills.length, sub: "On your profile" },
  ];

  const milestones = [
    { title: "Joined Xebure", done: true },
    { title: "Created first project", done: data.projects.length > 0 },
    { title: "Got first approval", done: approvedCount > 0 },
    { title: "5 projects shipped", done: approvedCount >= 5 },
    { title: "10+ likes received", done: data.likes.length >= 10 },
    { title: "Internship complete", done: pct >= 100 },
  ];

  return (
    <div className="container max-w-6xl py-8">
      <PageHeader title="Internship Progress" description={`${daysLeft} days left in your internship.`} />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-primary/15"><s.icon className="h-4 w-4 text-primary" /></div>
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground mb-2">{s.label}</p>
            {s.pct !== undefined && (
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-primary" style={{ width: `${s.pct}%` }} />
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-6">
          <h2 className="font-semibold mb-4">Milestones</h2>
          <ol className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-border">
            {milestones.map((m) => (
              <li key={m.title} className="flex items-start gap-3 relative">
                {m.done ? (
                  <CheckCircle2 className="h-6 w-6 text-primary fill-primary/20 z-10 bg-background" />
                ) : (
                  <Circle className="h-6 w-6 text-muted-foreground z-10 bg-background" />
                )}
                <div>
                  <p className={m.done ? "font-medium" : "text-muted-foreground"}>{m.title}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="glass rounded-xl p-6">
          <h2 className="font-semibold mb-4">Skills</h2>
          {skills.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add skills in your profile to see them here.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {skills.map((s: string) => (
                <span key={s} className="px-3 py-1.5 rounded-lg bg-primary/15 text-primary-glow text-sm border border-primary/30">{s}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
