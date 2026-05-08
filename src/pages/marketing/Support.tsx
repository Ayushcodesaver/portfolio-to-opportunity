import { MarketingLayout, Card3D } from "@/components/marketing/MarketingLayout";
import { Mail, MessageSquare, BookOpen, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";

const channels = [
  { icon: Mail, title: "Email", desc: "Reach the team within 24 hours.", value: "support@xebure.com" },
  { icon: MessageSquare, title: "In-app chat", desc: "Open a ticket from your dashboard.", value: "Sign in to start" },
  { icon: BookOpen, title: "Guides", desc: "Self-serve walkthroughs for every feature.", value: "/guides" },
  { icon: LifeBuoy, title: "Status", desc: "Live system status & incident updates.", value: "All systems normal" },
];

export default function Support() {
  const [sent, setSent] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    toast.success("Message received — we'll be in touch.");
  };

  return (
    <MarketingLayout
      eyebrow="Support"
      title="We're here when you need us."
      subtitle="Pick a channel, or send a message and we'll get back fast."
    >
      <div className="grid lg:grid-cols-2 gap-10">
        <div className="grid sm:grid-cols-2 gap-5">
          {channels.map((c, i) => (
            <Card3D key={c.title} delay={i * 0.05}>
              <div className="h-11 w-11 rounded-xl bg-gradient-primary flex items-center justify-center mb-3 glow-violet">
                <c.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold mb-1">{c.title}</h3>
              <p className="text-sm text-muted-foreground mb-2">{c.desc}</p>
              <p className="text-sm text-primary-glow font-medium">{c.value}</p>
            </Card3D>
          ))}
        </div>

        <Card3D>
          <h3 className="text-2xl font-semibold mb-1">Send us a message</h3>
          <p className="text-sm text-muted-foreground mb-6">Real humans read every message.</p>
          {sent ? (
            <div className="text-center py-8">
              <p className="text-primary text-lg font-semibold mb-2">Thanks!</p>
              <p className="text-sm text-muted-foreground">We'll get back within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <Input placeholder="Your name" required className="bg-background/50" />
              <Input type="email" placeholder="Email" required className="bg-background/50" />
              <Input placeholder="Subject" required className="bg-background/50" />
              <Textarea placeholder="How can we help?" rows={5} required className="bg-background/50" />
              <Button type="submit" className="w-full bg-gradient-primary glow-violet">Send message</Button>
            </form>
          )}
        </Card3D>
      </div>
    </MarketingLayout>
  );
}
