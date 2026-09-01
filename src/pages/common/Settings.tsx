import { useEffect, useState } from "react";
import { useEffect as useEffectAlias } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/common/PageHeader";
import { AvatarUpload } from "@/components/common/AvatarUpload";
import { ResumeUploadManager } from "@/components/common/ResumeUploadManager";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const DEFAULT_PREFS = {
  email: { tasks: true, milestones: true, certificates: true, payments: true, reminders: true },
  push: { tasks: true, milestones: true, certificates: true, messages: true },
};

export default function Settings() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>({ full_name: "", bio: "", location: "", github_url: "", twitter_url: "", linkedin_url: "" });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => { if (data) setProfile(data); });
  }, [user]);

  const save = async () => {
    setLoading(true);
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name, bio: profile.bio, location: profile.location,
      github_url: profile.github_url, twitter_url: profile.twitter_url, linkedin_url: profile.linkedin_url,
    }).eq("id", user!.id);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
  };

  return (
    <div className="container max-w-3xl py-8">
      <PageHeader title="Settings" description="Manage your account and preferences." />

      <Tabs defaultValue="profile">
        <TabsList className="bg-muted">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <div className="glass rounded-xl p-6 space-y-4">
            {user && (
              <AvatarUpload
                userId={user.id}
                currentUrl={profile.avatar_url}
                onChange={(url) => setProfile({ ...profile, avatar_url: url })}
              />
            )}
            <div className="space-y-2"><Label>Full name</Label>
              <Input value={profile.full_name ?? ""} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} className="bg-input/50" /></div>
            <div className="space-y-2"><Label>Bio</Label>
              <Textarea value={profile.bio ?? ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} maxLength={160} className="bg-input/50 resize-none" /></div>
            <div className="space-y-2"><Label>Location</Label>
              <Input value={profile.location ?? ""} onChange={(e) => setProfile({ ...profile, location: e.target.value })} className="bg-input/50" /></div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="space-y-2"><Label>GitHub</Label><Input value={profile.github_url ?? ""} onChange={(e) => setProfile({ ...profile, github_url: e.target.value })} className="bg-input/50" /></div>
              <div className="space-y-2"><Label>Twitter</Label><Input value={profile.twitter_url ?? ""} onChange={(e) => setProfile({ ...profile, twitter_url: e.target.value })} className="bg-input/50" /></div>
              <div className="space-y-2"><Label>LinkedIn</Label><Input value={profile.linkedin_url ?? ""} onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })} className="bg-input/50" /></div>
            </div>
            <Button onClick={save} disabled={loading} className="bg-gradient-primary">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}</Button>
          </div>
        </TabsContent>

        <TabsContent value="account" className="mt-6">
          <div className="glass rounded-xl p-6 space-y-4">
            <div className="space-y-2"><Label>Email</Label><Input value={user?.email ?? ""} disabled className="bg-input/50" /></div>
            <Button variant="outline" onClick={signOut}>Sign out</Button>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationPrefs profile={profile} setProfile={setProfile} userId={user?.id} />
        </TabsContent>

        <TabsContent value="privacy" className="mt-6">
          <div className="glass rounded-xl p-6 space-y-3">
            {["Private account","Show email on profile"].map(l => (
              <div key={l} className="flex items-center justify-between"><Label>{l}</Label><Switch /></div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

const EMAIL_LABELS: Record<string, string> = {
  tasks: "Task approved / rejected",
  milestones: "Milestone reached (25/50/75/100%)",
  certificates: "Certificate ready",
  payments: "Payment receipts",
  reminders: "Task deadline reminders",
};
const PUSH_LABELS: Record<string, string> = {
  tasks: "Task updates",
  milestones: "Milestones",
  certificates: "Certificate ready",
  messages: "Chat / mentions",
};

function NotificationPrefs({ profile, setProfile, userId }: { profile: any; setProfile: (p: any) => void; userId?: string }) {
  const [saving, setSaving] = useState(false);
  const prefs = profile.notification_prefs ?? DEFAULT_PREFS;
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffectAlias(() => {
    setPushSupported(typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator);
    if (typeof Notification !== "undefined") {
      setPushEnabled(Notification.permission === "granted");
    }
  }, []);

  const set = (group: "email" | "push", key: string, val: boolean) => {
    const next = { ...prefs, [group]: { ...prefs[group], [key]: val } };
    setProfile({ ...profile, notification_prefs: next });
  };

  const save = async () => {
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ notification_prefs: prefs }).eq("id", userId);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Preferences saved");
  };

  const requestPush = async () => {
    if (!pushSupported) return toast.error("Browser does not support notifications");
    const res = await Notification.requestPermission();
    setPushEnabled(res === "granted");
    if (res === "granted") toast.success("Browser notifications enabled");
    else toast.error("Permission denied");
  };

  return (
    <div className="space-y-4">
      <div className="glass rounded-xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-semibold">Browser notifications</Label>
            <p className="text-xs text-muted-foreground mt-1">
              {pushSupported ? (pushEnabled ? "Enabled in this browser." : "Allow Xebure to show notifications.") : "Not supported in this browser."}
            </p>
          </div>
          <Button size="sm" variant={pushEnabled ? "outline" : "default"} onClick={requestPush} disabled={!pushSupported || pushEnabled}>
            {pushEnabled ? "Allowed" : "Enable"}
          </Button>
        </div>
      </div>

      <div className="glass rounded-xl p-6 space-y-3">
        <p className="text-sm font-semibold mb-1">Email notifications</p>
        {Object.entries(EMAIL_LABELS).map(([k, label]) => (
          <div key={k} className="flex items-center justify-between">
            <Label className="font-normal">{label}</Label>
            <Switch checked={!!prefs.email?.[k]} onCheckedChange={(v) => set("email", k, v)} />
          </div>
        ))}
      </div>

      <div className="glass rounded-xl p-6 space-y-3">
        <p className="text-sm font-semibold mb-1">In-app & push</p>
        {Object.entries(PUSH_LABELS).map(([k, label]) => (
          <div key={k} className="flex items-center justify-between">
            <Label className="font-normal">{label}</Label>
            <Switch checked={!!prefs.push?.[k]} onCheckedChange={(v) => set("push", k, v)} />
          </div>
        ))}
      </div>

      <Button onClick={save} disabled={saving} className="bg-gradient-primary">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save preferences"}
      </Button>
    </div>
  );
}
