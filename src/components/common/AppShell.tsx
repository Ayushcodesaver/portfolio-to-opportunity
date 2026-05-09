import { ReactNode } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Home, FolderKanban, PlusSquare, Sparkles, BarChart3, Bell,
  Settings, LogOut, Users as UsersIcon, ClipboardCheck, Calendar,
  Inbox, Ticket, Shield, ShieldCheck, FileText, Activity, Bot, Cpu,
  Target, Megaphone, LayoutDashboard
} from "lucide-react";
import { Logo } from "@/components/common/Logo";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  { to: "/internship-progress", label: "Progress", icon: BarChart3 },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/settings", label: "Settings", icon: Settings },
];

const hrNav: NavItem[] = [
  { to: "/hr/dashboard", label: "Overview", icon: Home },
  { to: "/hr/programs", label: "Programs", icon: Calendar },
  { to: "/hr/submissions", label: "Submissions", icon: ClipboardCheck },
  { to: "/hr/broadcast", label: "Broadcast", icon: Megaphone },
  { to: "/hr/requirements", label: "Client Requirements", icon: FileText },
  { to: "/hr/interns", label: "Interns", icon: UsersIcon },
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
];

export function AppShell({ variant }: { variant: "intern" | "hr" | "admin" }) {
  const { user, signOut, isHR, isAdmin } = useAuth();
  const navigate = useNavigate();

  const navs =
    variant === "hr" ? hrNav : variant === "admin" ? adminNav : internNav;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-border/50 bg-card/30 hidden md:flex flex-col">
        <div className="p-5 border-b border-border/50">
          <Logo />
          <div className="mt-2 flex gap-1">
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/20 text-primary-glow">
              {variant}
            </span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navs.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-primary/15 text-primary-glow border-l-2 border-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}

          {/* Cross-role nav */}
          {variant === "intern" && (isHR || isAdmin) && (
            <div className="pt-4 mt-4 border-t border-border/50 space-y-1">
              <p className="px-3 text-xs uppercase tracking-wider text-muted-foreground mb-1">Switch view</p>
              {isHR && (
                <NavLink to="/hr/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                  <Bot className="h-4 w-4" /> HR Dashboard
                </NavLink>
              )}
              {isAdmin && (
                <NavLink to="/staff/console" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                  <Shield className="h-4 w-4" /> Admin Panel
                </NavLink>
              )}
            </div>
          )}
        </nav>

        <div className="p-3 border-t border-border/50">
          <div className="flex items-center gap-2 p-2 rounded-lg">
            <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-semibold">
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
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
