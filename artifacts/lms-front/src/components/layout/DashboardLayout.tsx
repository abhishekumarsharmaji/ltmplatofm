import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  BookOpen, 
  Settings, 
  LogOut, 
  CreditCard,
  Award,
  Bell,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@workspace/api-client-react";

export function DashboardLayout({ children, role }: { children: ReactNode, role: 'student' | 'teacher' | 'admin' }) {
  const [location, setLocation] = useLocation();

  const links = [
    { href: `/dashboard/${role}`, label: "Dashboard", icon: LayoutDashboard },
    { href: `/dashboard/${role}/courses`, label: "My Courses", icon: BookOpen },
    { href: `/dashboard/${role}/certificates`, label: "Certificates", icon: Award },
    { href: `/dashboard/${role}/billing`, label: "Billing", icon: CreditCard },
  ];

  if (role === 'admin' || role === 'teacher') {
    links.push({ href: `/dashboard/${role}/students`, label: "Students", icon: Users });
  }

  return (
    <div className="min-h-screen flex bg-muted/20 dark">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col hidden md:flex fixed inset-y-0 z-10">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <img src="/brand/logo-mark.svg" alt="LMS Platform" className="w-6 h-6 dark:invert" />
            <span className="font-bold text-foreground">LMS Dashboard</span>
          </Link>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {links.map((link) => {
            const isActive = location === link.href || location.startsWith(link.href + '/');
            return (
              <Link key={link.href} href={link.href}>
                <div className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}>
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </div>
              </Link>
            )
          })}
        </div>

        <div className="p-4 border-t border-border space-y-2">
          <Link href="/dashboard/settings">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer">
              <Settings className="w-4 h-4" />
              Settings
            </div>
          </Link>
          <button
            type="button"
            onClick={async () => {
              await logout();
              setLocation("/auth/login");
            }}
            className="w-full text-left"
            data-testid="button-logout"
          >
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer">
              <LogOut className="w-4 h-4" />
              Log out
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:pl-64 min-h-screen">
        <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-20">
          <h1 className="font-semibold capitalize">{role} Portal</h1>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
              U
            </div>
          </div>
        </header>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
