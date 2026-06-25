import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppShell } from "@/components/common/AppShell";
import { CookieConsent } from "@/components/common/CookieConsent";
import { useIdleSignOut } from "@/hooks/useIdleSignOut";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Pricing from "./pages/Pricing";
import TopInterns from "./pages/TopInterns";
import NotFound from "./pages/NotFound";
import Verify from "./pages/Verify";

import Features from "./pages/marketing/Features";
import HowItWorks from "./pages/marketing/HowItWorks";
import Showcase from "./pages/marketing/Showcase";
import Blog from "./pages/marketing/Blog";
import BlogPost from "./pages/marketing/BlogPost";
import HRBlog from "./pages/hr/HRBlog";
import Guides from "./pages/marketing/Guides";
import FAQ from "./pages/marketing/FAQ";
import Support from "./pages/marketing/Support";
import Privacy from "./pages/marketing/Privacy";
import Terms from "./pages/marketing/Terms";

import InternDashboard from "./pages/intern/InternDashboard";
import MyTasks from "./pages/intern/MyTasks";
import GlobalAnnouncements from "./pages/intern/GlobalAnnouncements";
import ClientRequirementsPage from "./pages/intern/ClientRequirementsPage";
import Feed from "./pages/intern/Feed";
import MyProjects from "./pages/intern/MyProjects";
import CreateProject from "./pages/intern/CreateProject";
import AIAssistant from "./pages/intern/AIAssistant";
import ResumeBuilder from "./pages/intern/ResumeBuilder";
import InternshipProgress from "./pages/intern/InternshipProgress";
import Notifications from "./pages/intern/Notifications";
import Leaderboard from "./pages/intern/Leaderboard";
import Profile from "./pages/common/Profile";
import Settings from "./pages/common/Settings";
import Community from "./pages/common/Community";

import HRDashboard from "./pages/hr/HRDashboard";
import HRPrograms from "./pages/hr/HRPrograms";
import HRProgramTasks from "./pages/hr/HRProgramTasks";
import HRProgramEnroll from "./pages/hr/HRProgramEnroll";
import HRSubmissions from "./pages/hr/HRSubmissions";
import HRBroadcast from "./pages/hr/HRBroadcast";
import HRClientRequirements from "./pages/hr/HRClientRequirements";
import HRInterns from "./pages/hr/HRInterns";
import HREvaluations from "./pages/hr/HREvaluations";
import HRAttendance from "./pages/hr/HRAttendance";
import HRInbox from "./pages/hr/HRInbox";
import HRTickets from "./pages/hr/HRTickets";

import AdminConsole from "./pages/admin/AdminConsole";
import UserManagement from "./pages/admin/UserManagement";
import ContentApproval from "./pages/admin/ContentApproval";
import SystemLogs from "./pages/admin/SystemLogs";
import AIControl from "./pages/admin/AIControl";
import Analytics from "./pages/admin/Analytics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner theme="dark" />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/top-interns" element={<TopInterns />} />
            <Route path="/verify/:code" element={<Verify />} />

            {/* Marketing pages */}
            <Route path="/features" element={<Features />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/showcase" element={<Showcase />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/guides" element={<Guides />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/support" element={<Support />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />

            {/* Intern shell */}
            <Route element={<ProtectedRoute><AppShell variant="intern" /></ProtectedRoute>}>
              <Route path="/dashboard" element={<InternDashboard />} />
              <Route path="/tasks" element={<MyTasks />} />
              <Route path="/announcements" element={<GlobalAnnouncements />} />
              <Route path="/requirements" element={<ClientRequirementsPage />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/my-projects" element={<MyProjects />} />
              <Route path="/create-project" element={<CreateProject />} />
              <Route path="/ai-assistant" element={<AIAssistant />} />
              <Route path="/resume-builder" element={<ResumeBuilder />} />
              <Route path="/internship-progress" element={<InternshipProgress />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/community" element={<Community />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile/:username" element={<Profile />} />
            </Route>

            {/* HR shell */}
            <Route element={<ProtectedRoute requireRole="hr"><AppShell variant="hr" /></ProtectedRoute>}>
              <Route path="/hr" element={<Navigate to="/hr/dashboard" replace />} />
              <Route path="/hr/dashboard" element={<HRDashboard />} />
              <Route path="/hr/programs" element={<HRPrograms />} />
              <Route path="/hr/programs/:id/tasks" element={<HRProgramTasks />} />
              <Route path="/hr/programs/:id/enroll" element={<HRProgramEnroll />} />
              <Route path="/hr/submissions" element={<HRSubmissions />} />
              <Route path="/hr/broadcast" element={<HRBroadcast />} />
              <Route path="/hr/requirements" element={<HRClientRequirements />} />
              <Route path="/hr/interns" element={<HRInterns />} />
              <Route path="/hr/evaluations" element={<HREvaluations />} />
              <Route path="/hr/attendance" element={<HRAttendance />} />
              <Route path="/hr/inbox" element={<HRInbox />} />
              <Route path="/hr/tickets" element={<HRTickets />} />
              <Route path="/hr/blog" element={<HRBlog />} />
            </Route>

            {/* Admin shell */}
            <Route element={<ProtectedRoute requireRole="admin"><AppShell variant="admin" /></ProtectedRoute>}>
              <Route path="/staff" element={<Navigate to="/staff/console" replace />} />
              <Route path="/staff/console" element={<AdminConsole />} />
              <Route path="/staff/users" element={<UserManagement />} />
              <Route path="/staff/approvals" element={<ContentApproval />} />
              <Route path="/staff/logs" element={<SystemLogs />} />
              <Route path="/staff/ai-control" element={<AIControl />} />
              <Route path="/staff/analytics" element={<Analytics />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
