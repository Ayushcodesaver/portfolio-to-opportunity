import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, PageLoader, EmptyState } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, Download, Loader2, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { useRealtimeInvalidate } from "@/hooks/useRealtimeInvalidate";

const postingSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(120),
  role: z.string().trim().min(2, "Role is required").max(50),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(3000),
  location: z.string().trim().max(100),
  stipend: z.string().trim().max(50),
  deadline: z.string().max(20),
});

const STATUSES = ["pending", "shortlisted", "rejected", "hired"];

export default function HRPostings() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", role: "", description: "", location: "", stipend: "", deadline: "" });

  useRealtimeInvalidate("hr-postings", [
    { table: "internship_postings", keys: [["hr-postings"]] },
    { table: "applications", keys: [["hr-applications"]] },
  ]);

  const { data: postings, isLoading } = useQuery({
    queryKey: ["hr-postings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("internship_postings")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: applications } = useQuery({
    queryKey: ["hr-applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("id, posting_id, applicant_id, cover_note, status, created_at, resume_id")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const ids = [...new Set((data ?? []).map((a) => a.applicant_id))];
      const resumeIds = (data ?? []).map((a) => a.resume_id).filter(Boolean) as string[];
      const [{ data: profiles }, resumesRes] = await Promise.all([
        ids.length
          ? supabase.from("profiles").select("id, full_name, username, desired_role, contact_email").in("id", ids)
          : Promise.resolve({ data: [] as any[] }),
        resumeIds.length
          ? supabase.from("resumes").select("id, file_name, file_path").in("id", resumeIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      const pMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
      const rMap = new Map((resumesRes.data ?? []).map((r: any) => [r.id, r]));
      return (data ?? []).map((a) => ({
        ...a,
        profile: pMap.get(a.applicant_id),
        resume: a.resume_id ? rMap.get(a.resume_id) : null,
      }));
    },
  });

  const createPosting = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = postingSchema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setSaving(true);
    const { error } = await supabase.from("internship_postings").insert({
      title: parsed.data.title,
      role: parsed.data.role,
      description: parsed.data.description,
      location: parsed.data.location || null,
      stipend: parsed.data.stipend || null,
      deadline: parsed.data.deadline || null,
      created_by: user?.id ?? null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Internship posted");
    setForm({ title: "", role: "", description: "", location: "", stipend: "", deadline: "" });
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["hr-postings"] });
  };

  const toggleOpen = async (p: any) => {
    const { error } = await supabase.from("internship_postings").update({ is_open: !p.is_open }).eq("id", p.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["hr-postings"] });
  };

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("applications").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Marked ${status}`);
    qc.invalidateQueries({ queryKey: ["hr-applications"] });
  };

  const downloadResume = async (app: any) => {
    if (!app.resume?.file_path) return toast.error("No resume attached");
    setBusy(app.id);
    const { data, error } = await supabase.storage
      .from("resumes")
      .createSignedUrl(app.resume.file_path, 60, { download: app.resume.file_name });
    setBusy(null);
    if (error || !data) return toast.error(error?.message || "Could not generate link");
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = app.resume.file_name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="container max-w-6xl py-8">
      <PageHeader
        title="Internship Postings"
        description="Post openings and review student applications with their resumes."
        action={
          <Button onClick={() => setOpen((v) => !v)}>
            <Plus className="h-4 w-4 mr-1.5" /> {open ? "Close form" : "New posting"}
          </Button>
        }
      />

      {open && (
        <form onSubmit={createPosting} className="glass rounded-xl p-6 space-y-4 mb-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={form.title} maxLength={120} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-input/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input id="role" value={form.role} maxLength={50} placeholder="frontend, data, ..." onChange={(e) => setForm({ ...form, role: e.target.value })} className="bg-input/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={form.location} maxLength={100} onChange={(e) => setForm({ ...form, location: e.target.value })} className="bg-input/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stipend">Stipend</Label>
              <Input id="stipend" value={form.stipend} maxLength={50} onChange={(e) => setForm({ ...form, stipend: e.target.value })} className="bg-input/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input id="deadline" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="bg-input/50" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={5} maxLength={3000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-input/50" />
          </div>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />} Publish posting
          </Button>
        </form>
      )}

      {isLoading ? (
        <PageLoader />
      ) : (postings ?? []).length === 0 ? (
        <EmptyState icon={Briefcase} title="No postings yet" description="Create your first internship posting." />
      ) : (
        <div className="space-y-6">
          {(postings ?? []).map((p: any) => {
            const apps = (applications ?? []).filter((a: any) => a.posting_id === p.id);
            return (
              <div key={p.id} className="glass rounded-xl p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{p.title}</h3>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      {p.role}{p.location ? ` · ${p.location}` : ""}{p.stipend ? ` · ${p.stipend}` : ""}
                      {p.deadline ? ` · closes ${new Date(p.deadline).toLocaleDateString()}` : ""}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => toggleOpen(p)}>
                    {p.is_open ? "Close applications" : "Reopen"}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{p.description}</p>

                <div className="border-t border-border/50 pt-4">
                  <p className="text-sm font-medium flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4 text-primary" /> Applications ({apps.length})
                  </p>
                  {apps.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No applications yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {apps.map((a: any) => (
                        <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/50 bg-muted/20 p-3">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{a.profile?.full_name ?? "Unknown"}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              @{a.profile?.username} {a.profile?.contact_email ? `· ${a.profile.contact_email}` : ""}
                            </p>
                            {a.cover_note && <p className="text-xs mt-1 text-muted-foreground line-clamp-2">{a.cover_note}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <Select value={a.status} onValueChange={(v) => setStatus(a.id, v)}>
                              <SelectTrigger className="w-36 bg-input/50 h-9"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {STATUSES.map((s) => (
                                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button size="sm" variant="outline" onClick={() => downloadResume(a)} disabled={!a.resume || busy === a.id}>
                              {busy === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-1.5" />}
                              Resume
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
