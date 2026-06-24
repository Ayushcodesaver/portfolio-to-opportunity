import { useState } from "react";
import { Download, BadgeCheck, Loader2, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { usePlan } from "@/hooks/usePlan";
import { toast } from "sonner";
import {
  getOrIssueCertificate,
  downloadCertificatePdf,
} from "@/lib/certificate";

export function CertificateCard({
  programId,
  programTitle,
  holderName,
  unlocked,
}: {
  programId?: string | null;
  programTitle: string;
  holderName: string;
  unlocked: boolean;
}) {
  const { user } = useAuth();
  const { tier, has } = usePlan();
  const [busy, setBusy] = useState(false);

  const canIssue = has("standard_certificate");
  const verified = has("verified_certificate");

  const handleDownload = async () => {
    if (!user) return;
    if (!unlocked) {
      toast.error("Complete your program first to unlock the certificate.");
      return;
    }
    if (!canIssue) {
      toast.error("Upgrade to any paid plan to receive a certificate.");
      return;
    }
    setBusy(true);
    try {
      const cert = await getOrIssueCertificate({
        internId: user.id,
        programId: programId ?? null,
        holderName: holderName || user.email!.split("@")[0],
        programTitle,
        planTier: (tier === "none" ? "basic" : tier) as any,
      });
      await downloadCertificatePdf(cert);
      toast.success(`Downloaded ${cert.certificate_code}`);
    } catch (e: any) {
      toast.error(e.message ?? "Could not generate certificate");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass rounded-xl p-6 relative overflow-hidden">
      <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
      <div className="flex items-start justify-between relative">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${verified ? "bg-warning/15 text-warning" : "bg-primary/15 text-primary"}`}>
              {verified ? <BadgeCheck className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="font-semibold leading-tight">Completion certificate</h2>
              <p className="text-xs text-muted-foreground">
                {verified ? "Verified Premium · LinkedIn-ready" : canIssue ? "Standard certificate with QR" : "Locked"}
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-md">
            {unlocked
              ? "Your program is complete. Download a branded PDF with a unique ID and QR verification link."
              : "Finish your internship program to unlock your certificate. Premium plans get the verified gold badge."}
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2 relative">
        <Button onClick={handleDownload} disabled={busy || !unlocked || !canIssue} className="bg-gradient-primary">
          {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : !canIssue ? <Lock className="h-4 w-4 mr-2" /> : <Download className="h-4 w-4 mr-2" />}
          {!canIssue ? "Upgrade to unlock" : busy ? "Generating…" : "Download certificate"}
        </Button>
      </div>
    </div>
  );
}
