import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

const KEY = "xebure-cookie-consent";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(KEY)) setShow(true);
  }, []);

  const accept = (v: "all" | "essential") => {
    localStorage.setItem(KEY, v);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 inset-x-4 md:inset-x-auto md:right-4 md:max-w-md z-50 glass-strong rounded-xl p-4 shadow-2xl border border-border">
      <div className="flex items-start gap-3">
        <Cookie className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold mb-1">We use cookies</p>
          <p className="text-xs text-muted-foreground mb-3">
            Essential cookies keep Xebure working. Optional analytics cookies help us improve.
            See our <a href="/privacy" className="underline">Privacy Policy</a>.
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => accept("all")}>Accept all</Button>
            <Button size="sm" variant="outline" onClick={() => accept("essential")}>Essential only</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
