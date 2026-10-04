import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, X, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/common/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const SUGGESTED_TAGS = ["React","TypeScript","Node.js","Python","Next.js","Tailwind","PostgreSQL","Docker","AWS","GraphQL","Vue","Angular"];

export default function CreateProject() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [github, setGithub] = useState("");
  const [demo, setDemo] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [difficulty, setDifficulty] = useState<"beginner"|"intermediate"|"advanced">("intermediate");
  const [isTeam, setIsTeam] = useState(false);
  const [media, setMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [improving, setImproving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const addTag = (t: string) => {
    const v = t.trim();
    if (!v || tags.includes(v) || tags.length >= 5) return;
    setTags([...tags, v]); setTagInput("");
  };

  const onMedia = (f: File | null) => {
    if (!f) return;
    const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"];
    if (f.type && !ALLOWED.includes(f.type)) { toast.error("Only images (jpg/png/webp/gif) or mp4/webm video allowed"); return; }
    if (f.size > 10 * 1024 * 1024) { toast.error("Max 10 MB"); return; }
    setMedia(f);
    setMediaPreview(URL.createObjectURL(f));
  };

  const improveWithAI = async () => {
    if (!description.trim()) { toast.error("Write a description first"); return; }
    setImproving(true);
    const { data, error } = await supabase.functions.invoke("improve-description", {
      body: { description, title },
    });
    setImproving(false);
    if (error) { toast.error(error.message); return; }
    if (data?.improved) {
      setDescription(data.improved);
      toast.success("Description improved with AI ✨");
    }
  };

  const submit = async (status: "draft" | "pending") => {
    if (!user) return;
    if (!title.trim()) { toast.error("Title is required"); return; }
    setSubmitting(true);

    let mediaUrl: string | null = null;
    if (media) {
      const path = `${user.id}/${Date.now()}-${media.name}`;
      const { error: upErr } = await supabase.storage.from("project-media").upload(path, media);
      if (upErr) { setSubmitting(false); toast.error(upErr.message); return; }
      const { data: { publicUrl } } = supabase.storage.from("project-media").getPublicUrl(path);
      mediaUrl = publicUrl;
    }

    const { error } = await supabase.from("projects").insert({
      user_id: user.id, title, description, github_url: github || null, demo_url: demo || null,
      tags, difficulty, is_team: isTeam, media_url: mediaUrl, status,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "draft" ? "Saved as draft" : "Submitted for review");
    navigate("/my-projects");
  };

  return (
    <div className="container max-w-6xl py-8">
      <PageHeader title="Create Project" description="Show off what you're building." />

      <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
        <div className="space-y-5">
          <div className="glass rounded-xl p-6 space-y-5">
            <div className="space-y-2">
              <Label>Project title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} className="bg-input/50" placeholder="My amazing project" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Description</Label>
                <Button type="button" size="sm" variant="ghost" onClick={improveWithAI} disabled={improving}
                  className="text-primary-glow hover:text-primary">
                  {improving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
                  Improve with AI
                </Button>
              </div>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={8}
                maxLength={2000} className="bg-input/50 resize-none" placeholder="What does it do? What problem does it solve? What did you learn?" />
              <p className="text-xs text-muted-foreground text-right">{description.length}/2000</p>
            </div>

            <div className="space-y-2">
              <Label>Cover image / video</Label>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 cursor-pointer hover:border-primary/50 transition-colors bg-input/20">
                {mediaPreview ? (
                  <img src={mediaPreview} alt="preview" className="max-h-48 rounded-lg" />
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Click or drop file (max 10 MB)</p>
                  </>
                )}
                <input type="file" accept="image/*,video/*" className="hidden"
                  onChange={(e) => onMedia(e.target.files?.[0] ?? null)} />
              </label>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>GitHub URL</Label>
                <Input value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/..." className="bg-input/50" />
              </div>
              <div className="space-y-2">
                <Label>Demo URL</Label>
                <Input value={demo} onChange={(e) => setDemo(e.target.value)} placeholder="https://..." className="bg-input/50" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="glass rounded-xl p-6 space-y-5">
            <div className="space-y-2">
              <Label>Tech stack <span className="text-xs text-muted-foreground">({tags.length}/5)</span></Label>
              <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(tagInput); }}}
                placeholder="Type and press Enter" className="bg-input/50" />
              <div className="flex flex-wrap gap-1.5">
                {tags.map(t => (
                  <span key={t} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary/20 text-primary-glow">
                    {t}<button onClick={() => setTags(tags.filter(x => x !== t))}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SUGGESTED_TAGS.filter(t => !tags.includes(t)).slice(0,6).map(t => (
                  <button key={t} onClick={() => addTag(t)}
                    className="text-xs px-2 py-1 rounded-full border border-border hover:border-primary hover:text-primary transition-colors">
                    + {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                <SelectTrigger className="bg-input/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Project type</Label>
              <div className="flex gap-2">
                <Button type="button" variant={isTeam ? "outline" : "default"} onClick={() => setIsTeam(false)}
                  className={!isTeam ? "bg-gradient-primary flex-1" : "flex-1"}>Individual</Button>
                <Button type="button" variant={isTeam ? "default" : "outline"} onClick={() => setIsTeam(true)}
                  className={isTeam ? "bg-gradient-primary flex-1" : "flex-1"}>Team</Button>
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-6 space-y-2">
            <Button onClick={() => submit("pending")} disabled={submitting} className="w-full bg-gradient-primary shadow-soft">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit for review"}
            </Button>
            <Button onClick={() => submit("draft")} disabled={submitting} variant="outline" className="w-full border-border">
              Save as draft
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
