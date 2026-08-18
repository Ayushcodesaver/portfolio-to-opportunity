import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, X, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Logo } from "@/components/common/Logo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GlowButton } from "@/components/fx/GlowButton";
import { GoogleButton } from "@/components/auth/GoogleButton";

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
    setSkills([...skills, v]); setSkillInput("");
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

  const stepTitles = [
    { t: "Create your account", s: "Start with the basics." },
    { t: "Set up your profile",  s: "Tell us a bit about yourself." },
    { t: "Internship details",   s: "Configure your goals." },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-background">
      <div className="absolute top-1/4 left-1/4 w-[28rem] h-[28rem] bg-primary/25 rounded-full blur-3xl animate-orb" />
      <div className="absolute bottom-1/4 right-1/4 w-[24rem] h-[24rem] bg-primary-glow/15 rounded-full blur-3xl animate-orb" style={{ animationDelay: "3s" }} />

      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full max-w-lg relative"
      >
        <div className="flex justify-center mb-8"><Logo size="lg" /></div>

        <div className="glass-strong rounded-2xl p-8">
          {/* Progress */}
          <div className="flex items-center justify-between mb-8">
            {[1,2,3].map((n) => (
              <div key={n} className="flex-1 flex items-center">
                <motion.div
                  animate={{ scale: step === n ? 1.05 : 1 }}
                  className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    step >= n ? "bg-gradient-primary text-primary-foreground shadow-[0_0_20px_-3px_hsl(var(--primary)/0.7)]" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step > n ? <Check className="h-4 w-4" /> : n}
                </motion.div>
                {n < 3 && (
                  <div className="flex-1 h-0.5 mx-2 bg-muted relative overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-gradient-primary"
                      animate={{ width: step > n ? "100%" : "0%" }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <h1 className="text-2xl font-bold mb-1">{stepTitles[step-1].t}</h1>
          <p className="text-sm text-muted-foreground mb-6">{stepTitles[step-1].s}</p>

          {step === 1 && (
            <div className="mb-5">
              <GoogleButton label="Sign up with Google" />
              <div className="relative mt-5 flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">or with email</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
            >
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Full name</Label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-input/60" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-input/60" />
                    </div>
                    <div className="space-y-2">
                      <Label>Username</Label>
                      <Input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g,""))} className="bg-input/60" placeholder="@handle" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-input/60" />
                    {password && (
                      <div className="flex gap-1">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className={`h-1 flex-1 rounded transition-colors ${password.length > (i+1)*2 ? "bg-primary" : "bg-muted"}`} />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm password</Label>
                    <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="bg-input/60" />
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
                      className="bg-input/60 resize-none" rows={3} placeholder="Aspiring fullstack developer building cool stuff..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Skills <span className="text-xs text-muted-foreground">({skills.length}/10)</span></Label>
                    <Input value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(skillInput); } }}
                      placeholder="Type a skill and press Enter" className="bg-input/60" />
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {skills.map((s) => (
                          <span key={s} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary/15 text-primary border border-primary/30">
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
                      <SelectTrigger className="bg-input/60"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="summer">Summer</SelectItem>
                        <SelectItem value="winter">Winter</SelectItem>
                        <SelectItem value="full_time">Full-time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Start date</Label>
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-input/60" />
                    <p className="text-xs text-muted-foreground">End date auto-set to +90 days.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Portfolio goal</Label>
                    <Select value={goal} onValueChange={(v: any) => setGoal(v)}>
                      <SelectTrigger className="bg-input/60"><SelectValue /></SelectTrigger>
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
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1 border-border">
                Back
              </Button>
            )}
            {step < 3 ? (
              <GlowButton onClick={onNext} className="flex-1">Continue</GlowButton>
            ) : (
              <GlowButton onClick={onSubmit} disabled={loading} className="flex-1">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
              </GlowButton>
            )}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account? <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          <Link to="/" className="hover:text-primary inline-flex items-center gap-1"><ArrowLeft className="h-3 w-3" /> Back to home</Link>
        </p>
      </motion.div>
    </div>
  );
}
