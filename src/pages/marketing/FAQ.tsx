import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from "framer-motion";

const faqs = [
  { q: "What is Xebure?", a: "Xebure is a complete internship management system: timeline tracks, daily tasks, real-time notifications, AI assistance, evaluations, and a public portfolio — all in one violet-and-black platform." },
  { q: "Who is Xebure for?", a: "Interns, HR teams, and admins. Interns ship work and build portfolios. HR runs programs, reviews submissions, and evaluates. Admins moderate content and manage users." },
  { q: "How long are the internship programs?", a: "HR can configure programs for 30, 60, or 90 days (or any custom length). Visual milestones unlock at 25%, 50%, 75%, and 100% progress." },
  { q: "Is my data private?", a: "Yes. Every table uses row-level security, so users only see what they're allowed to see. Interns see their own data; HR sees their cohort; admins see the platform." },
  { q: "Do I need to install anything?", a: "No. Xebure runs entirely in your browser. Just sign up and you're in." },
  { q: "Can I use Xebure for free?", a: "Yes. Core intern features are free. Custom programs, branded HR dashboards, and analytics are part of the team plan." },
  { q: "How does the AI assistant work?", a: "It uses Lovable AI Gateway with Gemini and GPT models — no extra API key needed. You can chat with it or one-click 'Improve with AI' on project descriptions." },
  { q: "Can I export my portfolio?", a: "Yes. Your public profile is shareable via a clean URL, and you can download project data anytime from settings." },
];

export default function FAQ() {
  return (
    <MarketingLayout
      eyebrow="FAQ"
      title="Questions, answered."
      subtitle="Everything you wanted to know about Xebure but were too busy shipping to ask."
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto glass rounded-2xl p-6 md:p-10"
        style={{ transformStyle: "preserve-3d" }}
      >
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-border/50">
              <AccordionTrigger className="text-left hover:text-primary">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </MarketingLayout>
  );
}
