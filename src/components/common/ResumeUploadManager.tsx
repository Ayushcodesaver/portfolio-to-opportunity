import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Upload, Download, Trash2, Loader2, FileCheck } from "lucide-react";

const RESUME_MIME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const RESUME_ACCEPT = ".pdf,.doc,.docx";
const MAX_BYTES = 10 * 1024 * 1024;

interface ResumeRecord {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function ResumeUploadManager() {
  const { user } = useAuth();
  const [resume, setResume] = useState<ResumeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchResume = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("resumes")
      .select("id, file_name, file_url, file_size, mime_type, uploaded_at")
      .eq("user_id", user.id)
      .eq("is_default", true)
      .maybeSingle();
    if (error) {
      toast.error(error.message);
    } else {
      setResume(data ?? null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchResume();
  }, [user]);

  const validate = (file: File): string | null => {
    if (file.size > MAX_BYTES) return "Resume must be 10 MB or smaller.";
    if (!RESUME_MIME.includes(file.type)) return "Only PDF, DOC, and DOCX files are allowed.";
    return null;
  };

  const handleFile = async (file: File) => {
    if (!user) return;
    const err = validate(file);
    if (err) return toast.error(err);

    setUploading(true);
    setProgress(0);

    try {
      // Remove existing resume file if present
      if (resume?.file_url) {
        const oldPath = resume.file_url.split("/").slice(-2).join("/");
        if (oldPath) {
          await supabase.storage.from("resumes").remove([oldPath]);
        }
        await supabase.from("resumes").delete().eq("id", resume.id);
      }

      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error: upError } = await supabase.storage.from("resumes").upload(path, file, {
        upsert: false,
        contentType: file.type,
      });
      if (upError) throw upError;

      const { data: urlData } = supabase.storage.from("resumes").getPublicUrl(path);
      const fileUrl = urlData.publicUrl;

      const { error: dbError } = await supabase.from("resumes").insert({
        user_id: user.id,
        file_name: file.name,
        file_path: path,
        file_url: fileUrl,
        file_size: file.size,
        mime_type: file.type,
        is_default: true,
      });
      if (dbError) throw dbError;

      toast.success("Resume uploaded successfully");
      await fetchResume();
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    if (!user || !resume) return;
    setDeleting(true);
    try {
      const path = `${user.id}/${resume.file_url.split("/").pop()}`;
      await supabase.storage.from("resumes").remove([path]);
      const { error } = await supabase.from("resumes").delete().eq("id", resume.id);
      if (error) throw error;
      toast.success("Resume deleted");
      setResume(null);
    } catch (e: any) {
      toast.error(e?.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = () => {
    if (!resume) return;
    const a = document.createElement("a");
    a.href = resume.file_url;
    a.download = resume.file_name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="glass rounded-xl p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Your Resume
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Upload your latest resume. HR can view it when reviewing your applications.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading...
        </div>
      ) : resume ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-border/50 bg-muted/30 p-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate">{resume.file_name}</p>
              <p className="text-xs text-muted-foreground">
                {formatBytes(resume.file_size)} · Uploaded{" "}
                {new Date(resume.uploaded_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1.5" /> Download
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1.5" />}
              Delete
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-8 text-center">
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No resume uploaded yet.</p>
        </div>
      )}

      <div className="space-y-3">
        <Label htmlFor="resume-upload" className="text-sm font-medium">
          {resume ? "Replace resume" : "Upload resume"}
        </Label>
        <input
          ref={inputRef}
          id="resume-upload"
          type="file"
          accept={RESUME_ACCEPT}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <Button
          variant="outline"
          className="w-full sm:w-auto"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
          {uploading ? "Uploading..." : resume ? "Replace resume" : "Upload resume"}
        </Button>
        {uploading && <Progress value={progress} className="h-2" />}
        <p className="text-xs text-muted-foreground">PDF, DOC, or DOCX up to 10 MB.</p>
      </div>
    </div>
  );
}
