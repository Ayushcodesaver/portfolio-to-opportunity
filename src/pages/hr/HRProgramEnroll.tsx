import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, PageLoader, EmptyState } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Users, ArrowLeft, UserPlus, UserMinus } from "lucide-react";
import { toast } from "sonner";

export default function HRProgramEnroll() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data: program } = useQuery({
    queryKey: ["program", id],
    queryFn: async () => (await supabase.from("internship_programs").select("*").eq("id", id!).single()).data,
    enabled: !!id,
  });

  const { data: rows, isLoading } = useQuery({
    queryKey: ["program-enroll", id],
    queryFn: async () => {
      const [interns, enrolled] = await Promise.all([
        supabase.from("user_roles").select("user_id, profiles!inner(id, full_name, username, avatar_url)").eq("role", "intern"),
        supabase.from("program_enrollments").select("intern_id").eq("program_id", id!),
      ]);
      const enrolledSet = new Set((enrolled.data ?? []).map((e: any) => e.intern_id));
      return (interns.data ?? []).map((r: any) => ({ ...r.profiles, enrolled: enrolledSet.has(r.user_id) }));
    },
    enabled: !!id,
  });

  const toggle = async (internId: string, isEnrolled: boolean) => {
    if (isEnrolled) {
      await supabase.from("program_enrollments").delete().eq("program_id", id!).eq("intern_id", internId);
      toast.success("Removed");
    } else {
      const { error } = await supabase.from("program_enrollments").insert({ program_id: id!, intern_id: internId });
      if (error) return toast.error(error.message);
      toast.success("Enrolled");
    }
    qc.invalidateQueries({ queryKey: ["program-enroll", id] });
  };

  return (
    <div className="container max-w-3xl py-8">
      <Link to="/hr/programs" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3"><ArrowLeft className="h-3 w-3" /> Back</Link>
      <PageHeader title="Enroll Interns" description={program?.title} />
      {isLoading ? <PageLoader /> : (rows ?? []).length === 0 ? (
        <EmptyState icon={Users} title="No interns" description="Once interns sign up, they'll show here." />
      ) : (
        <div className="space-y-2">
          {rows!.map((r: any) => (
            <div key={r.id} className="glass rounded-lg p-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-bold">
                {r.full_name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{r.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">@{r.username}</p>
              </div>
              <Button size="sm" variant={r.enrolled ? "outline" : "default"}
                className={r.enrolled ? "border-border" : "bg-gradient-primary"}
                onClick={() => toggle(r.id, r.enrolled)}>
                {r.enrolled ? <><UserMinus className="h-3.5 w-3.5 mr-1.5" />Remove</> : <><UserPlus className="h-3.5 w-3.5 mr-1.5" />Enroll</>}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
