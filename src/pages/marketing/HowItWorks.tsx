import { MarketingLayout, Card3D } from "@/components/marketing/MarketingLayout";
import { UserPlus, Target, Send, CheckCircle2, Award } from "lucide-react";

const steps = [
  { n: "01", icon: UserPlus, title: "Sign up & enroll", desc: "Create your intern profile and join an active internship program (30/60/90 days)." },
  { n: "02", icon: Target, title: "Get daily tasks", desc: "HR assigns tasks for each day with deadlines, points, and priority levels." },
  { n: "03", icon: Send, title: "Submit your work", desc: "Upload files, share GitHub links, or paste demo URLs directly into Xebure." },
  { n: "04", icon: CheckCircle2, title: "Get reviewed", desc: "HR approves or sends feedback. Approved work earns points instantly." },
  { n: "05", icon: Award, title: "Build your portfolio", desc: "Every project becomes part of your public showcase. Recruiters notice." },
];

export default function HowItWorks() {
  return (
    <MarketingLayout
      eyebrow="How it works"
      title="From day one to demo day."
      subtitle="A clear, structured path through your internship — with everything tracked in real time."
    >
      <div className="space-y-6 max-w-4xl mx-auto">
        {steps.map((s, i) => (
          <Card3D key={s.n} delay={i * 0.06} className="md:flex md:items-center md:gap-8">
            <div className="flex items-center gap-4 md:w-1/3">
              <span className="text-5xl font-bold text-gradient">{s.n}</span>
              <div className="h-14 w-14 rounded-xl bg-gradient-primary flex items-center justify-center shadow-soft">
                <s.icon className="h-7 w-7 text-foreground" />
              </div>
            </div>
            <div className="md:flex-1 mt-4 md:mt-0">
              <h3 className="text-2xl font-semibold mb-2">{s.title}</h3>
              <p className="text-muted-foreground">{s.desc}</p>
            </div>
          </Card3D>
        ))}
      </div>
    </MarketingLayout>
  );
}
