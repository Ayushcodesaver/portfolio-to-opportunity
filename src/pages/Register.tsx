import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Logo } from "@/components/common/Logo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SUGGESTED_SKILLS = ["React","TypeScript","Node.js","Python","Next.js","Tailwind","PostgreSQL","Docker","AWS","GraphQL"];

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  const [internshipType, setInternshipType] = useState<"summer"|"winter"|"full_time">("summer");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0,10));
  const [goal, setGoal] = useState<"frontend"|"backend"|"fullstack"|"mobile"|"data"|"devops">("fullstack");

  const addSkill = (s: string) => {
    const v = s.trim();
    if (!v || skills.includes(v) || skills.length >= 10) return;
    setSkills([...skills, v]);
    setSkillInput("");
  };

  const validateStep = () => {
    if (step === 1) {
      if (!fullName || !email || !username || !password) return "Fill all fields";
      if (password.length < 8) return "Password must be at least 8 characters";
      if (password !== confirm) return "Passwords don't match";
    }
    return null;
  };

  const onNext = () => {
    const err = validateStep();
    if (err) { toast.error(err); return; }
    setStep((s) => s + 1);
  };

  const onSubmit = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}/feed`,
        data: { full_name: fullName, username },
      },
    });
    if (error || !data.user) {
      setLoading(false);
      toast.error(error?.message ?? "Sign up failed");
      return;
    }

    // wait briefly for trigger to insert profile then update with extra info
    await new Promise(r => setTimeout(r, 400));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 90);
    await supabase.from("profiles").update({
      bio, skills, internship_type: internshipType,
      internship_start: startDate, internship_end: endDate.toISOString().slice(0,10),
      portfolio_goal: goal,
    }).eq("id", data.user.id);

    setLoading(false);
    toast.success("Welcome to Xebure!");
    navigate("/feed");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-orb" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-glow/15 rounded-full blur-3xl animate-orb" style={{ animationDelay: "3s" }} />

      <div className="w-full max-w-lg relative">
        <div className="flex justify-center mb-8"><Logo /></div>

        <div className="glass-strong rounded-2xl p-8">
          {/* Steps indicator */}
          <div className="flex items-center justify-between mb-8">
            {[1,2,3].map((n) => (
              <div key={n} className="flex-1 flex items-center">
                <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  step >= n ? "bg-gradient-primary text-primary-foreground glow-violet" : "bg-muted text-muted-foreground"
                }`}>
                  {step > n ? <Check className="h-4 w-4" /> : n}
                </div>
                {n < 3 && <div className={`flex-1 h-0.5 mx-2 transition-all ${step > n ? "bg-primary" : "bg-muted"}`} />}
              </div>
            ))}
          </div>

          <h1 className="text-2xl font-bold mb-1">
            {step === 1 && "Create your account"}
            {step === 2 && "Set up your profile"}
            {step === 3 && "Internship details"}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {step === 1 && "Start with the basics."}
            {step === 2 && "Tell us a bit about yourself."}
            {step === 3 && "Configure your internship goals."}
          </p>

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Full name</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-input/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-input/50" />
                </div>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g,""))} className="bg-input/50" placeholder="@handle" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-input/50" />
                {password && (
                  <div className="flex gap-1">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className={`h-1 flex-1 rounded ${
                        password.length > (i+1)*2 ? "bg-primary" : "bg-muted"
                      }`} />
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Confirm password</Label>
                <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="bg-input/50" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Bio</Label>
                  <span className="text-xs text-muted-foreground">{bio.length}/160</span>
                </div>
                <Textarea value={bio} maxLength={160} onChange={(e) => setBio(e.target.value)}
                  className="bg-input/50 resize-none" rows={3} placeholder="Aspiring fullstack developer building cool stuff..." />
              </div>

              <div className="space-y-2">
                <Label>Skills <span className="text-xs text-muted-foreground">({skills.length}/10)</span></Label>
                <Input value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(skillInput); } }}
                  placeholder="Type a skill and press Enter" className="bg-input/50" />
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {skills.map((s) => (
                      <span key={s} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary/20 text-primary-glow">
                        {s}
                        <button onClick={() => setSkills(skills.filter(x => x !== s))}><X className="h-3 w-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {SUGGESTED_SKILLS.filter(s => !skills.includes(s)).slice(0,8).map((s) => (
                    <button key={s} onClick={() => addSkill(s)}
                      className="text-xs px-2 py-1 rounded-full border border-border hover:border-primary hover:text-primary transition-colors">
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Internship type</Label>
                <Select value={internshipType} onValueChange={(v: any) => setInternshipType(v)}>
                  <SelectTrigger className="bg-input/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summer">Summer</SelectItem>
                    <SelectItem value="winter">Winter</SelectItem>
                    <SelectItem value="full_time">Full-time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-input/50" />
                <p className="text-xs text-muted-foreground">End date auto-set to +90 days.</p>
              </div>
              <div className="space-y-2">
                <Label>Portfolio goal</Label>
                <Select value={goal} onValueChange={(v: any) => setGoal(v)}>
                  <SelectTrigger className="bg-input/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="frontend">Frontend</SelectItem>
                    <SelectItem value="backend">Backend</SelectItem>
                    <SelectItem value="fullstack">Fullstack</SelectItem>
                    <SelectItem value="mobile">Mobile</SelectItem>
                    <SelectItem value="data">Data / ML</SelectItem>
                    <SelectItem value="devops">DevOps</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-8">
            {step > 1 && <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1 border-border">Back</Button>}
            {step < 3 ? (
              <Button onClick={onNext} className="flex-1 bg-gradient-primary glow-violet">Continue</Button>
            ) : (
              <Button onClick={onSubmit} disabled={loading} className="flex-1 bg-gradient-primary glow-violet">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
              </Button>
            )}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account? <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
