import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function GoogleButton({ label = "Continue with Google" }: { label?: string }) {
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    setLoading(true);
    // Optional override for local dev / custom Google OAuth client (see .env.example)
    const redirectUri =
      import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/feed`;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: redirectUri,
      ...(clientId ? { extraParams: { client_id: clientId } } : {}),
    });
    if (result.error) {
      toast.error(result.error.message ?? "Google sign-in failed");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    window.location.href = "/feed";
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={loading}
      className="w-full h-11 bg-white/5 hover:bg-white/10 border-border gap-2"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
          <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1S8.7 6 12 6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.6 2.5 12 2.5 6.8 2.5 2.6 6.8 2.6 12s4.2 9.5 9.4 9.5c5.4 0 9-3.8 9-9.2 0-.6-.1-1.1-.2-1.6H12z"/>
        </svg>
      )}
      {label}
    </Button>
  );
}
