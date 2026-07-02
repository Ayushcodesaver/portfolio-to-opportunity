import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

export function AvatarUpload({
  userId, currentUrl, onChange,
}: { userId: string; currentUrl?: string | null; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) return toast.error("Max 5 MB");
    if (!file.type.startsWith("image/")) return toast.error("Images only");
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { setUploading(false); return toast.error(error.message); }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = data.publicUrl;
    const { error: upErr } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", userId);
    setUploading(false);
    if (upErr) return toast.error(upErr.message);
    onChange(url);
    toast.success("Avatar updated");
  };

  return (
    <div className="flex items-center gap-4">
      <div className="h-20 w-20 rounded-full bg-gradient-primary flex items-center justify-center overflow-hidden border border-border shrink-0">
        {currentUrl ? (
          <img src={currentUrl} alt="Avatar" className="h-full w-full object-cover" />
        ) : (
          <span className="text-2xl font-semibold">?</span>
        )}
      </div>
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }}
        />
        <Button variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
          Change avatar
        </Button>
        <p className="text-xs text-muted-foreground mt-1">PNG / JPG, up to 5 MB.</p>
      </div>
    </div>
  );
}
