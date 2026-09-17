import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BookOpen, Construction, ShieldCheck } from "lucide-react";

const labels: Record<string, string> = {
  courses: "Courses",
  certificates: "Certificates",
  billing: "Billing",
  students: "Students",
  settings: "Settings",
  notifications: "Notifications",
  progress: "Progress",
  community: "Community",
  store: "Store",
  payments: "Payments",
  templates: "Templates",
  revenue: "Revenue",
  analytics: "Analytics",
  users: "Users",
  products: "Products",
  transactions: "Transactions",
  enrollments: "Enrollments",
};

export default function WorkspacePage({ role }: { role: "student" | "teacher" | "admin" }) {
  const [location] = useLocation();
  const segments = location.split("/").filter(Boolean);
  const section = segments[2] ?? "dashboard";
  const title = labels[section] ?? section.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

  return (
    <DashboardLayout role={role}>
      <div className="max-w-5xl mx-auto space-y-6" data-testid={`page-${role}-${section}`}>
        <div>
          <p className="text-sm font-medium text-primary capitalize">{role} workspace</p>
          <h2 className="text-3xl font-bold tracking-tight mt-1">{title}</h2>
          <p className="text-muted-foreground mt-2">Manage {title.toLowerCase()} from your role-based LMS workspace.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-border bg-card p-6">
            <BookOpen className="w-6 h-6 text-blue-500 mb-5" />
            <p className="font-semibold">Learning content</p>
            <p className="text-sm text-muted-foreground mt-2">Course and lesson records are available from the shared LMS catalog.</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <ShieldCheck className="w-6 h-6 text-emerald-500 mb-5" />
            <p className="font-semibold">Role protected</p>
            <p className="text-sm text-muted-foreground mt-2">Only an authenticated {role} session can open this workspace.</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <Construction className="w-6 h-6 text-amber-500 mb-5" />
            <p className="font-semibold">Workspace ready</p>
            <p className="text-sm text-muted-foreground mt-2">Navigation, session checks, and the shared course catalog remain available throughout this section.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}