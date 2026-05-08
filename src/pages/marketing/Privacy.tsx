import { MarketingLayout, Card3D } from "@/components/marketing/MarketingLayout";

const sections = [
  { title: "What we collect", body: "Account info (name, email, username), profile data you choose to share, internship activity (tasks, submissions, projects), and standard usage logs (IP, browser, timestamps) needed to operate the platform." },
  { title: "How we use it", body: "To run your internship: assign tasks, track progress, enable AI assistance, surface notifications, and let HR review your work. We do not sell personal data." },
  { title: "Who can see your data", body: "You see all your data. Your HR sees your submissions, evaluations, and attendance. Admins can moderate public content. Other interns only see what you publish to the public feed." },
  { title: "Storage & security", body: "Data is stored in encrypted Postgres with row-level security. Files live in private storage buckets unless explicitly shared. Auth uses industry-standard JWT." },
  { title: "AI processing", body: "When you use the AI assistant or 'Improve with AI', your prompt and the relevant context are sent to model providers (Google, OpenAI) via the Lovable AI Gateway. We don't use your prompts to train models." },
  { title: "Your rights", body: "You can export, edit, or delete your data anytime from settings. To delete your account, contact support@xebure.com and we'll process within 30 days." },
  { title: "Cookies", body: "We use only essential cookies for authentication and session management. No tracking cookies, no third-party advertising." },
  { title: "Contact", body: "Questions about privacy? Email privacy@xebure.com." },
];

export default function Privacy() {
  return (
    <MarketingLayout
      eyebrow="Legal"
      title="Privacy Policy"
      subtitle={`Last updated: May 2026`}
    >
      <div className="max-w-3xl mx-auto space-y-5">
        {sections.map((s, i) => (
          <Card3D key={s.title} delay={i * 0.03}>
            <h2 className="text-xl font-semibold mb-2 text-primary-glow">{s.title}</h2>
            <p className="text-muted-foreground leading-relaxed">{s.body}</p>
          </Card3D>
        ))}
      </div>
    </MarketingLayout>
  );
}
