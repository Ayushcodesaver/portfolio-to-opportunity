import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, PageLoader, EmptyState } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Briefcase, FileCheck, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { useRealtimeInvalidate } from "@/hooks/useRealtimeInvalidate";

export default function Internships() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useRealtimeInvalidate("intern-postings", [
    { table: "internship_postings", keys: [["open-postings"]] },
    { table: "applications", keys: [["my-applications"]] },
  ]);

  const { data: postings, isLoading } = useQuery({
    queryKey: ["open-postings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("internship_postings")
        .select("*")
        .eq("is_open", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: myApps } = useQuery({
    queryKey: ["my-applications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("id, posting_id, status, created_at")
        .eq("applicant_id", user!.id);
      if (error) throw error;
      return data;
    },
  });

  const { data: resume } = useQuery({
    queryKey: ["my-default-resume", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("resumes")
        .select("id, file_name")
        .eq("user_id", user!.id)
        .eq("is_default", true)
        .maybeSingle();
      return data;
    },
  });

  const apply = async (postingId: string) => {
    if (!user) return;
    if (!resume?.id) return toast.error("Upload your resume first from My Resume.");
    if (note.length > 1000) return toast.error("Cover note must be under 1000 characters.");
    setSubmitting(true);
    const { error } = await supabase.from("applications").insert({
      posting_id: postingId,
      applicant_id: user.id,
      resume_id: resume.id,
      cover_note: note.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message.includes("duplicate") ? "You already applied to this internship." : error.message);
      return;
    }
    toast.success("Application submitted with your resume");
    setOpenId(null);
    setNote("");
    qc.invalidateQueries({ queryKey: ["my-applications", user.id] });
  };

  return (
    <div className="container max-w-4xl py-8">
      <PageHeader title="Internships" description="Apply to open internships — your resume is attached automatically." />

      <div className="glass rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <FileCheck className="h-4 w-4 text-primary" />
          {resume ? (
            <span>Attaching <span className="font-medium">{resume.file_name}</span></span>
          ) : (
            <span className="text-muted-foreground">No resume uploaded yet.</span>
          )}
        </div>
        <Button asChild variant="outline" size="sm"><Link to="/my-resume">Manage resume</Link></Button>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : (postings ?? []).length === 0 ? (
        <EmptyState icon={Briefcase} title="No open internships" description="Check back soon — HR posts new openings regularly." />
      ) : (
        <div className="space-y-4">
          {(postings ?? []).map((p: any) => {
            const applied = (myApps ?? []).find((a) => a.posting_id === p.id);
            return (
              <div key={p.id} className="glass rounded-xl p-5 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{p.title}</h3>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      {p.role}{p.location ? ` · ${p.location}` : ""}{p.stipend ? ` · ${p.stipend}` : ""}
                      {p.deadline ? ` · apply by ${new Date(p.deadline).toLocaleDateString()}` : ""}
                    </p>
                  </div>
                  {applied ? (
                    <span className="text-[10px] uppercase px-2 py-1 rounded-full bg-primary/20 text-primary capitalize">
                      {applied.status}
                    </span>
                  ) : (
                    <Button size="sm" onClick={() => { setOpenId(openId === p.id ? null : p.id); setNote(""); }}>
                      {openId === p.id ? "Cancel" : "Apply"}
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{p.description}</p>

                {openId === p.id && !applied && (
                  <div className="space-y-3 border-t border-border/50 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor={`note-${p.id}`}>Cover note (optional)</Label>
                      <Textarea id={`note-${p.id}`} rows={4} maxLength={1000} value={note}
                        onChange={(e) => setNote(e.target.value)} className="bg-input/50"
                        placeholder="Why are you a good fit?" />
                    </div>
                    <Button onClick={() => apply(p.id)} disabled={submitting}>
                      {submitting ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Send className="h-4 w-4 mr-1.5" />}
                      Submit application
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
