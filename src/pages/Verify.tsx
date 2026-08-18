import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, BadgeCheck, Calendar, User, Award, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/common/Logo";
import { Button } from "@/components/ui/button";

export default function Verify() {
  const { code } = useParams<{ code: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["verify-cert", code],
    enabled: !!code,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificates")
        .select("*")
        .eq("certificate_code", code!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border/50">
        <div className="container max-w-5xl py-4 flex items-center justify-between">
          <Logo size="lg" />
          <Link to="/">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Back to home</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 container max-w-3xl py-16">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2">Certificate verification</p>
          <h1 className="text-3xl font-bold">{code}</h1>
        </div>

        {isLoading && (
          <div className="glass rounded-2xl p-10 text-center">Looking up certificate…</div>
        )}

        {!isLoading && !data && (
          <div className="glass rounded-2xl p-10 text-center">
            <div className="h-14 w-14 rounded-full bg-destructive/15 text-destructive flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-semibold mb-1">Not found</h2>
            <p className="text-sm text-muted-foreground">
              We couldn't find a Xebure certificate with this ID. It may be invalid or have been revoked.
            </p>
          </div>
        )}

        {!isLoading && data && (
          <div className="glass-strong rounded-2xl p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${data.verified ? "bg-warning/15 text-warning" : "bg-success/15 text-success"}`}>
                {data.verified ? <BadgeCheck className="h-7 w-7" /> : <ShieldCheck className="h-7 w-7" />}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  {data.verified ? "Verified Premium certificate" : "Valid certificate"}
                </p>
                <p className="font-semibold">Issued by Xebure</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field icon={User} label="Holder" value={data.holder_name} />
              <Field icon={Award} label="Program" value={data.program_title} />
              <Field icon={Calendar} label="Issued" value={new Date(data.issued_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })} />
              <Field icon={ShieldCheck} label="Plan" value={data.plan_tier.toUpperCase()} />
            </div>

            <div className="pt-4 border-t border-border/50 text-xs text-muted-foreground">
              Verify this certificate at any time by visiting <code className="text-primary">/verify/{data.certificate_code}</code>.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Field({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
        <Icon className="h-3.5 w-3.5 text-primary" /> {label}
      </div>
      <p className="font-medium">{value}</p>
    </div>
  );
}
