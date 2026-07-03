import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Mail, UserCircle, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

const DISMISS_KEY = "xbr_onboarding_dismissed";

export function OnboardingBanner() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [dismissed, setDismissed] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem(DISMISS_KEY) ?? "{}"); } catch { return {}; }
  });
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!user) { setProfile(null); return; }
    supabase.from("profiles").select("full_name,bio,avatar_url").eq("id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data));
  }, [user]);

  const dismiss = (key: string) => {
    const next = { ...dismissed, [key]: true };
    setDismissed(next);
    localStorage.setItem(DISMISS_KEY, JSON.stringify(next));
  };

  const resend = async () => {
    if (!user?.email) return;
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: user.email,
      options: { emailRedirectTo: window.location.origin },
    });
    setResending(false);
    if (error) return toast.error(error.message);
    toast.success("Confirmation email sent");
  };

  if (!user) return null;

  const needsEmail = !user.email_confirmed_at && !dismissed.email;
  const missing = profile && (!profile.full_name || !profile.bio || !profile.avatar_url);
  const needsProfile = missing && !dismissed.profile && !needsEmail;

  if (!needsEmail && !needsProfile) return null;

  return (
    <div className="px-4 md:px-6 pt-4">
      {needsEmail && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-3">
          <Mail className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Confirm your email</p>
            <p className="text-xs text-muted-foreground">
              We sent a link to <span className="font-medium">{user.email}</span>. Confirm it to unlock certificates and payments.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={resend} disabled={resending}>
            {resending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Resend"}
          </Button>
          <Button size="icon" variant="ghost" onClick={() => dismiss("email")} className="h-8 w-8"><X className="h-4 w-4" /></Button>
        </div>
      )}
      {needsProfile && (
        <div className="flex items-start gap-3 rounded-xl border border-primary/40 bg-primary/10 p-3">
          <UserCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Complete your profile</p>
            <p className="text-xs text-muted-foreground">
              Add {[!profile.avatar_url && "an avatar", !profile.full_name && "your name", !profile.bio && "a short bio"].filter(Boolean).join(", ")} so HR and peers can find you.
            </p>
          </div>
          <Link to="/settings"><Button size="sm" className="bg-gradient-primary">Finish setup</Button></Link>
          <Button size="icon" variant="ghost" onClick={() => dismiss("profile")} className="h-8 w-8"><X className="h-4 w-4" /></Button>
        </div>
      )}
    </div>
  );
}
