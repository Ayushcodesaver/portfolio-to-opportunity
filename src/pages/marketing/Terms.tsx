import { MarketingLayout, Card3D } from "@/components/marketing/MarketingLayout";

const sections = [
  { title: "Acceptance of terms", body: "By creating an account you agree to these terms. If you don't agree, don't use Xebure." },
  { title: "Your account", body: "You're responsible for keeping your credentials safe and for everything that happens under your account. One human, one account." },
  { title: "Acceptable use", body: "Don't post illegal, abusive, or infringing content. Don't try to break, scrape, or reverse-engineer the platform. Don't impersonate others." },
  { title: "Your content", body: "You own everything you upload. By posting publicly on Xebure (e.g. the showcase feed), you grant us a non-exclusive license to display it within the platform." },
  { title: "HR & Admin responsibilities", body: "If you act as HR or Admin, you confirm you have authority to manage the interns under your program and to handle their work and data lawfully." },
  { title: "Service availability", body: "We aim for high uptime but provide Xebure 'as is'. Scheduled maintenance and rare incidents may interrupt service." },
  { title: "Termination", body: "We may suspend or close accounts that violate these terms. You can delete your account anytime from settings or by contacting support." },
  { title: "Liability", body: "To the maximum extent allowed by law, Xebure is not liable for indirect, incidental, or consequential damages arising from your use of the platform." },
  { title: "Changes", body: "We may update these terms. Material changes will be announced in-app at least 14 days before taking effect." },
  { title: "Contact", body: "Questions? Email legal@xebure.com." },
];

export default function Terms() {
  return (
    <MarketingLayout
      eyebrow="Legal"
      title="Terms of Service"
      subtitle="The ground rules for using Xebure. Plain language, no surprises."
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
