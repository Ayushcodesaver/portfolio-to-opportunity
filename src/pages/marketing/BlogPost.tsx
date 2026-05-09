import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Heart, MessageCircle, Send, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/common/Logo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

// Naive markdown -> HTML for headings/paragraphs/code/links
function renderMarkdown(md: string) {
  const lines = md.split("\n");
  const out: { type: "h2" | "h3" | "p" | "code" | "ul"; content: string; id?: string }[] = [];
  let codeBuf: string[] | null = null;
  let listBuf: string[] | null = null;
  const flushList = () => {
    if (listBuf) { out.push({ type: "ul", content: listBuf.join("\n") }); listBuf = null; }
  };
  for (const line of lines) {
    if (line.startsWith("```")) {
      if (codeBuf) { out.push({ type: "code", content: codeBuf.join("\n") }); codeBuf = null; }
      else codeBuf = [];
      continue;
    }
    if (codeBuf) { codeBuf.push(line); continue; }
    if (line.startsWith("## ")) {
      flushList();
      const t = line.slice(3); out.push({ type: "h2", content: t, id: t.toLowerCase().replace(/[^a-z0-9]+/g, "-") });
    } else if (line.startsWith("### ")) {
      flushList();
      const t = line.slice(4); out.push({ type: "h3", content: t, id: t.toLowerCase().replace(/[^a-z0-9]+/g, "-") });
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      if (!listBuf) listBuf = [];
      listBuf.push(line.slice(2));
    } else if (line.trim() === "") {
      flushList();
    } else {
      flushList();
      out.push({ type: "p", content: line });
    }
  }
  flushList();
  return out;
}

function inline(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-primary/15 text-primary-glow text-sm">$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-primary underline" target="_blank" rel="noreferrer">$1</a>');
}

