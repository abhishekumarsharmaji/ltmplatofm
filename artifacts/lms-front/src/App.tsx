import { lazy, Suspense, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/components/theme-provider';
import {
  Route,
  Redirect,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

import { ProtectedRoute } from './components/auth/ProtectedRoute';

const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Courses = lazy(() => import('./pages/Courses'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const CreatorProfile = lazy(() => import('./pages/CreatorProfile'));
const About = lazy(() => import('./pages/About'));
const TermsPage = lazy(() => import('./pages/CompliancePages').then((module) => ({ default: module.TermsPage })));
const PrivacyPage = lazy(() => import('./pages/CompliancePages').then((module) => ({ default: module.PrivacyPage })));
const RefundPage = lazy(() => import('./pages/CompliancePages').then((module) => ({ default: module.RefundPage })));
const DeliveryPage = lazy(() => import('./pages/CompliancePages').then((module) => ({ default: module.DeliveryPage })));
const ContactPage = lazy(() => import('./pages/CompliancePages').then((module) => ({ default: module.ContactPage })));
const Login = lazy(() => import('./pages/auth/Login'));
const SignUp = lazy(() => import('./pages/auth/SignUp'));
const CreatorApplication = lazy(() => import('./pages/CreatorApplication'));
const ZapUpiCheckout = lazy(() => import('./pages/ZapUpiCheckout'));
const UnavailablePage = lazy(() => import('./pages/UnavailablePage'));
const NotFound = lazy(() => import('./pages/not-found'));
const StudentDashboard = lazy(() => import('./pages/dashboard/StudentDashboard'));
const CreatorDashboard = lazy(() => import('./pages/dashboard/CreatorDashboard'));
const AdminDashboard = lazy(() => import('./pages/dashboard/AdminDashboard'));

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
        return failureCount < 2 && (status === 0 || status === 429 || status >= 500);
      },
      retryDelay: (attempt) => Math.min(750 * 2 ** attempt, 2000),
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

function RouteLoading() {
  return (
    <div className="flex min-h-[45vh] items-center justify-center" role="status" aria-label="Loading page">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

function Router() {
  const Student = () => <ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>;
  const Creator = () => <ProtectedRoute role="creator"><CreatorDashboard /></ProtectedRoute>;
  const Admin = () => <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>;

  return (
    <RoutedErrorBoundary>
      <Suspense fallback={<RouteLoading />}>
        <Switch>
        {/* Public Routes */}
        <Route path="/" component={Home} />
        <Route path="/courses" component={Courses} />
        <Route path="/courses/:id" component={CourseDetail} />
        <Route path="/products" component={Products} />
        <Route path="/products/:productId" component={ProductDetail} />
        <Route path="/creators/:username" component={CreatorProfile} />
        <Route path="/pricing"><Redirect to="/products" /></Route>
        <Route path="/platform-pricing"><Redirect to="/products" /></Route>
        <Route path="/about" component={About} />
        <Route path="/creators"><Redirect to="/products" /></Route>
        <Route path="/terms" component={TermsPage} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route path="/refund-policy" component={RefundPage} />
        <Route path="/shipping-delivery" component={DeliveryPage} />
        <Route path="/contact" component={ContactPage} />
        
        <Route path="/checkout/zapupi" component={ZapUpiCheckout} />

        {/* Unavailable legacy features */}
        <Route path="/checkout" component={UnavailablePage} />
        <Route path="/checkout/success" component={UnavailablePage} />
        
        {/* Auth Routes */}
        <Route path="/auth/login" component={Login} />
        <Route path="/auth/sign-up" component={SignUp} />
         <Route path="/creator-application" component={CreatorApplication} />
        
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
      </Suspense>
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
