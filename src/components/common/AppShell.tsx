import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Home, FolderKanban, PlusSquare, Sparkles, BarChart3, Bell,
  Settings, LogOut, Users as UsersIcon, ClipboardCheck, Calendar,
  Inbox, Ticket, Shield, ShieldCheck, FileText, FileCheck, Activity, Bot, Cpu,
  Target, Megaphone, LayoutDashboard, Trophy, Menu, MessageSquare, Image as ImageIcon, Briefcase, UserRound
} from "lucide-react";
import { Logo } from "@/components/common/Logo";
import { NotificationBell } from "@/components/common/NotificationBell";
import { OnboardingBanner } from "@/components/common/OnboardingBanner";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { GooeySearch } from "@/components/vengeance/gooey-search";
import { MagneticSpotlightMarquee } from "@/components/vengeance/magnetic-spotlight-marquee";

interface NavItem { to: string; label: string; icon: any; }

const internNav: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tasks", label: "My Tasks", icon: Target },
  { to: "/announcements", label: "Announcements", icon: Megaphone },
  { to: "/requirements", label: "Client Requirements", icon: FileText },
  { to: "/feed", label: "Feed", icon: Home },
  { to: "/my-projects", label: "My Projects", icon: FolderKanban },
  { to: "/create-project", label: "Create Project", icon: PlusSquare },
  { to: "/ai-assistant", label: "AI Assistant", icon: Sparkles },
  { to: "/resume-builder", label: "Resume Builder", icon: FileText },
  { to: "/my-resume", label: "My Resume", icon: FileCheck },
  { to: "/my-profile", label: "My Profile", icon: UserRound },
  { to: "/internships", label: "Internships", icon: Briefcase },
  { to: "/internship-progress", label: "Progress", icon: BarChart3 },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/community", label: "Community", icon: MessageSquare },
  { to: "/settings", label: "Settings", icon: Settings },
];

const hrNav: NavItem[] = [
  { to: "/hr/dashboard", label: "Overview", icon: Home },
  { to: "/hr/programs", label: "Programs", icon: Calendar },
  { to: "/hr/submissions", label: "Submissions", icon: ClipboardCheck },
  { to: "/hr/broadcast", label: "Broadcast", icon: Megaphone },
  { to: "/hr/requirements", label: "Client Requirements", icon: FileText },
  { to: "/hr/interns", label: "Interns", icon: UsersIcon },
  { to: "/hr/resumes", label: "Resumes", icon: FileCheck },
  { to: "/hr/postings", label: "Postings", icon: Briefcase },
  { to: "/hr/evaluations", label: "Evaluations", icon: ClipboardCheck },
  { to: "/hr/attendance", label: "Attendance", icon: Calendar },
  { to: "/hr/inbox", label: "Inbox", icon: Inbox },
  { to: "/hr/tickets", label: "Tickets", icon: Ticket },
  { to: "/hr/blog", label: "Blog", icon: FileText },
];

const adminNav: NavItem[] = [
  { to: "/staff/console", label: "Console", icon: Shield },
  { to: "/staff/users", label: "Users", icon: UsersIcon },
  { to: "/staff/approvals", label: "Approvals", icon: ShieldCheck },
  { to: "/staff/logs", label: "System Logs", icon: FileText },
  { to: "/staff/ai-control", label: "AI Control", icon: Cpu },
  { to: "/staff/analytics", label: "Analytics", icon: Activity },
  { to: "/staff/ui-assets", label: "UI Assets", icon: ImageIcon },
];

function NavList({ navs, variant, isHR, isAdmin, onNavigate }: { navs: NavItem[]; variant: string; isHR: boolean; isAdmin: boolean; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
      {navs.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
              isActive
                ? "bg-secondary text-foreground shadow-soft border border-foreground/20"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )
          }
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span className="truncate">{item.label}</span>
        </NavLink>
      ))}

      {variant === "intern" && (isHR || isAdmin) && (
        <div className="pt-4 mt-4 border-t border-border/50 space-y-1">
          <p className="px-3 text-xs uppercase tracking-wider text-muted-foreground mb-1">Switch view</p>
          {isHR && (
            <NavLink to="/hr/dashboard" onClick={onNavigate} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
              <Bot className="h-4 w-4" /> HR Dashboard
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/staff/console" onClick={onNavigate} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
              <Shield className="h-4 w-4" /> Admin Panel
            </NavLink>
          )}
        </div>
      )}
    </nav>
  );
}

export function AppShell({ variant }: { variant: "intern" | "hr" | "admin" }) {
  const { user, signOut, isHR, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const searchItems = navs.map((item) => item.label);

  const navs = variant === "hr" ? hrNav : variant === "admin" ? adminNav : internNav;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const SidebarBody = (
    <>
      <div className="p-5 border-b border-border/50">
        <Logo size="sm" />
        <div className="mt-2 flex gap-1">
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary text-foreground border border-border">
            {variant}
          </span>
        </div>
      </div>

      <NavList navs={navs} variant={variant} isHR={isHR} isAdmin={isAdmin} onNavigate={() => setMobileOpen(false)} />

      <div className="p-3 border-t border-border/50">
        <div className="flex items-center gap-2 p-2 rounded-lg">
          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold shrink-0">
            {user?.email?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs truncate">{user?.email}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut} className="h-8 w-8">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <aside className="w-64 shrink-0 hidden md:flex flex-col m-3 rounded-lg glass-strong overflow-hidden">
        {SidebarBody}
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col md:my-3 md:mr-3 md:rounded-lg md:glass-strong md:overflow-hidden">
        {/* Desktop top bar */}
        <header className="hidden md:flex sticky top-0 z-30 items-center justify-between gap-4 px-6 h-14 border-b border-border/50 bg-background/80 backdrop-blur-md">
          <GooeySearch
            items={searchItems}
            onSelect={(label) => {
              const destination = navs.find((item) => item.label === label);
              if (destination) navigate(destination.to);
            }}
            placeholder="Search workspace"
            buttonLabel="Search"
          />
          <NotificationBell />
        </header>
        <MagneticSpotlightMarquee items={["Xebure live", `${variant} workspace`, "Real-time activity", "Secure access"]} />

        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-40 flex items-center justify-between gap-3 px-4 h-14 border-b border-border/50 glass-strong">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 glass-strong border-border/50 flex flex-col">
              {SidebarBody}
            </SheetContent>
          </Sheet>
          <Logo size="sm" />
          <NotificationBell />
        </header>

        <div className="flex-1 min-w-0 overflow-y-auto">
          <OnboardingBanner />
          <Outlet />
        </div>
      </main>
    </div>
  );
}
