import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles, Code2, Layout, MessageCircle, TrendingUp, Award,
  ArrowRight, Star, Github, Twitter, Linkedin, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/common/Logo";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const features = [
  { icon: Sparkles, title: "AI Assistant", desc: "Get AI-powered help to improve your code, descriptions, and projects.", color: "from-violet-500 to-purple-600" },
  { icon: Code2, title: "Real Projects", desc: "Build real-world projects that matter and showcase what you can do.", color: "from-blue-500 to-violet-600" },
  { icon: Layout, title: "Portfolio System", desc: "Create a stunning portfolio that gets you noticed by recruiters.", color: "from-purple-500 to-pink-600" },
  { icon: MessageCircle, title: "Community Feedback", desc: "Get likes, comments, and feedback from the developer community.", color: "from-pink-500 to-violet-600" },
  { icon: TrendingUp, title: "Progress Tracking", desc: "Track your internship journey, skills gained, and milestones.", color: "from-indigo-500 to-violet-600" },
  { icon: Award, title: "Recognition", desc: "Get featured, earn badges, and stand out from the crowd.", color: "from-violet-500 to-fuchsia-600" },
];

const steps = [
  { n: "01", title: "Join", desc: "Sign up and complete your developer profile" },
  { n: "02", title: "Build", desc: "Create real projects and document your journey" },
  { n: "03", title: "Share", desc: "Post projects and get community feedback" },
  { n: "04", title: "Grow", desc: "Build your portfolio and advance your career" },
];

const showcaseProjects = [
  { title: "AI Resume Builder", desc: "GPT-powered resume builder with ATS optimization.", tags: ["React", "OpenAI", "Node.js"], likes: 234, comments: 45 },
  { title: "Realtime Code Editor", desc: "Collaborative code editor with live cursor sharing.", tags: ["TypeScript", "WebRTC", "Monaco"], likes: 189, comments: 32 },
  { title: "Portfolio Analytics", desc: "Track engagement on your developer portfolio.", tags: ["Next.js", "Recharts"], likes: 156, comments: 28 },
];

const testimonials = [
  { name: "Sarah Chen", role: "Frontend Intern → Junior Dev @ Stripe", quote: "Xebure transformed how I document my work. The AI feedback was a game-changer for my resume." },
  { name: "Marcus Patel", role: "Backend Intern @ Shopify", quote: "I went from 0 to 12 real projects in 90 days. Got 4 job offers before my internship even ended." },
  { name: "Lila Romero", role: "Fullstack Intern @ Vercel", quote: "The community feedback pushed me to ship better code. I've never grown faster as a developer." },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* NAV */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all ${scrolled ? "glass-strong" : "bg-transparent"}`}>
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#showcase" className="hover:text-foreground transition-colors">Showcase</a>
            <a href="#stories" className="hover:text-foreground transition-colors">Stories</a>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <Button onClick={() => navigate("/feed")} className="bg-gradient-primary hover:opacity-90">
                Go to App
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/login")} className="hidden sm:inline-flex">
                  Sign in
                </Button>
                <Button onClick={() => navigate("/register")} className="bg-gradient-primary hover:opacity-90 glow-violet">
                  Join as Intern
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-40 pb-32">
        {/* animated orbs */}
        <div className="absolute top-32 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-orb" />
        <div className="absolute top-48 right-1/4 w-96 h-96 bg-primary-glow/20 rounded-full blur-3xl animate-orb" style={{ animationDelay: "2s" }} />

        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs uppercase tracking-wider text-primary-glow mb-8">
              <Sparkles className="h-3 w-3" />
              <span>The portfolio platform for interns</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-6">
              Build. Learn.{" "}
              <span className="text-gradient">Get Noticed.</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              The social portfolio platform for interns. Build real projects, showcase your work,
              and get feedback from a community of developers and recruiters.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate("/register")}
                className="bg-gradient-primary hover:opacity-90 glow-violet text-base h-14 px-8"
              >
                🎓 Start Your Internship
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg" variant="outline"
                onClick={() => navigate("/feed")}
                className="glass border-primary/30 hover:bg-primary/10 text-base h-14 px-8"
              >
                👀 See What's Being Built
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mt-20">
              {[
                { v: "500+", l: "Active Interns" },
                { v: "1,200+", l: "Projects Built" },
                { v: "50+", l: "Companies Hiring" },
              ].map((s) => (
                <div key={s.l} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-gradient">{s.v}</div>
                  <div className="text-xs md:text-sm text-muted-foreground mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative py-24 grid-pattern">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-gradient">Powerful Features</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Everything you need to build, showcase, and grow as a developer.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group relative"
              >
                <div className="h-full glass rounded-xl p-6 hover:border-primary/50 transition-all hover:-translate-y-1 hover:glow-violet">
                  <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${f.color} mb-4`}>
                    <f.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="py-24">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">How It Works</h2>
            <p className="text-muted-foreground">Four simple steps to launch your career.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto relative">
            {steps.map((s, i) => (
              <div key={s.n} className="relative">
                <div className="glass rounded-xl p-6 text-center">
                  <div className="text-4xl font-bold text-gradient mb-3">{s.n}</div>
                  <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-px bg-gradient-to-r from-primary to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SHOWCASE */}
      <section id="showcase" className="py-24 relative">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">Featured Projects</h2>
            <p className="text-muted-foreground">Amazing work built by our interns.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {showcaseProjects.map((p) => (
              <div key={p.title} className="glass rounded-xl overflow-hidden hover:glow-violet transition-all hover:-translate-y-1 group">
                <div className="h-44 bg-gradient-to-br from-primary/30 via-primary-dark/30 to-background relative overflow-hidden">
                  <Code2 className="absolute inset-0 m-auto h-16 w-16 text-primary/40 group-hover:scale-110 transition-transform" />
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-lg mb-2">{p.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{p.desc}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {p.tags.map((t) => (
                      <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary-glow">{t}</span>
                    ))}
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>❤️ {p.likes}</span>
                    <span>💬 {p.comments}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button onClick={() => navigate("/feed")} className="bg-gradient-primary hover:opacity-90">
              View all projects <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="stories" className="py-24">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">Success Stories</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {testimonials.map((t) => (
              <div key={t.name} className="glass rounded-xl p-6">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-primary text-primary" />)}
                </div>
                <p className="italic text-foreground/90 mb-5">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-semibold">
                    {t.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container">
          <div className="glass-strong rounded-3xl p-12 md:p-16 text-center max-w-4xl mx-auto relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary-glow/20 rounded-full blur-3xl" />
            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Ready to start your journey?</h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Join thousands of interns building their careers, one project at a time.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={() => navigate("/register")} className="bg-gradient-primary glow-violet h-14 px-8">
                  🚀 Start Building Now
                </Button>
                <Button size="lg" variant="outline" className="glass border-primary/30 h-14 px-8">
                  📧 Contact HR
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/50 py-12">
        <div className="container grid md:grid-cols-4 gap-8">
          <div>
            <Logo />
            <p className="text-sm text-muted-foreground mt-3">
              The social portfolio platform built for ambitious interns.
            </p>
          </div>
          {[
            { title: "Platform", links: ["Features", "How it works", "Showcase"] },
            { title: "Resources", links: ["Blog", "Guides", "FAQ", "Support"] },
            { title: "Legal", links: ["Privacy", "Terms", "Cookies"] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-semibold mb-3">{col.title}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {col.links.map((l) => <li key={l}><a href="#" className="hover:text-primary transition-colors">{l}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="container mt-10 pt-6 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center gap-4">
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
