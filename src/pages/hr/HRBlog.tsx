import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Eye, FileText, X } from "lucide-react";
import { PageHeader, PageLoader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 80);

interface PostForm {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_image_url: string;
  body: string;
  category_id: string;
  status: "draft" | "published" | "archived";
}

const empty: PostForm = { title: "", slug: "", excerpt: "", cover_image_url: "", body: "", category_id: "", status: "draft" };

export default function HRBlog() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PostForm>(empty);

  const { data: cats } = useQuery({
    queryKey: ["blog-cats"],
    queryFn: async () => (await supabase.from("blog_categories").select("*").order("name")).data ?? [],
  });

  const { data: posts, isLoading } = useQuery({
    queryKey: ["hr-blog-posts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("*, blog_categories(name)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const payload: any = {
        title: form.title,
        slug: form.slug || slugify(form.title),
        excerpt: form.excerpt,
        cover_image_url: form.cover_image_url || null,
        body: form.body,
        category_id: form.category_id || null,
        status: form.status,
        author_id: user.id,
        published_at: form.status === "published" ? new Date().toISOString() : null,
      };
      if (form.id) {
        const { error } = await supabase.from("blog_posts").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("blog_posts").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Saved" });
      setOpen(false);
      setForm(empty);
      qc.invalidateQueries({ queryKey: ["hr-blog-posts"] });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Deleted" });
      qc.invalidateQueries({ queryKey: ["hr-blog-posts"] });
    },
  });

  const openEdit = (p: any) => {
    setForm({
      id: p.id, title: p.title, slug: p.slug, excerpt: p.excerpt ?? "",
      cover_image_url: p.cover_image_url ?? "", body: p.body ?? "",
      category_id: p.category_id ?? "", status: p.status,
    });
    setOpen(true);
  };

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      <PageHeader
        title="Blog"
        description="Write and manage Xebure blog posts."
        action={
          <Button onClick={() => { setForm(empty); setOpen(true); }} className="bg-gradient-primary">
            <Plus className="h-4 w-4 mr-1" /> New post
          </Button>
        }
      />

      {isLoading ? <PageLoader /> : (posts?.length ?? 0) === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <FileText className="h-10 w-10 text-primary mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">No posts yet.</p>
          <Button onClick={() => setOpen(true)} className="bg-gradient-primary">Create your first post</Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {posts!.map((p: any) => (
            <div key={p.id} className="glass rounded-xl p-4 flex items-center gap-4">
              {p.cover_image_url && <img src={p.cover_image_url} alt="" className="h-16 w-24 rounded object-cover shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold truncate">{p.title}</h3>
                  <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full ${
                    p.status === "published" ? "bg-success/20 text-success" :
                    p.status === "draft" ? "bg-muted text-muted-foreground" :
                    "bg-destructive/20 text-destructive"
                  }`}>{p.status}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {p.blog_categories?.name ?? "Uncategorized"} · {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })} · {p.views_count ?? 0} views
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                {p.status === "published" && (
                  <Button asChild size="icon" variant="ghost"><Link to={`/blog/${p.slug}`} target="_blank"><Eye className="h-4 w-4" /></Link></Button>
                )}
                <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => confirm("Delete this post?") && del.mutate(p.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit post" : "New post"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Title</label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || slugify(e.target.value) })}
                placeholder="How to ace your first 30 days"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Slug</label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Category</label>
                <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Choose…" /></SelectTrigger>
                  <SelectContent>
                    {cats?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Cover image URL</label>
              <Input value={form.cover_image_url} onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })} placeholder="https://…" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Excerpt</label>
              <Textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Body (Markdown — supports ## headings, **bold**, *italic*, `code`, lists, ```code blocks)</label>
              <Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={14} className="font-mono text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}><X className="h-4 w-4 mr-1" />Cancel</Button>
              <Button onClick={() => save.mutate()} disabled={!form.title.trim() || save.isPending} className="bg-gradient-primary">
                {save.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
