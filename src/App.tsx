import { lazy, Suspense } from "react";
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
import { Loader2 } from "lucide-react";

import Landing from "./pages/Landing";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Pricing = lazy(() => import("./pages/Pricing"));
const TopInterns = lazy(() => import("./pages/TopInterns"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Verify = lazy(() => import("./pages/Verify"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const HRLogin = lazy(() => import("./pages/HRLogin"));

const Features = lazy(() => import("./pages/marketing/Features"));
const HowItWorks = lazy(() => import("./pages/marketing/HowItWorks"));
const Showcase = lazy(() => import("./pages/marketing/Showcase"));
const Blog = lazy(() => import("./pages/marketing/Blog"));
const BlogPost = lazy(() => import("./pages/marketing/BlogPost"));
const HRBlog = lazy(() => import("./pages/hr/HRBlog"));
const Guides = lazy(() => import("./pages/marketing/Guides"));
const FAQ = lazy(() => import("./pages/marketing/FAQ"));
const Support = lazy(() => import("./pages/marketing/Support"));
const Privacy = lazy(() => import("./pages/marketing/Privacy"));
const Terms = lazy(() => import("./pages/marketing/Terms"));

const InternDashboard = lazy(() => import("./pages/intern/InternDashboard"));
const MyTasks = lazy(() => import("./pages/intern/MyTasks"));
const GlobalAnnouncements = lazy(() => import("./pages/intern/GlobalAnnouncements"));
const ClientRequirementsPage = lazy(() => import("./pages/intern/ClientRequirementsPage"));
const Feed = lazy(() => import("./pages/intern/Feed"));
const MyProjects = lazy(() => import("./pages/intern/MyProjects"));
const CreateProject = lazy(() => import("./pages/intern/CreateProject"));
const AIAssistant = lazy(() => import("./pages/intern/AIAssistant"));
const ResumeBuilder = lazy(() => import("./pages/intern/ResumeBuilder"));
const MyResume = lazy(() => import("./pages/intern/MyResume"));
const StudentProfile = lazy(() => import("./pages/intern/StudentProfile"));
const Internships = lazy(() => import("./pages/intern/Internships"));
const InternshipProgress = lazy(() => import("./pages/intern/InternshipProgress"));
const Notifications = lazy(() => import("./pages/intern/Notifications"));
const Leaderboard = lazy(() => import("./pages/intern/Leaderboard"));
const Profile = lazy(() => import("./pages/common/Profile"));
const Settings = lazy(() => import("./pages/common/Settings"));
const Community = lazy(() => import("./pages/common/Community"));

const HRDashboard = lazy(() => import("./pages/hr/HRDashboard"));
const HRPrograms = lazy(() => import("./pages/hr/HRPrograms"));
const HRProgramTasks = lazy(() => import("./pages/hr/HRProgramTasks"));
const HRProgramEnroll = lazy(() => import("./pages/hr/HRProgramEnroll"));
const HRSubmissions = lazy(() => import("./pages/hr/HRSubmissions"));
const HRBroadcast = lazy(() => import("./pages/hr/HRBroadcast"));
const HRClientRequirements = lazy(() => import("./pages/hr/HRClientRequirements"));
const HRInterns = lazy(() => import("./pages/hr/HRInterns"));
const HRResumes = lazy(() => import("./pages/hr/HRResumes"));
const HRPostings = lazy(() => import("./pages/hr/HRPostings"));
const HREvaluations = lazy(() => import("./pages/hr/HREvaluations"));
const HRAttendance = lazy(() => import("./pages/hr/HRAttendance"));
const HRInbox = lazy(() => import("./pages/hr/HRInbox"));
const HRTickets = lazy(() => import("./pages/hr/HRTickets"));

const AdminConsole = lazy(() => import("./pages/admin/AdminConsole"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const ContentApproval = lazy(() => import("./pages/admin/ContentApproval"));
const SystemLogs = lazy(() => import("./pages/admin/SystemLogs"));
const AIControl = lazy(() => import("./pages/admin/AIControl"));
const Analytics = lazy(() => import("./pages/admin/Analytics"));
const UIAssets = lazy(() => import("./pages/admin/UIAssets"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const RouteFallback = () => (
  <div className="flex min-h-[60vh] w-full items-center justify-center">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
);

const AppInner = () => {
  useIdleSignOut();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner theme="dark" />
      <BrowserRouter>
        <AuthProvider>
          <AppInner />
          <CookieConsent />
          <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/top-interns" element={<TopInterns />} />
            <Route path="/verify/:code" element={<Verify />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/hr/login" element={<HRLogin />} />

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
              <Route path="/my-resume" element={<MyResume />} />
              <Route path="/my-profile" element={<StudentProfile />} />
              <Route path="/internships" element={<Internships />} />
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
              <Route path="/hr/resumes" element={<HRResumes />} />
              <Route path="/hr/postings" element={<HRPostings />} />
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
              <Route path="/staff/ui-assets" element={<UIAssets />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
