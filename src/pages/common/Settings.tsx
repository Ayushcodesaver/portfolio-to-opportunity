import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/common/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
          <NotificationPrefs profile={profile} setProfile={setProfile} user={user} />
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
