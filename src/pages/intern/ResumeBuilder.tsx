import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Download, Wand2, Plus, Trash2, FileDown, Mail, Phone, MapPin, Link as LinkIcon } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { PlanGate } from "@/components/common/PlanGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { GlowButton } from "@/components/fx/GlowButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

type Resume = {
  name: string;
  headline: string;
  contact: { email: string; phone: string; location: string; links: { label: string; url: string }[] };
  summary: string;
  skills: string[];
  experience: { role: string; company: string; location: string; start: string; end: string; bullets: string[] }[];
  projects: { name: string; tech: string[]; bullets: string[]; url: string }[];
  education: { degree: string; school: string; start: string; end: string; details: string }[];
  achievements: string[];
  certifications: { name: string; issuer: string; date: string }[];
};

type Experience = { role: string; company: string; start: string; end: string; description: string };
type Education  = { degree: string; school: string; start: string; end: string };

export default function ResumeBuilder() {
  return (
    <div className="container max-w-7xl py-8">
      <PageHeader
        title="AI Resume Builder"
        description="Auto-generates a polished, ATS-friendly resume from your profile, projects, and approved tasks."
      />
      <PlanGate
        feature="resume_review_1"
        title="Resume Builder is a Pro feature"
        description="Upgrade to Pro for 1 AI-built resume, or Premium for unlimited regenerations."
        soft={false}
      >
        <Inner />
      </PlanGate>
    </div>
  );
}

