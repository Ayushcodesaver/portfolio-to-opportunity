import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, PageLoader, EmptyState } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Ticket } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const PRIO_COLORS: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-info/20 text-info",
  high: "bg-warning/20 text-warning",
};
const STATUS_COLORS: Record<string, string> = {
  open: "bg-info/20 text-info",
  in_progress: "bg-warning/20 text-warning",
  resolved: "bg-success/20 text-success",
  closed: "bg-muted text-muted-foreground",
};

export default function HRTickets() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["hr-tickets"],
    queryFn: async () => (await supabase.from("tickets").select("*, profiles:intern_id(full_name, username)").order("created_at", { ascending: false })).data ?? [],
  });

  const setStatus = async (id: string, status: string) => {
    await supabase.from("tickets").update({ status: status as any, hr_id: user!.id }).eq("id", id);
    toast.success("Updated");
    qc.invalidateQueries({ queryKey: ["hr-tickets"] });
  };

  const filter = (s: string) => (data ?? []).filter((t: any) => s === "all" ? true : t.status === s);

  return (
    <div className="container max-w-5xl py-8">
      <PageHeader title="Tickets" description="Support tickets from interns." />
      <Tabs defaultValue="open">
        <TabsList className="bg-muted">
          <TabsTrigger value="open">Open ({filter("open").length})</TabsTrigger>
          <TabsTrigger value="in_progress">In progress ({filter("in_progress").length})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({filter("resolved").length})</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        {["open","in_progress","resolved","all"].map(t => (
          <TabsContent value={t} key={t} className="mt-6 space-y-3">
            {isLoading ? <PageLoader /> : filter(t).length === 0 ? (
              <EmptyState icon={Ticket} title="No tickets" description="Nothing matches this filter." />
            ) : filter(t).map((tk: any) => (
              <div key={tk.id} className="glass rounded-xl p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold">{tk.subject}</h3>
                      <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold ${PRIO_COLORS[tk.priority]}`}>{tk.priority}</span>
                      <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold ${STATUS_COLORS[tk.status]}`}>{tk.status}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">From {tk.profiles?.full_name} · {format(new Date(tk.created_at), "PP p")}</p>
                  </div>
                  <Select value={tk.status} onValueChange={(v) => setStatus(tk.id, v)}>
                    <SelectTrigger className="w-32 h-8 text-xs bg-input/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem><SelectItem value="in_progress">In progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem><SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-2">{tk.description}</p>
              </div>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
