import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, PageLoader, EmptyState } from "@/components/common/PageHeader";
import { Input } from "@/components/ui/input";
import { GooeySearch } from "@/components/vengeance/gooey-search";
import { FolderPreview } from "@/components/vengeance/folder-preview";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Row {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  uploaded_at: string;
  full_name: string;
  username: string;
  desired_role: string | null;
  contact_email: string | null;
  phone: string | null;
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function HRResumes() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["hr-resumes"],
    queryFn: async (): Promise<Row[]> => {
      const { data: resumes, error } = await supabase
        .from("resumes")
        .select("id, user_id, file_name, file_path, file_size, uploaded_at")
        .order("uploaded_at", { ascending: false });
      if (error) throw error;
      const ids = [...new Set((resumes ?? []).map((r) => r.user_id))];
      if (ids.length === 0) return [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, username, desired_role, contact_email, phone")
        .in("id", ids);
      const map = new Map((profiles ?? []).map((p) => [p.id, p]));
      return (resumes ?? []).map((r) => {
        const p: any = map.get(r.user_id) ?? {};
        return {
          ...r,
          full_name: p.full_name ?? "Unknown",
          username: p.username ?? "",
          desired_role: p.desired_role ?? null,
          contact_email: p.contact_email ?? null,
          phone: p.phone ?? null,
        };
      });
    },
  });

  const roles = useMemo(
    () => [...new Set((data ?? []).map((r) => r.desired_role).filter(Boolean))] as string[],
    [data],
  );

  const filtered = useMemo(
    () =>
      (data ?? []).filter((r) => {
        const q = search.trim().toLowerCase();
        const matchSearch =
          !q ||
          r.full_name.toLowerCase().includes(q) ||
          r.username.toLowerCase().includes(q) ||
          r.file_name.toLowerCase().includes(q);
        const matchRole = role === "all" || r.desired_role === role;
        const ts = new Date(r.uploaded_at).getTime();
        const matchFrom = !from || ts >= new Date(from).getTime();
        const matchTo = !to || ts <= new Date(to).getTime() + 86_400_000 - 1;
        return matchSearch && matchRole && matchFrom && matchTo;
      }),
    [data, search, role, from, to],
  );

  const download = async (r: Row) => {
    setBusy(r.id);
    const { data: signed, error } = await supabase.storage
      .from("resumes")
      .createSignedUrl(r.file_path, 60, { download: r.file_name });
    setBusy(null);
    if (error || !signed) return toast.error(error?.message || "Could not generate download link");
    const a = document.createElement("a");
    a.href = signed.signedUrl;
    a.download = r.file_name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="container max-w-7xl py-8">
      <PageHeader title="Intern Resumes" description="Search, filter, and download resumes uploaded by interns." />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="lg:col-span-2 min-h-10">
          <GooeySearch
            value={search}
            onValueChange={(value) => setSearch(value.slice(0, 100))}
            items={(data ?? []).map((row) => row.full_name)}
            onSelect={setSearch}
            placeholder="Name, username, or file"
            buttonLabel="Search resumes"
            className="justify-start"
          />
        </div>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="bg-input/50"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {roles.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="bg-input/50" aria-label="Uploaded from" />
          <span className="text-muted-foreground text-xs">to</span>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="bg-input/50" aria-label="Uploaded to" />
        </div>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <EmptyState icon={FileText} title="No resumes" description="No resumes match your search and filters." />
      ) : (
        <div className="glass rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="w-20 p-3" aria-label="Document"></th>
                <th className="text-left p-3">Intern</th>
                <th className="text-left p-3 hidden md:table-cell">Role</th>
                <th className="text-left p-3 hidden lg:table-cell">Contact</th>
                <th className="text-left p-3 hidden sm:table-cell">File</th>
                <th className="text-left p-3">Uploaded</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-border/50 hover:bg-muted/20">
                  <td className="p-3"><FolderPreview size="sm" variant="devi" label="" files={[{ name: r.file_name, type: "txt" }]} onClick={() => download(r)} /></td>
                  <td className="p-3">
                    <p className="font-medium">{r.full_name}</p>
                    <p className="text-xs text-muted-foreground">@{r.username}</p>
                  </td>
                  <td className="p-3 hidden md:table-cell capitalize text-muted-foreground">{r.desired_role ?? "—"}</td>
                  <td className="p-3 hidden lg:table-cell text-muted-foreground">
                    <p className="truncate max-w-[200px]">{r.contact_email ?? "—"}</p>
                    <p className="text-xs">{r.phone ?? ""}</p>
                  </td>
                  <td className="p-3 hidden sm:table-cell">
                    <p className="truncate max-w-[220px]">{r.file_name}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(r.file_size)}</p>
                  </td>
                  <td className="p-3 text-muted-foreground">{new Date(r.uploaded_at).toLocaleDateString()}</td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => download(r)} disabled={busy === r.id}>
                      {busy === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-1.5" />}
                      Download
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
