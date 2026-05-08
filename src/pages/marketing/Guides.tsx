import { MarketingLayout, Card3D } from "@/components/marketing/MarketingLayout";
import { BookOpen, Clock } from "lucide-react";

const guides = [
  { title: "Getting started as an intern", time: "5 min", level: "Beginner", desc: "Sign up, complete your profile, and submit your first task." },
  { title: "Submitting tasks the right way", time: "4 min", level: "Beginner", desc: "Files, links, screenshots — what to include for fast approval." },
  { title: "Building your project portfolio", time: "8 min", level: "Intermediate", desc: "Write descriptions, pick tags, add demos — the polish that matters." },
  { title: "Using the AI assistant effectively", time: "6 min", level: "Intermediate", desc: "Prompts that get useful answers and how to refine generated text." },
  { title: "Setting up an internship program (HR)", time: "10 min", level: "HR", desc: "Create programs, schedule daily tasks, enroll interns, broadcast updates." },
  { title: "Reviewing submissions & evaluations (HR)", time: "7 min", level: "HR", desc: "Approve work, give feedback, run 5-category evaluations." },
];

export default function Guides() {
  return (
    <MarketingLayout
      eyebrow="Guides"
      title="Learn Xebure, end to end."
      subtitle="Short, focused walkthroughs for interns and HR. No fluff."
    >
      <div className="grid md:grid-cols-2 gap-6">
        {guides.map((g, i) => (
          <Card3D key={g.title} delay={i * 0.05}>
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0 glow-violet">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap gap-2 mb-2 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary-glow">{g.level}</span>
                  <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" />{g.time}</span>
                </div>
                <h3 className="text-lg font-semibold mb-1">{g.title}</h3>
                <p className="text-sm text-muted-foreground">{g.desc}</p>
              </div>
            </div>
          </Card3D>
        ))}
      </div>
    </MarketingLayout>
  );
}
