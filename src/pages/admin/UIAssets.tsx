import { useRef, useState } from "react";
import { Loader2, Trash2, Upload, Eye, EyeOff } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  ASSET_KINDS, ASSET_PAGES, ASSET_POSITIONS, useUiAssets, type UiAsset,
} from "@/hooks/useUiAssets";

const ALLOWED = ["image/png", "image/webp", "image/svg+xml", "image/gif", "image/jpeg"];
const MAX = 5 * 1024 * 1024;

export default function UIAssets() {
  const { user } = useAuth();
  const { assets, urls, loading, reload } = useUiAssets();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<string>("sticker");
  const [page, setPage] = useState<string>("global");
  const [position, setPosition] = useState<string>("top-right");
  const [opacity, setOpacity] = useState("1");
  const [uploading, setUploading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<UiAsset | null>(null);

  const pick = (f: File | null) => {
    if (!f) return;
    if (!ALLOWED.includes(f.type)) return toast.error("PNG, WEBP, SVG, GIF or JPG only");
    if (f.size > MAX) return toast.error("Max 5 MB");
    setFile(f);
    setPreview(URL.createObjectURL(f));
    if (!name) setName(f.name.replace(/\.[^.]+$/, ""));
  };

  const upload = async () => {
    if (!user || !file) return toast.error("Pick a file first");
    if (!name.trim()) return toast.error("Name is required");
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("ui-assets").upload(path, file, {
      contentType: file.type,
    });
    if (upErr) { setUploading(false); return toast.error(upErr.message); }

    const { error } = await supabase.from("ui_assets").insert({
      name: name.trim(), storage_path: path, kind, page, position,
      opacity: Math.min(1, Math.max(0, Number(opacity) || 1)),
      sort_order: assets.length, created_by: user.id,
    });
    setUploading(false);
    if (error) {
      await supabase.storage.from("ui-assets").remove([path]);
      return toast.error(error.message);
    }
    toast.success("Asset uploaded");
    setFile(null); setPreview(null); setName("");
    if (fileRef.current) fileRef.current.value = "";
    reload();
  };

  const patch = async (a: UiAsset, values: Partial<UiAsset>) => {
    const { error } = await supabase.from("ui_assets").update(values).eq("id", a.id);
    if (error) return toast.error(error.message);
    reload();
  };

  const destroy = async (a: UiAsset) => {
    const { error } = await supabase.from("ui_assets").delete().eq("id", a.id);
    if (error) return toast.error(error.message);
    await supabase.storage.from("ui-assets").remove([a.storage_path]);
    toast.success("Asset deleted");
    setPendingDelete(null);
    reload();
  };

  return (
    <div className="container max-w-6xl py-8">
      <PageHeader title="UI Assets" description="Upload and manage decorative stickers and overlays used on public pages." />

      <div className="grid lg:grid-cols-[1fr_2fr] gap-6">
        {/* Upload panel */}
        <div className="glass rounded-xl p-6 space-y-4 h-fit">
          <div className="space-y-2">
            <Label>File</Label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:border-primary/50 transition-colors bg-input/20 min-h-[9rem]">
              {preview ? (
                <img src={preview} alt="Selected asset preview" className="max-h-32 object-contain" />
              ) : (
                <>
                  <Upload className="h-7 w-7 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">PNG / WEBP / SVG / GIF — max 5 MB</p>
                </>
              )}
              <input ref={fileRef} type="file" accept={ALLOWED.join(",")} className="hidden"
                onChange={(e) => pick(e.target.files?.[0] ?? null)} />
            </label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="asset-name">Name</Label>
            <Input id="asset-name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)}
              placeholder="Corner star" className="bg-input/50" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Kind</Label>
              <Select value={kind} onValueChange={setKind}>
                <SelectTrigger className="bg-input/50"><SelectValue /></SelectTrigger>
                <SelectContent>{ASSET_KINDS.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Page</Label>
              <Select value={page} onValueChange={setPage}>
                <SelectTrigger className="bg-input/50"><SelectValue /></SelectTrigger>
                <SelectContent>{ASSET_PAGES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Position</Label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger className="bg-input/50"><SelectValue /></SelectTrigger>
                <SelectContent>{ASSET_POSITIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-opacity">Opacity</Label>
              <Input id="asset-opacity" type="number" min={0} max={1} step={0.05}
                value={opacity} onChange={(e) => setOpacity(e.target.value)} className="bg-input/50" />
            </div>
          </div>

          <Button onClick={upload} disabled={uploading || !file} className="w-full">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
            Upload asset
          </Button>
        </div>

        {/* Library */}
        <div className="space-y-3">
          {loading ? (
            <div className="glass rounded-xl p-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : assets.length === 0 ? (
            <div className="glass rounded-xl p-10 text-center text-sm text-muted-foreground">
              No decorative assets yet. Upload one to get started.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {assets.map((a) => (
                <div key={a.id} className="glass rounded-xl p-4 space-y-3">
                  <div className="h-32 rounded-lg bg-input/30 border border-border flex items-center justify-center overflow-hidden">
                    {urls[a.id] ? (
                      <img src={urls[a.id]} alt={a.name} style={{ opacity: a.opacity }}
                        className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-xs text-muted-foreground">Preview unavailable</span>
                    )}
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{a.kind} · {a.page} · {a.position}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Switch checked={a.is_active} onCheckedChange={(v) => patch(a, { is_active: v })}
                        aria-label={a.is_active ? "Deactivate asset" : "Activate asset"} />
                      <Button size="icon" variant="ghost" onClick={() => setPendingDelete(a)} aria-label="Delete asset">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Select value={a.page} onValueChange={(v) => patch(a, { page: v })}>
                      <SelectTrigger className="bg-input/50 h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{ASSET_PAGES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={a.position} onValueChange={(v) => patch(a, { position: v })}>
                      <SelectTrigger className="bg-input/50 h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{ASSET_POSITIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>

                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    {a.is_active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    {a.is_active ? "Visible on public pages" : "Hidden"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this asset?</AlertDialogTitle>
            <AlertDialogDescription>
              "{pendingDelete?.name}" will be removed from storage and any page using it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => pendingDelete && destroy(pendingDelete)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