function Inner() {
  const { user } = useAuth();
  const [targetRole, setTargetRole] = useState("Software Engineer Intern");
  const [phone, setPhone] = useState("");
  const [extraSummary, setExtraSummary] = useState("");
  const [experience, setExperience] = useState<Experience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(false);
  

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      if (data?.full_name && !targetRole) setTargetRole(`${data.full_name} — Intern`);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const generate = async () => {
    const role = targetRole.trim();
    if (role.length < 2 || role.length > 120) { toast.error("Target role must be 2-120 characters"); return; }
    if (phone && !/^[+\d\s\-()]{5,20}$/.test(phone)) { toast.error("Invalid phone number"); return; }
    if (extraSummary.length > 1000) { toast.error("Summary too long (max 1000 chars)"); return; }
    if (experience.some(e => e.description && e.description.length > 800)) { toast.error("Experience description too long"); return; }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-resume`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          targetRole,
          extra: {
            phone,
            additional_summary: extraSummary,
            experience: experience.filter((e) => e.role || e.company),
            education: education.filter((e) => e.degree || e.school),
          },
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Generation failed");
      setResume(data.resume);
      toast.success("Resume built! Scroll right to preview.");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = () => {
    if (!resume) return;
    window.print();
  };

  const downloadJson = () => {
    if (!resume) return;
    const blob = new Blob([JSON.stringify(resume, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${resume.name.replace(/\s+/g, "_")}_resume.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      {/* Print stylesheet — only the preview prints */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #resume-print, #resume-print * { visibility: visible !important; }
          #resume-print { position: absolute; inset: 0; padding: 32px; background: white; color: #111; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="grid lg:grid-cols-[400px_1fr] gap-6 mt-6 no-print">
        {/* INPUTS */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
          className="glass-strong rounded-2xl p-5 border border-primary/20 space-y-5 h-fit sticky top-4"
        >
          <div>
            <Label className="text-xs uppercase tracking-wider">Target role</Label>
            <Input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider">Phone (optional)</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 ..." className="mt-1.5" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider">Extra context for the AI</Label>
            <Textarea value={extraSummary} onChange={(e) => setExtraSummary(e.target.value)}
              rows={3} placeholder="Highlight strengths, tech focus, or career goal..."
              className="mt-1.5 resize-none" />
          </div>

          <ListSection
            title="Experience"
            items={experience}
            setItems={setExperience}
            blank={{ role: "", company: "", start: "", end: "", description: "" }}
            render={(it, set) => (
              <>
                <Input value={it.role} onChange={(e) => set({ ...it, role: e.target.value })} placeholder="Role" />
                <Input value={it.company} onChange={(e) => set({ ...it, company: e.target.value })} placeholder="Company" />
                <div className="grid grid-cols-2 gap-2">
                  <Input value={it.start} onChange={(e) => set({ ...it, start: e.target.value })} placeholder="Start" />
                  <Input value={it.end} onChange={(e) => set({ ...it, end: e.target.value })} placeholder="End / Present" />
                </div>
                <Textarea value={it.description} onChange={(e) => set({ ...it, description: e.target.value })}
                  rows={2} placeholder="What you did (AI will rewrite into bullets)" className="resize-none" />
              </>
            )}
          />

          <ListSection
            title="Education"
            items={education}
            setItems={setEducation}
            blank={{ degree: "", school: "", start: "", end: "" }}
            render={(it, set) => (
              <>
                <Input value={it.degree} onChange={(e) => set({ ...it, degree: e.target.value })} placeholder="Degree" />
                <Input value={it.school} onChange={(e) => set({ ...it, school: e.target.value })} placeholder="School" />
                <div className="grid grid-cols-2 gap-2">
                  <Input value={it.start} onChange={(e) => set({ ...it, start: e.target.value })} placeholder="Start" />
                  <Input value={it.end} onChange={(e) => set({ ...it, end: e.target.value })} placeholder="End" />
                </div>
              </>
            )}
          />

          <div className="flex flex-col gap-2 pt-2">
            <GlowButton tone="primary" onClick={generate} disabled={loading} className="h-11">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
              {resume ? "Regenerate with AI" : "Auto-build with AI"}
            </GlowButton>
            {resume && (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={downloadPdf} className="h-10">
                  <FileDown className="h-4 w-4 mr-1.5" /> PDF
                </Button>
                <Button variant="outline" onClick={downloadJson} className="h-10">
                  <Download className="h-4 w-4 mr-1.5" /> JSON
                </Button>
              </div>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">
            We auto-include your XEBURE projects and approved tasks.
          </p>
        </motion.div>

        {/* PREVIEW */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          {resume ? (
            <ResumePreview resume={resume} />
          ) : (
            <div className="glass rounded-2xl border border-border/40 p-12 text-center min-h-[600px] flex flex-col items-center justify-center">
              <div className="p-4 rounded-full bg-gradient-primary mb-5 shadow-premium">
                <Sparkles className="h-7 w-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">Your AI-built resume will appear here</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Fill what you have on the left — the AI auto-pulls your profile, projects, and approved tasks,
                then writes quantified bullets in seconds.
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Print-only mount of the resume */}
      {resume && (
        <div id="resume-print" className="hidden print:block">
          <ResumePreview resume={resume} bare />
        </div>
      )}
    </>
  );
}

/* ----------------- repeating-section helper ----------------- */

function ListSection<T extends object>({ title, items, setItems, blank, render }: {
  title: string;
  items: T[];
  setItems: (t: T[]) => void;
  blank: T;
  render: (it: T, set: (n: T) => void) => React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label className="text-xs uppercase tracking-wider">{title}</Label>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setItems([...items, { ...blank }])}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add
        </Button>
      </div>
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={i} className="rounded-lg border border-border/40 p-3 space-y-2 bg-card/40">
            {render(it, (n) => setItems(items.map((x, j) => (j === i ? n : x))))}
            <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive"
              onClick={() => setItems(items.filter((_, j) => j !== i))}>
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
            </Button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-[11px] text-muted-foreground italic">None — AI will skip this section.</p>
        )}
      </div>
    </div>
  );
}

/* ----------------- resume preview ----------------- */

const ResumePreview = ({ resume, bare = false }: { resume: Resume; bare?: boolean }) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    bare ? <div>{children}</div> : (
      <div className="rounded-2xl bg-foreground text-slate-900 shadow-2xl p-10 max-w-[860px] mx-auto print:shadow-none print:p-0">
        {children}
      </div>
    );

  return (
    <Wrapper>
      {/* Header */}
      <div className="border-b-2 border-slate-900 pb-4 mb-5">
        <h1 className="text-3xl font-extrabold tracking-tight">{resume.name}</h1>
        <p className="text-sm text-slate-600 mt-0.5">{resume.headline}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-700 mt-3">
          {resume.contact?.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{resume.contact.email}</span>}
          {resume.contact?.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{resume.contact.phone}</span>}
          {resume.contact?.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{resume.contact.location}</span>}
          {resume.contact?.links?.map((l) => (
            <a key={l.url} href={l.url} className="inline-flex items-center gap-1 underline">
              <LinkIcon className="h-3 w-3" /> {l.label}
            </a>
          ))}
        </div>
      </div>

      {resume.summary && <Section title="Summary"><p className="text-sm leading-relaxed">{resume.summary}</p></Section>}

      {resume.skills?.length > 0 && (
        <Section title="Skills">
          <div className="flex flex-wrap gap-1.5">
            {resume.skills.map((s) => (
              <span key={s} className="text-xs px-2 py-0.5 rounded border border-slate-300 bg-slate-50">{s}</span>
            ))}
          </div>
        </Section>
      )}

      {resume.experience?.length > 0 && (
        <Section title="Experience">
          {resume.experience.map((e, i) => (
            <div key={i} className="mb-3 last:mb-0">
              <div className="flex justify-between text-sm">
                <span className="font-semibold">{e.role} · <span className="font-normal">{e.company}</span></span>
                <span className="text-xs text-slate-600">{[e.start, e.end].filter(Boolean).join(" – ")}</span>
              </div>
              {e.location && <p className="text-xs text-slate-600 italic">{e.location}</p>}
              <ul className="list-disc ml-5 text-sm mt-1 space-y-0.5">
                {e.bullets?.map((b, j) => <li key={j}>{b}</li>)}
              </ul>
            </div>
          ))}
        </Section>
      )}

      {resume.projects?.length > 0 && (
        <Section title="Projects">
          {resume.projects.map((p, i) => (
            <div key={i} className="mb-3 last:mb-0">
              <div className="flex justify-between items-baseline text-sm">
                <span className="font-semibold">{p.name}</span>
                {p.url && <a href={p.url} className="text-xs underline text-slate-600">{p.url}</a>}
              </div>
              {p.tech?.length > 0 && <p className="text-xs text-slate-600">{p.tech.join(" · ")}</p>}
              <ul className="list-disc ml-5 text-sm mt-1 space-y-0.5">
                {p.bullets?.map((b, j) => <li key={j}>{b}</li>)}
              </ul>
            </div>
          ))}
        </Section>
      )}

      {resume.education?.length > 0 && (
        <Section title="Education">
          {resume.education.map((e, i) => (
            <div key={i} className="text-sm flex justify-between mb-1.5 last:mb-0">
              <div>
                <span className="font-semibold">{e.degree}</span>
                <span className="text-slate-700"> — {e.school}</span>
                {e.details && <p className="text-xs text-slate-600">{e.details}</p>}
              </div>
              <span className="text-xs text-slate-600">{[e.start, e.end].filter(Boolean).join(" – ")}</span>
            </div>
          ))}
        </Section>
      )}

      {resume.achievements?.length > 0 && (
        <Section title="Achievements">
          <ul className="list-disc ml-5 text-sm space-y-0.5">
            {resume.achievements.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </Section>
      )}

      {resume.certifications?.length > 0 && (
        <Section title="Certifications">
          <ul className="text-sm space-y-0.5">
            {resume.certifications.map((c, i) => (
              <li key={i} className="flex justify-between">
                <span>{c.name} — <span className="text-slate-700">{c.issuer}</span></span>
                <span className="text-xs text-slate-600">{c.date}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </Wrapper>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-4">
    <h2 className="text-[11px] uppercase tracking-[0.18em] font-bold text-slate-900 border-b border-slate-300 pb-1 mb-2">
      {title}
    </h2>
    {children}
  </div>
);