export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [comment, setComment] = useState("");

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("*, blog_categories(name, slug)")
        .eq("slug", slug!)
        .maybeSingle();
      if (!data) return null;
      const { data: prof } = await supabase
        .from("profiles").select("id, username, full_name, avatar_url, bio").eq("id", data.author_id).maybeSingle();
      return { ...data, profiles: prof } as any;
    },
  });

  // Increment views once
  useEffect(() => {
    if (post?.id) {
      supabase.from("blog_posts").update({ views_count: (post.views_count ?? 0) + 1 }).eq("id", post.id).then(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.id]);

  const { data: likes } = useQuery({
    queryKey: ["blog-likes", post?.id],
    enabled: !!post?.id,
    queryFn: async () => {
      const { data } = await supabase.from("blog_post_likes").select("user_id").eq("post_id", post!.id);
      return { count: data?.length ?? 0, liked: !!data?.find((l) => l.user_id === user?.id) };
    },
  });

  const { data: comments } = useQuery({
    queryKey: ["blog-comments", post?.id],
    enabled: !!post?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("blog_comments")
        .select("id, content, created_at, user_id")
        .eq("post_id", post!.id)
        .order("created_at", { ascending: false });
      const ids = Array.from(new Set((data ?? []).map((c) => c.user_id)));
      const profs = ids.length ? (await supabase.from("profiles").select("id, username, full_name, avatar_url").in("id", ids)).data ?? [] : [];
      const pmap = new Map(profs.map((p: any) => [p.id, p]));
      return (data ?? []).map((c: any) => ({ ...c, profile: pmap.get(c.user_id) }));
    },
  });

  const toggleLike = useMutation({
    mutationFn: async () => {
      if (!user || !post) return;
      if (likes?.liked) {
        await supabase.from("blog_post_likes").delete().eq("post_id", post.id).eq("user_id", user.id);
      } else {
        await supabase.from("blog_post_likes").insert({ post_id: post.id, user_id: user.id });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blog-likes", post?.id] }),
  });

  const addComment = useMutation({
    mutationFn: async () => {
      if (!user || !post || !comment.trim()) return;
      const { error } = await supabase.from("blog_comments").insert({ post_id: post.id, user_id: user.id, content: comment.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      setComment("");
      qc.invalidateQueries({ queryKey: ["blog-comments", post?.id] });
      toast({ title: "Comment posted" });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const blocks = useMemo(() => (post ? renderMarkdown(post.body || "") : []), [post]);
  const toc = blocks.filter((b) => b.type === "h2" || b.type === "h3");
  const author = (post as any)?.profiles;

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Post not found.</p>
        <Button onClick={() => navigate("/blog")}>Back to blog</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="fixed top-0 inset-x-0 z-50 glass-strong">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> All posts
          </Link>
        </div>
      </nav>

      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-orb pointer-events-none" />
      <div className="absolute top-40 right-1/4 w-96 h-96 bg-primary-glow/20 rounded-full blur-3xl animate-orb pointer-events-none" style={{ animationDelay: "2s" }} />

      <div className="container relative pt-32 pb-20" style={{ perspective: "1500px" }}>
        <div className="grid lg:grid-cols-[1fr_280px] gap-10">
          {/* Article */}
          <motion.article
            initial={{ opacity: 0, y: 30, rotateX: -6 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.6 }}
            style={{ transformStyle: "preserve-3d" }}
            className="glass rounded-3xl p-8 md:p-12 border border-primary/10"
          >
            <div className="text-xs uppercase tracking-wider text-primary-glow mb-4">
              {(post as any).blog_categories?.name ?? "Uncategorized"}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-4 leading-tight">{post.title}</h1>
            {post.excerpt && <p className="text-lg text-muted-foreground mb-6">{post.excerpt}</p>}

            <div className="flex items-center justify-between flex-wrap gap-4 pb-6 border-b border-border/50 mb-8">
              <div className="flex items-center gap-3">
                {author?.avatar_url ? (
                  <img src={author.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold">{author?.full_name ?? "Xebure Team"}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {post.published_at ? formatDistanceToNow(new Date(post.published_at), { addSuffix: true }) : "Draft"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={likes?.liked ? "default" : "outline"}
                  onClick={() => user ? toggleLike.mutate() : navigate("/login")}
                  className={likes?.liked ? "bg-gradient-primary" : ""}
                >
                  <Heart className={`h-4 w-4 mr-1 ${likes?.liked ? "fill-current" : ""}`} />
                  {likes?.count ?? 0}
                </Button>
                <div className="flex items-center gap-1 text-xs text-muted-foreground glass px-3 py-1.5 rounded-md">
                  <MessageCircle className="h-3 w-3" /> {comments?.length ?? 0}
                </div>
              </div>
            </div>

            {post.cover_image_url && (
              <img src={post.cover_image_url} alt={post.title} className="w-full rounded-2xl mb-8 max-h-[420px] object-cover" />
            )}

            <div className="prose prose-invert max-w-none">
              {blocks.map((b, i) => {
                if (b.type === "h2") return <h2 key={i} id={b.id} className="text-2xl font-bold mt-8 mb-3 text-foreground scroll-mt-24">{b.content}</h2>;
                if (b.type === "h3") return <h3 key={i} id={b.id} className="text-xl font-semibold mt-6 mb-2 text-foreground scroll-mt-24">{b.content}</h3>;
                if (b.type === "code") return <pre key={i} className="bg-muted/40 border border-border rounded-lg p-4 text-xs overflow-x-auto my-4"><code>{b.content}</code></pre>;
                if (b.type === "ul") return <ul key={i} className="list-disc list-inside space-y-1 my-3 text-muted-foreground">{b.content.split("\n").map((x, j) => <li key={j} dangerouslySetInnerHTML={{ __html: inline(x) }} />)}</ul>;
                return <p key={i} className="text-muted-foreground leading-relaxed my-3" dangerouslySetInnerHTML={{ __html: inline(b.content) }} />;
              })}
            </div>

            {/* Comments */}
            <div className="mt-12 pt-8 border-t border-border/50">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" /> Discussion ({comments?.length ?? 0})
              </h3>

              {user ? (
                <div className="mb-6">
                  <Textarea
                    placeholder="Share your thoughts…"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="mb-2"
                    rows={3}
                  />
                  <Button onClick={() => addComment.mutate()} disabled={!comment.trim() || addComment.isPending} className="bg-gradient-primary">
                    <Send className="h-4 w-4 mr-1" /> Post comment
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mb-6">
                  <Link to="/login" className="text-primary hover:underline">Sign in</Link> to comment.
                </p>
              )}

              <div className="space-y-4">
                {comments?.map((c) => (
                  <div key={c.id} className="flex gap-3 p-4 rounded-xl bg-card/40 border border-border/50">
                    {c.profile?.avatar_url ? (
                      <img src={c.profile.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold">{c.profile?.full_name ?? "User"}</p>
                        <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{c.content}</p>
                    </div>
                  </div>
                ))}
                {(comments?.length ?? 0) === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">Be the first to comment.</p>
                )}
              </div>
            </div>
          </motion.article>

          {/* TOC + Author sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              {toc.length > 0 && (
                <div className="glass rounded-2xl p-5 border border-primary/10">
                  <p className="text-xs uppercase tracking-wider text-primary-glow mb-3">Table of contents</p>
                  <ul className="space-y-2 text-sm">
                    {toc.map((b, i) => (
                      <li key={i} className={b.type === "h3" ? "ml-3" : ""}>
                        <a href={`#${b.id}`} className="text-muted-foreground hover:text-primary transition-colors line-clamp-2">{b.content}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {author && (
                <div className="glass rounded-2xl p-5 border border-primary/10">
                  <div className="flex items-center gap-3 mb-3">
                    {author.avatar_url ? (
                      <img src={author.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{author.full_name}</p>
                      <p className="text-xs text-muted-foreground">@{author.username}</p>
                    </div>
                  </div>
                  {author.bio && <p className="text-xs text-muted-foreground">{author.bio}</p>}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
