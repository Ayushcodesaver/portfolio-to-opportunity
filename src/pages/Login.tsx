import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/common/Logo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GlowButton } from "@/components/fx/GlowButton";
import { ParticleBackground } from "@/components/fx/ParticleBackground";
import { GoogleButton } from "@/components/auth/GoogleButton";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Welcome back!");
    const from = (location.state as any)?.from?.pathname || "/feed";
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-background">
      <div className="absolute top-1/4 left-1/4 w-[28rem] h-[28rem] bg-primary/25 rounded-full blur-3xl animate-orb" />
      <div className="absolute bottom-1/4 right-1/4 w-[24rem] h-[24rem] bg-primary-glow/15 rounded-full blur-3xl animate-orb" style={{ animationDelay: "3s" }} />
      <ParticleBackground count={24} />

      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full max-w-md relative"
      >
        <div className="flex justify-center mb-8"><Logo /></div>

        <div className="glass-strong rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-2xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] uppercase tracking-wider mb-4">
              <Sparkles className="h-3 w-3" /> Welcome back
            </div>
            <h1 className="text-2xl font-bold mb-1">Sign in to Xebure</h1>
            <p className="text-sm text-muted-foreground mb-6">Continue building. Keep getting noticed.</p>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-input/60 border-border focus-visible:ring-primary" placeholder="you@xebure.com" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot?</Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-input/60 border-border focus-visible:ring-primary" placeholder="••••••••" />
                </div>
              </div>

              <GlowButton type="submit" disabled={loading} className="w-full h-11">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
              </GlowButton>
            </form>

            <div className="relative my-5 flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <GoogleButton />

            <p className="text-center text-sm text-muted-foreground mt-6">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary hover:underline font-medium">Join as Intern</Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          <Link to="/" className="hover:text-primary inline-flex items-center gap-1"><ArrowLeft className="h-3 w-3" /> Back to home</Link>
        </p>
      </motion.div>
    </div>
  );
}
