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
  Users,
  Package,
  ShoppingCart,
  Heart,
  BarChart,
  Globe,
  Sun,
  Moon,
  Laptop
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout, useGetSession } from "@workspace/api-client-react";
import { useTheme } from "@/components/theme-provider";

export function DashboardLayout({ children, role }: { children: ReactNode, role: 'student' | 'creator' | 'admin' }) {
  const [location, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();

  const getLinks = () => {
    switch (role) {
      case 'student':
        return [
          { href: `/dashboard/student`, label: "Dashboard", icon: LayoutDashboard },
          { href: `/dashboard/student/library`, label: "My Learning", icon: BookOpen },
          { href: `/dashboard/student/products`, label: "Purchased Products", icon: Package },
          { href: `/dashboard/student/orders`, label: "Orders", icon: ShoppingCart },
          { href: `/dashboard/student/wishlist`, label: "Wishlist", icon: Heart },
        ];
      case 'creator':
        return [
          { href: `/dashboard/creator`, label: "Dashboard", icon: LayoutDashboard },
          { href: `/dashboard/creator/courses`, label: "Courses", icon: BookOpen },
          { href: `/dashboard/creator/products`, label: "Digital Products", icon: Package },
          { href: `/dashboard/creator/sales`, label: "Sales & Analytics", icon: BarChart },
        ];
      case 'admin':
        return [
          { href: `/dashboard/admin`, label: "Dashboard", icon: LayoutDashboard },
          { href: `/dashboard/admin/users`, label: "Users", icon: Users },
          { href: `/dashboard/admin/creators`, label: "Creators", icon: Award },
          { href: `/dashboard/admin/courses`, label: "Courses", icon: BookOpen },
          { href: `/dashboard/admin/products`, label: "Products", icon: Package },
          { href: `/dashboard/admin/orders`, label: "Orders", icon: ShoppingCart },
          { href: `/dashboard/admin/categories`, label: "Categories", icon: Globe },
          { href: `/dashboard/admin/settings`, label: "Settings", icon: Settings },
        ];
    }
  };

  const links = getLinks();
  const { data: session } = useGetSession();
  const userName = session?.user?.name || "User";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen flex bg-muted/20">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col hidden md:flex fixed inset-y-0 z-10">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-bold">L</span>
            </div>
            <span className="font-bold text-foreground tracking-tight">LMS {role === 'creator' ? 'Creator' : role === 'admin' ? 'Admin' : 'Student'}</span>
          </Link>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {links.map((link) => {
            const isActive = location === link.href || (link.href !== `/dashboard/${role}` && location.startsWith(link.href + '/'));
            return (
              <Link key={link.href} href={link.href}>
                <div className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
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
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs text-muted-foreground font-medium">Theme</span>
            <div className="flex items-center gap-1 border border-border rounded-lg p-1 bg-muted/50">
              <button onClick={() => setTheme("light")} className={`p-1 rounded ${theme === 'light' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}><Sun className="w-3 h-3" /></button>
              <button onClick={() => setTheme("dark")} className={`p-1 rounded ${theme === 'dark' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}><Moon className="w-3 h-3" /></button>
              <button onClick={() => setTheme("system")} className={`p-1 rounded ${theme === 'system' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}><Laptop className="w-3 h-3" /></button>
            </div>
          </div>
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
          <h1 className="font-semibold capitalize text-foreground">{role} Portal</h1>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
            </Button>
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm shadow-sm ring-2 ring-background">
              {userInitial}
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
