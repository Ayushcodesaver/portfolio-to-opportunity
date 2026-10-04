import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles, Code2, Layout, MessageCircle, TrendingUp, Award,
  ArrowRight, Star, Github, Twitter, Linkedin, Menu, X, Rocket,
  GraduationCap, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/common/Logo";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GlowButton } from "@/components/fx/GlowButton";
import { TiltCard } from "@/components/fx/TiltCard";
import { AnimatedCounter } from "@/components/fx/AnimatedCounter";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const features = [
  { icon: Sparkles, title: "AI Assistant", desc: "AI-powered help to refine your code, writeups, and project pitch." },
  { icon: Code2,    title: "Real Projects", desc: "Work on real client requirements — not toy assignments." },
  { icon: Layout,   title: "Portfolio System", desc: "Auto-generated, recruiter-ready portfolio that grows as you build." },
  { icon: MessageCircle, title: "Community Feedback", desc: "Likes, comments, and reviews from peers and mentors." },
  { icon: TrendingUp, title: "Progress Tracking", desc: "Milestones, gauges, and a live timeline of your internship." },
  { icon: Award,    title: "Recognition", desc: "Earn certificates, badges, and featured slots on the showcase." },
];

const steps = [
  { n: "01", title: "Join",  desc: "Sign up and complete your developer profile." },
  { n: "02", title: "Build", desc: "Ship real projects and document the journey." },
  { n: "03", title: "Share", desc: "Post to the feed and gather community feedback." },
  { n: "04", title: "Grow",  desc: "Earn certificates and unlock career opportunities." },
];

const showcaseProjects = [
  { title: "AI Resume Builder",   desc: "GPT-powered resume builder with ATS optimization.", tags: ["React","OpenAI","Node"], likes: 234, comments: 45 },
  { title: "Realtime Code Editor", desc: "Collaborative editor with live cursor sharing.",    tags: ["TypeScript","WebRTC","Monaco"], likes: 189, comments: 32 },
  { title: "Portfolio Analytics",  desc: "Track engagement on your developer portfolio.",     tags: ["Next.js","Recharts"], likes: 156, comments: 28 },
];

