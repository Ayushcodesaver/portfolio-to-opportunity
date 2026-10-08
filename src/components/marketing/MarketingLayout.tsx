import { ReactNode, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Github, Twitter, Linkedin, ArrowLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/common/Logo";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";

interface MarketingLayoutProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function MarketingLayout({ eyebrow, title, subtitle, children }: MarketingLayoutProps) {
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
          <Logo size="sm" />
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/features" className="hover:text-foreground transition-colors">Features</Link>
            <Link to="/how-it-works" className="hover:text-foreground transition-colors">How it works</Link>
            <Link to="/showcase" className="hover:text-foreground transition-colors">Showcase</Link>
            <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
            <Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <Button onClick={() => navigate("/feed")} className="bg-gradient-primary hover:opacity-90">Go to App</Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/login")} className="hidden sm:inline-flex">Sign in</Button>
                <Button onClick={() => navigate("/register")} className="bg-gradient-primary hover:opacity-90 shadow-soft">Join</Button>
              </>
            )}
            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-card border-border/50">
                <div className="flex flex-col gap-1 mt-8">
                  {[
                    ["Features", "/features"],
                    ["How it works", "/how-it-works"],
                    ["Showcase", "/showcase"],
                    ["Blog", "/blog"],
                    ["Guides", "/guides"],
                    ["FAQ", "/faq"],
                    ["Support", "/support"],
                    ["Privacy", "/privacy"],
                    ["Terms", "/terms"],
                  ].map(([label, href]) => (
                    <Link key={href} to={href} className="px-3 py-3 rounded-lg text-sm hover:bg-primary/10 hover:text-foreground transition-colors">
                      {label}
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-36 pb-16 overflow-hidden">

        <div className="container relative">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>

          <div className="max-w-4xl" style={{ perspective: "1000px" }}>
            {eyebrow && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-primary/30 text-xs uppercase tracking-wider text-foreground mb-5"
              >
                {eyebrow}
              </motion.div>
            )}
            <motion.h1
              initial={{ opacity: 0, y: 30, rotateX: -15 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 text-gradient leading-[1.05]"
              style={{ transformStyle: "preserve-3d" }}
            >
              {title}
            </motion.h1>
            {subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg md:text-xl text-muted-foreground max-w-2xl"
              >
                {subtitle}
              </motion.p>
            )}
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <main className="pb-24">
        <div className="container" style={{ perspective: "1500px" }}>
          {children}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border/50 py-12">
        <div className="container grid md:grid-cols-4 gap-8">
          <div>
            <Logo size="sm" />
            <p className="text-sm text-muted-foreground mt-3">Build. Learn. Get Noticed.</p>
          </div>
          {[
            { title: "Platform", links: [["Features","/features"],["How it works","/how-it-works"],["Showcase","/showcase"]] },
            { title: "Resources", links: [["Blog","/blog"],["Guides","/guides"],["FAQ","/faq"],["Support","/support"]] },
            { title: "Legal", links: [["Privacy","/privacy"],["Terms","/terms"]] },
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

/** Restrained elevated content card. */
export function Card3D({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateX: -10 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ rotateX: 4, rotateY: -4, translateY: -6 }}
      style={{ transformStyle: "preserve-3d", transformPerspective: 1000 }}
      className={`glass rounded-lg p-6 border border-primary/10 hover:border-primary/40 transition-colors relative group ${className}`}
    >
      <div className="absolute inset-0 rounded-lg bg-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="relative" style={{ transform: "translateZ(20px)" }}>{children}</div>
    </motion.div>
  );
}
