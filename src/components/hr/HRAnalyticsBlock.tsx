import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GlassPanel, PanelHeader } from "@/components/dashboard/GlassPanel";
import { Activity, BarChart3, Download, FileText, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { format, subDays, eachDayOfInterval } from "date-fns";
import Papa from "papaparse";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { toast } from "sonner";

const COLORS = ["hsl(var(--primary))", "#22c55e", "#f59e0b", "#ef4444", "#6366f1"];

export function HRAnalyticsBlock() {
  const { data } = useQuery({
    queryKey: ["hr-analytics"],
    queryFn: async () => {
      const since = subDays(new Date(), 29).toISOString();
      const [subs, projects, evals] = await Promise.all([
        supabase.from("task_submissions").select("id, status, submitted_at").gte("submitted_at", since),
        supabase.from("projects").select("id, status, created_at").gte("created_at", since),
        supabase.from("evaluations").select("id, score, created_at"),
      ]);

      // Daily series for last 30 days
      const days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });
      const daily = days.map(d => {
        const key = format(d, "yyyy-MM-dd");
        const subsCount = (subs.data ?? []).filter((s: any) => s.submitted_at?.startsWith(key)).length;
        const approved = (subs.data ?? []).filter((s: any) => s.submitted_at?.startsWith(key) && s.status === "approved").length;
        const projCount = (projects.data ?? []).filter((p: any) => p.created_at?.startsWith(key)).length;
        return { day: format(d, "MMM d"), submissions: subsCount, approved, projects: projCount };
      });

      // Status distribution
      const statusCounts: Record<string, number> = {};
      (subs.data ?? []).forEach((s: any) => {
        statusCounts[s.status] = (statusCounts[s.status] ?? 0) + 1;
      });
      const statusDist = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

      // Score histogram
      const scoreBuckets = [0, 0, 0, 0, 0];
      (evals.data ?? []).forEach((e: any) => {
        const s = Math.min(5, Math.max(1, Math.round(Number(e.score) || 0)));
        scoreBuckets[s - 1]++;
      });
      const scores = scoreBuckets.map((v, i) => ({ score: `${i + 1}★`, count: v }));

      return { daily, statusDist, scores, totals: { subs: subs.data?.length ?? 0, projects: projects.data?.length ?? 0, evals: evals.data?.length ?? 0 } };
    },
  });

  const exportCSV = () => {
    if (!data) return;
    const csv = Papa.unparse(data.daily);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `xebure-analytics-${format(new Date(), "yyyy-MM-dd")}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  };

  const exportPDF = async () => {
    if (!data) return;
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([612, 792]);
    const font = await pdf.embedFont(StandardFonts.HelveticaBold);
    const reg = await pdf.embedFont(StandardFonts.Helvetica);
    page.drawText("Xebure — HR Analytics Report", { x: 50, y: 740, size: 22, font, color: rgb(0.05, 0.1, 0.3) });
    page.drawText(`Generated ${format(new Date(), "PPP")}`, { x: 50, y: 718, size: 10, font: reg, color: rgb(0.4, 0.4, 0.5) });

    let y = 680;
    page.drawText("Totals (last 30 days)", { x: 50, y, size: 14, font });
    y -= 22;
    page.drawText(`Submissions: ${data.totals.subs}`, { x: 60, y, size: 11, font: reg }); y -= 16;
    page.drawText(`Projects: ${data.totals.projects}`, { x: 60, y, size: 11, font: reg }); y -= 16;
    page.drawText(`Evaluations: ${data.totals.evals}`, { x: 60, y, size: 11, font: reg }); y -= 28;

    page.drawText("Daily activity", { x: 50, y, size: 14, font }); y -= 20;
    page.drawText("Day                Submissions   Approved   Projects", { x: 60, y, size: 10, font });
    y -= 14;
    data.daily.slice(-20).forEach(d => {
      page.drawText(`${d.day.padEnd(18)} ${String(d.submissions).padStart(10)}   ${String(d.approved).padStart(8)}   ${String(d.projects).padStart(8)}`, { x: 60, y, size: 9, font: reg });
      y -= 12;
    });

    const bytes = await pdf.save();
    const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `xebure-analytics-${format(new Date(), "yyyy-MM-dd")}.pdf`; a.click();
    URL.revokeObjectURL(url);
    toast.success("PDF downloaded");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-semibold flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Analytics (last 30 days)</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={!data}><Download className="h-4 w-4 mr-1" /> CSV</Button>
          <Button variant="outline" size="sm" onClick={exportPDF} disabled={!data}><FileText className="h-4 w-4 mr-1" /> PDF</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <GlassPanel>
          <PanelHeader icon={TrendingUp} title="Submissions trend" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.daily ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Line type="monotone" dataKey="submissions" stroke={COLORS[0]} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="approved" stroke={COLORS[1]} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

        <GlassPanel>
          <PanelHeader icon={Activity} title="New projects / day" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.daily ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="projects" fill={COLORS[4]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

        <GlassPanel>
          <PanelHeader icon={BarChart3} title="Submission status" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data?.statusDist ?? []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {(data?.statusDist ?? []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

        <GlassPanel>
          <PanelHeader icon={BarChart3} title="Evaluation scores" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.scores ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="score" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="count" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
