import { MarketingLayout, Card3D } from "@/components/marketing/MarketingLayout";
import { Sparkles, Code2, Layout, MessageCircle, TrendingUp, Award, Target, Bell, Calendar, Users, Shield, Zap } from "lucide-react";

const features = [
  { icon: Target, title: "Timeline System", desc: "30/60/90-day internship tracks with visual milestones at 25%, 50%, 75%, 100%." },
  { icon: Calendar, title: "Daily Tasks", desc: "HR creates tasks per day, interns submit work with files & links, get reviewed." },
  { icon: Bell, title: "Real-time Notifications", desc: "Live broadcasts from HR with priority levels and read receipts." },
  { icon: Sparkles, title: "AI Assistant", desc: "Improve project descriptions, get coding help, and refine your portfolio." },
  { icon: Award, title: "Gamification", desc: "Earn points for approved submissions, climb the leaderboard, unlock badges." },
  { icon: Users, title: "HR Dashboard", desc: "Full intern management: evaluations, attendance, messaging, tickets." },
  { icon: Layout, title: "Portfolio Showcase", desc: "Public profiles, project feeds, likes, comments, saves — your career hub." },
  { icon: TrendingUp, title: "Progress Analytics", desc: "Skill heatmaps, milestones reached, daily activity charts." },
  { icon: Shield, title: "Role-based Access", desc: "Secure separation between Intern, HR, and Admin with row-level security." },
  { icon: MessageCircle, title: "Live Messaging", desc: "Direct chat between interns and HR plus a full ticket support system." },
  { icon: Code2, title: "Project Management", desc: "Submit projects with media, GitHub & demo links, tags, difficulty." },
  { icon: Zap, title: "Live Client Briefs", desc: "HR pushes client requirements with version history — interns always in sync." },
];

export default function Features() {
  return (
    <MarketingLayout
      eyebrow="Features"
      title="Everything you need to run a great internship."
      subtitle="From day-one onboarding to final evaluations, Xebure gives interns and HR a single, real-time platform."
    >
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <Card3D key={f.title} delay={i * 0.04}>
            <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 shadow-soft">
              <f.icon className="h-6 w-6 text-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.desc}</p>
          </Card3D>
        ))}
      </div>
    </MarketingLayout>
  );
}
