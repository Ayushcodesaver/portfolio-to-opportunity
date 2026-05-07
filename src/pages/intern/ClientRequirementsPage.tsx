import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, PageLoader, EmptyState } from "@/components/common/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileText, History, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function ClientRequirementsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["client-requirements-all"],
    queryFn: async () => {
      const { data } = await supabase.from("client_requirements").select("*").order("updated_at", { ascending: false });
      return data ?? [];
    },
  });

  useEffect(() => {
    const ch = supabase.channel("client-reqs-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "client_requirements" }, () => qc.invalidateQueries({ queryKey: ["client-requirements-all"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  return (
    <div className="container max-w-5xl py-8">
      <PageHeader title="Client Requirements" description="Latest specs and design guidelines from HR." />
      <Tabs defaultValue="active">
        <TabsList className="bg-muted">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
        {(["active","archived"] as const).map((tab) => (
          <TabsContent value={tab} key={tab} className="mt-6 space-y-3">
            {isLoading ? <PageLoader /> : (data ?? []).filter(r => tab === "active" ? r.is_active : !r.is_active).length === 0 ? (
              <EmptyState icon={FileText} title="No requirements yet" description="HR has not pushed any requirements." />
            ) : (data ?? []).filter(r => tab === "active" ? r.is_active : !r.is_active).map((r: any) => <ReqCard r={r} key={r.id} />)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function ReqCard({ r }: { r: any }) {
  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold">{r.title}</h3>
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/20 text-primary-glow font-bold">v{r.version}</span>
          </div>
          {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
          <p className="text-xs text-muted-foreground mt-1">Last updated {format(new Date(r.updated_at), "PPp")}</p>
        </div>
        <VersionHistory id={r.id} />
      </div>
      <div className="prose prose-invert prose-sm max-w-none mt-4 whitespace-pre-wrap">{r.content}</div>
    </div>
  );
}

function VersionHistory({ id }: { id: string }) {
  const { data } = useQuery({
    queryKey: ["req-versions", id],
    queryFn: async () => {
      const { data } = await supabase.from("client_requirement_versions").select("*").eq("requirement_id", id).order("version", { ascending: false });
      return data ?? [];
    },
  });
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-xs"><History className="h-3.5 w-3.5 mr-1.5" /> History</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl glass-strong max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Version history</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {(data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No history yet.</p> : data!.map((v: any) => (
            <div key={v.id} className="p-3 rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary-glow font-bold">v{v.version}</span>
                <span className="text-xs text-muted-foreground">{format(new Date(v.created_at), "PPp")}</span>
              </div>
              <p className="font-medium text-sm">{v.title}</p>
              {v.change_note && <p className="text-xs text-muted-foreground italic mt-1">"{v.change_note}"</p>}
              <details className="mt-2"><summary className="text-xs text-primary cursor-pointer">View content</summary>
                <div className="text-xs whitespace-pre-wrap mt-2 text-muted-foreground">{v.content}</div></details>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
