import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader, PageLoader, EmptyState } from "@/components/common/PageHeader";
import { toast } from "sonner";
import { FolderKanban } from "lucide-react";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { useRealtimeInvalidate } from "@/hooks/useRealtimeInvalidate";

export default function MyProjects() {
  const { user } = useAuth();
  const qc = useQueryClient();

  useRealtimeInvalidate("my-projects-rt", [
    { table: "projects", filter: user ? `user_id=eq.${user.id}` : undefined, keys: [["my-projects"]] },
    { table: "project_likes", keys: [["my-projects"]] },
  ], !!user);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["my-projects", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Project deleted");
    qc.invalidateQueries({ queryKey: ["my-projects"] });
  };

  const filtered = (status?: string) =>
    (projects ?? []).filter((p) => !status || p.status === status);

  return (
    <div className="container max-w-7xl py-8">
      <PageHeader
        title="My Projects"
        description="Manage your Xebure portfolio."
        action={
          <Link to="/create-project">
            <Button className="bg-gradient-primary"><Plus className="h-4 w-4 mr-1.5" />New project</Button>
          </Link>
        }
      />

      <Tabs defaultValue="all">
        <TabsList className="bg-muted">
          <TabsTrigger value="all">All ({projects?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({filtered("approved").length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({filtered("pending").length})</TabsTrigger>
          <TabsTrigger value="draft">Drafts ({filtered("draft").length})</TabsTrigger>
        </TabsList>

        {["all","approved","pending","draft"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-6">
            {isLoading ? <PageLoader /> : (
              filtered(tab === "all" ? undefined : tab).length === 0 ? (
                <EmptyState
                  icon={FolderKanban}
                  title="No projects here yet"
                  description="Create your first project to start building your portfolio."
                  action={<Link to="/create-project"><Button className="bg-gradient-primary">Create project</Button></Link>}
                />
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered(tab === "all" ? undefined : tab).map((p: any) => (
                    <div key={p.id} className="glass rounded-xl overflow-hidden group hover:border-primary/50 transition-colors">
                      <div className="aspect-video bg-gradient-to-br from-primary/20 to-background relative">
                        {p.media_url && <img src={p.media_url} alt={p.title} className="w-full h-full object-cover" />}
                        <div className="absolute top-2 right-2">
                          <StatusPill kind={p.status as any} />
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold mb-1 truncate">{p.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{p.description || "No description"}</p>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost"><Eye className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="ghost"><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(p.id)} className="ml-auto text-destructive hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
