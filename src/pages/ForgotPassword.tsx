import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Loader2, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/common/Logo";
import { GlowButton } from "@/components/fx/GlowButton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setSent(true);
    toast.success("Check your inbox for the reset link");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8"><Logo /></div>
        <div className="glass-strong rounded-2xl p-8">
          <h1 className="text-2xl font-bold mb-1">Reset your password</h1>
          <p className="text-sm text-muted-foreground mb-6">
            We'll email you a secure link to set a new password.
          </p>
          {sent ? (
            <p className="text-sm">If an account exists for <b>{email}</b>, a reset link is on its way.</p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-input/60" placeholder="you@xebure.com" />
                </div>
              </div>
              <GlowButton type="submit" disabled={loading} className="w-full h-11">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
              </GlowButton>
            </form>
          )}
          <p className="text-center text-xs text-muted-foreground mt-6">
            <Link to="/login" className="hover:text-primary inline-flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
