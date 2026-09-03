import { useEffect, useState } from "react";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, PageLoader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResumeUploadManager } from "@/components/common/ResumeUploadManager";
import { Loader2, Save, UserRound } from "lucide-react";
import { toast } from "sonner";

const ROLES = [
  "frontend",
  "backend",
  "fullstack",
  "mobile",
  "data",
  "devops",
  "design",
  "qa",
  "product",
];

const schema = z.object({
  full_name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be under 100 characters"),
  contact_email: z.string().trim().email("Enter a valid email").max(255).or(z.literal("")),
  phone: z.string().trim().max(20, "Phone must be under 20 characters").or(z.literal("")),
  desired_role: z.string().trim().max(50).or(z.literal("")),
  location: z.string().trim().max(100).or(z.literal("")),
  bio: z.string().trim().max(500, "Bio must be under 500 characters").or(z.literal("")),
});

export default function StudentProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    contact_email: "",
    phone: "",
    desired_role: "",
    location: "",
    bio: "",
  });
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("username, full_name, contact_email, phone, desired_role, location, bio")
        .eq("id", user.id)
        .maybeSingle();
      if (error) toast.error(error.message);
      if (data) {
        setUsername(data.username ?? "");
        setForm({
          full_name: data.full_name ?? "",
          contact_email: data.contact_email ?? user.email ?? "",
          phone: data.phone ?? "",
          desired_role: data.desired_role ?? "",
          location: data.location ?? "",
          bio: data.bio ?? "",
        });
      }
      setLoading(false);
    })();
  }, [user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: parsed.data.full_name,
        contact_email: parsed.data.contact_email || null,
        phone: parsed.data.phone || null,
        desired_role: parsed.data.desired_role || null,
        location: parsed.data.location || null,
        bio: parsed.data.bio || null,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile saved — HR now sees the updated details");
  };

  if (loading) return <PageLoader />;

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <PageHeader
        title="My Profile"
        description="Keep your details current — HR sees this information alongside your resume and applications."
      />

      <form onSubmit={save} className="glass rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <UserRound className="h-4 w-4 text-primary" />
          <span>@{username}</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" value={form.full_name} maxLength={100}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="bg-input/50" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desired_role">Role</Label>
            <Select value={form.desired_role} onValueChange={(v) => setForm({ ...form, desired_role: v })}>
              <SelectTrigger id="desired_role" className="bg-input/50"><SelectValue placeholder="Select a role" /></SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_email">Contact email</Label>
            <Input id="contact_email" type="email" value={form.contact_email} maxLength={255}
              onChange={(e) => setForm({ ...form, contact_email: e.target.value })} className="bg-input/50" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={form.phone} maxLength={20}
              onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-input/50" placeholder="+91 90000 00000" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={form.location} maxLength={100}
              onChange={(e) => setForm({ ...form, location: e.target.value })} className="bg-input/50" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="bio">Short bio</Label>
            <Textarea id="bio" value={form.bio} maxLength={500} rows={4}
              onChange={(e) => setForm({ ...form, bio: e.target.value })} className="bg-input/50" />
          </div>
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
          Save profile
        </Button>
      </form>

      <ResumeUploadManager />
    </div>
  );
}
