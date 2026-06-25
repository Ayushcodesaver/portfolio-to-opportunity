import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const IDLE_MS = 30 * 60 * 1000; // 30 minutes
const WARN_MS = 60 * 1000;      // warn 60s before

/** Signs the user out after IDLE_MS of inactivity. */
export function useIdleSignOut() {
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (!user) return;
    let idleTimer: number;
    let warnTimer: number;

    const reset = () => {
      window.clearTimeout(idleTimer);
      window.clearTimeout(warnTimer);
      warnTimer = window.setTimeout(() => {
        toast.warning("You'll be signed out in 1 minute due to inactivity.");
      }, IDLE_MS - WARN_MS);
      idleTimer = window.setTimeout(async () => {
        await signOut();
        toast.info("Signed out due to inactivity.");
        window.location.href = "/login";
      }, IDLE_MS);
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      window.clearTimeout(idleTimer);
      window.clearTimeout(warnTimer);
      events.forEach(e => window.removeEventListener(e, reset));
    };
  }, [user, signOut]);
}
