import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/common/Logo";
import { GlowButton } from "@/components/fx/GlowButton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase auto-parses the recovery token from the URL hash and fires PASSWORD_RECOVERY
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirm) return toast.error("Passwords don't match");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated. You're signed in.");
    navigate("/feed", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8"><Logo /></div>
        <div className="glass-strong rounded-2xl p-8">
          <h1 className="text-2xl font-bold mb-1">Set a new password</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {ready ? "Pick something strong — at least 8 characters." : "Verifying reset link…"}
          </p>
          {ready && (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>New password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 bg-input/60" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Confirm password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <Input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="pl-10 bg-input/60" />
                </div>
              </div>
              <GlowButton type="submit" disabled={loading} className="w-full h-11">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
              </GlowButton>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
