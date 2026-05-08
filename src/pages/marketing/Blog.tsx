import { MarketingLayout, Card3D } from "@/components/marketing/MarketingLayout";
import { Calendar, ArrowRight } from "lucide-react";

const posts = [
  { title: "How to make the most of your first 30 days as an intern", date: "May 2026", tag: "Onboarding", excerpt: "A practical playbook for showing up, shipping early, and earning trust fast." },
  { title: "Building a portfolio recruiters actually read", date: "Apr 2026", tag: "Career", excerpt: "Stop listing tutorials. Here's how to frame projects so they tell a story." },
  { title: "Why daily check-ins beat weekly reports", date: "Apr 2026", tag: "Productivity", excerpt: "Tight feedback loops compound. Long ones rot. The data, and what to do." },
  { title: "AI-assisted code review for interns", date: "Mar 2026", tag: "AI", excerpt: "Use AI as a senior dev that's always available — without becoming dependent." },
  { title: "Designing internship tracks that don't suck", date: "Mar 2026", tag: "HR", excerpt: "What we learned from running 90-day programs across 12 companies." },
  { title: "From intern to full-time: 5 stories", date: "Feb 2026", tag: "Stories", excerpt: "Five Xebure interns share the exact projects that landed them offers." },
];

export default function Blog() {
  return (
    <MarketingLayout
      eyebrow="Blog"
      title="Notes from the field."
      subtitle="Playbooks, stories, and lessons from internships happening right now on Xebure."
    >
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((p, i) => (
          <Card3D key={p.title} delay={i * 0.04}>
            <div className="text-xs uppercase tracking-wider text-primary-glow mb-3">{p.tag}</div>
            <h3 className="text-xl font-semibold mb-2">{p.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{p.excerpt}</p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {p.date}</span>
              <span className="flex items-center gap-1 text-primary">Read <ArrowRight className="h-3 w-3" /></span>
            </div>
          </Card3D>
        ))}
      </div>
    </MarketingLayout>
  );
}