const testimonials = [
  { name: "Sarah Chen",    role: "Frontend Intern → Junior Dev @ Stripe", quote: "Xebure transformed how I document my work. AI feedback was a game-changer for my resume." },
  { name: "Marcus Patel",  role: "Backend Intern @ Shopify",              quote: "0 to 12 real projects in 90 days. 4 job offers before my internship ended." },
  { name: "Lila Romero",   role: "Fullstack Intern @ Vercel",             quote: "Community feedback pushed me to ship better code. Never grown faster as a dev." },
];

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how" },
  { label: "Top Interns", href: "/top-interns" },
  { label: "Pricing", href: "/pricing" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number] } },
} as const;

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["landing-stats"],
    queryFn: async () => {
      const [interns, projects] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "approved"),
      ]);
      return { interns: interns.count ?? 0, projects: projects.count ?? 0 };
    },
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* NAV */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "glass-strong border-b border-primary/20" : "bg-transparent"}`}>
        <div className="container flex h-16 items-center justify-between">
          <Logo size="sm" />
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            {navLinks.map((l) => (
              <a key={l.label} href={l.href} className="hover:text-primary transition-colors relative after:absolute after:left-0 after:-bottom-1 after:h-px after:w-0 after:bg-primary after:transition-all hover:after:w-full">
                {l.label}
              </a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <GlowButton onClick={() => navigate("/feed")}>Go to App <ArrowRight className="h-4 w-4" /></GlowButton>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/login")}>Sign in</Button>
                <GlowButton onClick={() => navigate("/register")}>Join Now</GlowButton>
              </>
            )}
          </div>
          {/* Mobile */}
          <div className="md:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button size="icon" variant="ghost"><Menu className="h-5 w-5" /></Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-card border-primary/20">
                <div className="flex flex-col gap-1 mt-8">
                  {navLinks.map((l) => (
                    <a key={l.label} href={l.href} onClick={() => setMobileOpen(false)}
                       className="px-3 py-3 rounded-lg text-sm hover:bg-primary/10 hover:text-primary transition-colors">
                      {l.label}
                    </a>
                  ))}
                  <div className="h-px bg-border my-3" />
                  {user ? (
                    <GlowButton onClick={() => navigate("/feed")}>Go to App</GlowButton>
                  ) : (
                    <>
                      <Button variant="ghost" onClick={() => navigate("/login")} className="justify-start">Sign in</Button>
                      <GlowButton onClick={() => navigate("/register")} className="mt-2">Join Now</GlowButton>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-36 md:pt-40 pb-24 md:pb-32">
        <div className="absolute inset-0">
          <div className="absolute top-32 left-1/4 w-[36rem] h-[36rem] bg-primary/25 rounded-full blur-3xl " />
          <div className="absolute top-48 right-1/4 w-[28rem] h-[28rem] bg-primary-glow/15 rounded-full blur-3xl " style={{ animationDelay: "2s" }} />
        </div>

        <div className="container relative">
          <motion.div
            initial="hidden" animate="show" variants={fadeUp}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-[11px] uppercase tracking-[0.2em] text-primary mb-8">
              <Sparkles className="h-3 w-3" />
              <span>Build · Learn · Get Noticed</span>
            </div>

            <h1 className="text-[2.75rem] sm:text-6xl lg:text-7xl xl:text-[5rem] font-extrabold tracking-tight leading-[1.05] mb-6">
              Build. Learn.{" "}
              <span className="text-gradient">Get Noticed.</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Xebure is the portfolio platform for ambitious interns. Ship real projects,
              earn certificates, and get discovered by recruiters who care.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <GlowButton size="lg" onClick={() => navigate("/register")} className="h-14 px-8 text-base">
                <GraduationCap className="h-5 w-5" /> Start Internship <ArrowRight className="h-4 w-4" />
              </GlowButton>
              <GlowButton size="lg" tone="glass" onClick={() => navigate("/feed")} className="h-14 px-8 text-base">
                <Eye className="h-5 w-5" /> Explore Projects
              </GlowButton>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-2xl mx-auto mt-16 md:mt-20">
              {[
                { v: stats?.interns ?? 0, l: "Active Interns",  suffix: "+" },
                { v: stats?.projects ?? 0, l: "Projects Built", suffix: "+" },
                { v: 12, l: "Partner Companies", suffix: "+" },
              ].map((s) => (
                <TiltCard key={s.l} max={6} className="rounded-2xl">
                  <div className="panel-3d p-4 sm:p-5 text-center">
                    <div className="text-2xl sm:text-4xl font-bold text-gradient">
                      <AnimatedCounter value={s.v} suffix={s.suffix} />
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground mt-1 uppercase tracking-wider">{s.l}</div>
                  </div>
                </TiltCard>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative py-24 grid-pattern">
        <div className="container">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Everything You <span className="text-gradient">Need</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A complete toolkit to build, showcase, and grow as a developer.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 max-w-6xl mx-auto">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }}
                variants={fadeUp} transition={{ delay: i * 0.06 }}
              >
                <TiltCard className="h-full">
                  <div className="panel-3d h-full p-6 hover:border-primary/40 transition-colors">
                    <div className="inline-flex p-3 rounded-xl bg-gradient-primary mb-4 shadow-premium">
                      <f.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                    <p className="text-muted-foreground text-sm">{f.desc}</p>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="py-24 relative">
        <div className="container">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              How It <span className="text-gradient">Works</span>
            </h2>
            <p className="text-muted-foreground">Four simple steps to launch your career.</p>
          </motion.div>
          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-8 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            {steps.map((s, i) => (
              <motion.div key={s.n}
                initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
                transition={{ delay: i * 0.08 }}
                className="relative flex flex-col items-center text-center"
              >
                <div className="relative h-16 w-16 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-premium mb-4">
                  <span className="absolute inset-0 rounded-full border border-primary/50 animate-pulse-glow" />
                  {s.n}
                </div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground max-w-[18ch]">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SHOWCASE */}
      <section id="showcase" className="py-24 relative">
        <div className="container">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Featured <span className="text-gradient">Projects</span>
            </h2>
            <p className="text-muted-foreground">Real work shipped by Xebure interns.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {showcaseProjects.map((p, i) => (
              <motion.div key={p.title}
                initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
                transition={{ delay: i * 0.08 }}
              >
                <TiltCard className="h-full">
                  <div className="panel-3d h-full overflow-hidden group">
                    <div className="h-44 bg-gradient-to-br from-primary/30 via-primary-dark/20 to-transparent relative overflow-hidden">
                      <Code2 className="absolute inset-0 m-auto h-16 w-16 text-primary/50 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-lg mb-2">{p.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{p.desc}</p>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {p.tags.map((t) => (
                          <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">{t}</span>
                        ))}
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>❤ {p.likes}</span>
                        <span>💬 {p.comments}</span>
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-12">
            <GlowButton onClick={() => navigate("/feed")}>
              View all projects <ArrowRight className="h-4 w-4" />
            </GlowButton>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24">
        <div className="container">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Success <span className="text-gradient">Stories</span>
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {testimonials.map((t, i) => (
              <motion.div key={t.name}
                initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
                transition={{ delay: i * 0.08 }}
              >
                <TiltCard className="h-full" max={6}>
                  <div className="glass-strong rounded-2xl p-6 h-full">
                    <div className="flex gap-1 mb-3">
                      {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-primary text-primary" />)}
                    </div>
                    <p className="italic text-foreground/90 mb-5">"{t.quote}"</p>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-semibold text-primary-foreground">
                        {t.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{t.name}</div>
                        <div className="text-xs text-muted-foreground">{t.role}</div>
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
            className="glass-strong rounded-3xl p-10 md:p-16 text-center max-w-4xl mx-auto relative overflow-hidden border-primary/30"
          >
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/30 rounded-full blur-3xl " />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-primary-glow/20 rounded-full blur-3xl " style={{ animationDelay: "3s" }} />
            <div className="relative">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Ready to Start Your <span className="text-gradient">Journey?</span>
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Join thousands of interns building their careers, one project at a time.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <GlowButton size="lg" onClick={() => navigate("/register")} className="h-14 px-8">
                  <Rocket className="h-5 w-5" /> Start Building Now
                </GlowButton>
                <GlowButton size="lg" tone="glass" onClick={() => navigate("/support" as any)} className="h-14 px-8">
                  Contact HR
                </GlowButton>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-primary/10 py-12">
        <div className="container grid md:grid-cols-4 gap-8">
          <div>
            <Logo size="sm" />
            <p className="text-sm text-muted-foreground mt-3">Build. Learn. Get Noticed.</p>
          </div>
          {[
            { title: "Platform",  links: [["Features","/features"],["How it works","/how-it-works"],["Showcase","/showcase"]] },
            { title: "Resources", links: [["Blog","/blog"],["Guides","/guides"],["FAQ","/faq"],["Support","/support"]] },
            { title: "Legal",     links: [["Privacy","/privacy"],["Terms","/terms"]] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-semibold mb-3">{col.title}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {col.links.map(([l, href]) => (
                  <li key={l}><Link to={href} className="hover:text-primary transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="container mt-10 pt-6 border-t border-primary/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Xebure. All rights reserved.</p>
          <div className="flex gap-3">
            {[Github, Twitter, Linkedin].map((Ic, i) => (
              <a key={i} href="#" className="p-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors">
                <Ic className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
