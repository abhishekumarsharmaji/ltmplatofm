import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/components/theme-provider';
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
import CourseDetail from './pages/CourseDetail';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Pricing from './pages/Pricing';
import PlatformPricing from './pages/PlatformPricing';
import About from './pages/About';
import Creators from './pages/Creators';
import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';
import UnavailablePage from './pages/UnavailablePage';

// Dashboards
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import StudentDashboard from './pages/dashboard/StudentDashboard';
import CreatorDashboard from './pages/dashboard/CreatorDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Autoscale deployments can briefly return 5xx while the API wakes up.
      // Retry transient failures with a visible loading state instead of
      // immediately replacing the page with an error.
      retry: (failureCount, error) => {
        const status = typeof error === "object" && error !== null && "status" in error
          ? Number(error.status)
          : 0;
        return failureCount < 3 && (status === 0 || status === 429 || status >= 500);
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
    },
  },
});

function Router() {
  const Student = () => <ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>;
  const Creator = () => <ProtectedRoute role="creator"><CreatorDashboard /></ProtectedRoute>;
  const Admin = () => <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>;

  return (
    <RoutedErrorBoundary>
      <Switch>
        {/* Public Routes */}
        <Route path="/" component={Home} />
        <Route path="/courses" component={Courses} />
        <Route path="/courses/:id" component={CourseDetail} />
        <Route path="/products" component={Products} />
        <Route path="/products/:productId" component={ProductDetail} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/platform-pricing" component={PlatformPricing} />
        <Route path="/about" component={About} />
        <Route path="/creators" component={Creators} />
        
        {/* Unavailable features */}
        <Route path="/checkout" component={UnavailablePage} />
        <Route path="/checkout/success" component={UnavailablePage} />
        
        {/* Auth Routes */}
        <Route path="/auth/login" component={Login} />
        <Route path="/auth/sign-up" component={SignUp} />
        
        {/* Dashboard Routes - Support sub-routes via path params */}
        <Route path="/dashboard/student" component={Student} />
        <Route path="/dashboard/student/:section" component={Student} />
        <Route path="/dashboard/student/:section/:id" component={Student} />
        <Route path="/dashboard/student/:section/:id/:action" component={Student} />
        
        <Route path="/dashboard/creator" component={Creator} />
        <Route path="/dashboard/creator/:section" component={Creator} />
        <Route path="/dashboard/creator/:section/:id" component={Creator} />
        <Route path="/dashboard/creator/:section/:id/:action" component={Creator} />
        
        <Route path="/dashboard/admin" component={Admin} />
        <Route path="/dashboard/admin/:section" component={Admin} />
        <Route path="/dashboard/admin/:section/:id" component={Admin} />
        <Route path="/dashboard/admin/:section/:id/:action" component={Admin} />
        
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
  return (
    <ThemeProvider defaultTheme="light" forcedTheme="light">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
