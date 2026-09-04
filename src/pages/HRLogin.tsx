import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2, ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/common/Logo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function HRLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    const uid = data.user?.id;
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid!)
      .in("role", ["hr", "admin"]);
    setLoading(false);

    if (!roleRows || roleRows.length === 0) {
      await supabase.auth.signOut();
      toast.error("This account is not an HR account. Use the student sign in.");
      return;
    }

    toast.success("Welcome back");
    navigate(roleRows.some((r) => r.role === "hr") ? "/hr/dashboard" : "/staff/console", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-background">
      <div className="absolute top-1/4 left-1/4 w-[28rem] h-[28rem] bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-[24rem] h-[24rem] bg-primary-glow/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-md relative"
      >
        <div className="flex justify-center mb-8"><Logo size="lg" /></div>

        <div className="glass-strong rounded-2xl p-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] uppercase tracking-wider mb-4">
            <ShieldCheck className="h-3 w-3" /> HR access
          </div>
          <h1 className="text-2xl font-bold mb-1">HR sign in</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Staff-only entrance. Review interns, resumes, and applications.
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hr-email">Work email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                <Input id="hr-email" type="email" required value={email} maxLength={255}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-input/60 border-border focus-visible:ring-primary"
                  placeholder="hr@xebure.com" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hr-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                <Input id="hr-password" type="password" required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-input/60 border-border focus-visible:ring-primary"
                  placeholder="••••••••" />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />} Sign in as HR
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm">
            <Link to="/forgot-password" className="text-muted-foreground hover:text-foreground">Forgot password?</Link>
            <Link to="/login" className="text-primary hover:underline">Student sign in</Link>
          </div>
        </div>

        <Link to="/" className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
      </motion.div>
    </div>
  );
}
