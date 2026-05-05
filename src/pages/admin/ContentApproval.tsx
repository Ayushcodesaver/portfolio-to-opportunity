import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, PageLoader, EmptyState } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Check, X, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function ContentApproval() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["pending-projects"],
    queryFn: async () => {
      const { data } = await supabase.from("projects")
        .select("*, profiles:user_id(username, full_name)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const moderate = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("projects").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    if (user) {
      await supabase.from("audit_logs").insert({ admin_id: user.id, action: `project_${status}`, target_type: "project", target_id: id });
    }
    toast.success(`Project ${status}`);
    qc.invalidateQueries({ queryKey: ["pending-projects"] });
  };

  return (
    <div className="container max-w-6xl py-8">
      <PageHeader title="Content Approval" description="Review and moderate intern submissions." />
      {isLoading ? <PageLoader /> : data && data.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((p: any) => (
            <div key={p.id} className="glass rounded-xl overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-background">
                {p.media_url && <img src={p.media_url} alt={p.title} className="w-full h-full object-cover" />}
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-1">{p.title}</h3>
                <p className="text-xs text-muted-foreground mb-2">by @{p.profiles?.username}</p>
                <p className="text-xs text-muted-foreground line-clamp-3 mb-3">{p.description}</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => moderate(p.id, "approved")} className="bg-gradient-primary flex-1">
                    <Check className="h-3.5 w-3.5 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => moderate(p.id, "rejected")} className="border-destructive/50 text-destructive flex-1">
                    <X className="h-3.5 w-3.5 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={ShieldCheck} title="Inbox zero" description="No projects waiting for review." />
      )}
    </div>
  );
}
