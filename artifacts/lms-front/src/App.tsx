import { type ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

// Pages
import Home from './pages/Home';
import Courses from './pages/Courses';
import Pricing from './pages/Pricing';
import PlatformPricing from './pages/PlatformPricing';
import About from './pages/About';
import Creators from './pages/Creators';
import CreateSchool from './pages/CreateSchool';
import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';
import StudentDashboard from './pages/dashboard/StudentDashboard';
import TeacherDashboard from './pages/dashboard/TeacherDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import WorkspacePage from './pages/dashboard/WorkspacePage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import PublicRoutePage from './pages/PublicRoutePage';

const queryClient = new QueryClient();

function Router() {
  const Student = () => <ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>;
  const Teacher = () => <ProtectedRoute role="teacher"><TeacherDashboard /></ProtectedRoute>;
  const Admin = () => <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>;
  const StudentWorkspace = () => <ProtectedRoute role="student"><WorkspacePage role="student" /></ProtectedRoute>;
  const TeacherWorkspace = () => <ProtectedRoute role="teacher"><WorkspacePage role="teacher" /></ProtectedRoute>;
  const AdminWorkspace = () => <ProtectedRoute role="admin"><WorkspacePage role="admin" /></ProtectedRoute>;

  return (
    <RoutedErrorBoundary>
      <Switch>
        {/* Public Routes */}
        <Route path="/" component={Home} />
        <Route path="/courses" component={Courses} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/platform-pricing" component={PlatformPricing} />
        <Route path="/about" component={About} />
        <Route path="/creators" component={Creators} />
        <Route path="/create-school" component={CreateSchool} />
        <Route path="/courses/:id" component={PublicRoutePage} />
        <Route path="/courses/:id/lessons/:lessonId" component={PublicRoutePage} />
        <Route path="/products" component={PublicRoutePage} />
        <Route path="/products/:productId" component={PublicRoutePage} />
        <Route path="/checkout" component={PublicRoutePage} />
        <Route path="/checkout/success" component={PublicRoutePage} />
        <Route path="/verify/:code" component={PublicRoutePage} />
        <Route path="/p/:slug" component={PublicRoutePage} />
        <Route path="/join-school" component={PublicRoutePage} />
        <Route path="/onboarding" component={PublicRoutePage} />
        <Route path="/oauth/consent" component={PublicRoutePage} />
        <Route path="/platform/:rest*" component={PublicRoutePage} />
        
        {/* Auth Routes */}
        <Route path="/auth/login" component={Login} />
        <Route path="/auth/sign-up" component={SignUp} />
        <Route path="/auth/:rest*" component={Login} />
        
        {/* Dashboard Routes */}
        <Route path="/dashboard/student" component={Student} />
        <Route path="/dashboard/teacher" component={Teacher} />
        <Route path="/dashboard/admin" component={Admin} />
        <Route path="/dashboard/student/:rest*" component={StudentWorkspace} />
        <Route path="/dashboard/teacher/:rest*" component={TeacherWorkspace} />
        <Route path="/dashboard/admin/:rest*" component={AdminWorkspace} />
        <Route path="/dashboard/settings" component={StudentWorkspace} />
        <Route path="/dashboard/notifications" component={StudentWorkspace} />
        
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  // Enforce dark mode since the imported marketing site was built as a dark experience
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
