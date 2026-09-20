import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { 
  LayoutDashboard, 
  BookOpen, 
  Settings, 
  LogOut, 
  CreditCard,
  Award,
  Users,
  Package,
  ShoppingCart,
  Heart,
  BarChart,
  Globe,
  Video,
  Menu,
  X,
  ShieldCheck,
  UserRound
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getGetSessionQueryKey, logout, useGetSession } from "@workspace/api-client-react";

export function DashboardLayout({ children, role }: { children: ReactNode, role: 'student' | 'creator' | 'admin' }) {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getLinks = () => {
    switch (role) {
      case 'student':
        return [
          { href: `/dashboard/student`, label: "Dashboard", icon: LayoutDashboard },
          { href: `/courses`, label: "Browse Courses", icon: Globe },
          { href: `/dashboard/student/library`, label: "My Learning", icon: BookOpen },
          { href: `/dashboard/student/live-classes`, label: "Live Classes", icon: Video },
          { href: `/dashboard/student/products`, label: "Purchased Products", icon: Package },
          { href: `/dashboard/student/orders`, label: "Orders", icon: ShoppingCart },
          { href: `/dashboard/student/wishlist`, label: "Wishlist", icon: Heart },
        ];
      case 'creator':
        return [
          { href: `/dashboard/creator`, label: "Dashboard", icon: LayoutDashboard },
          { href: `/dashboard/creator/courses`, label: "Courses", icon: BookOpen },
          { href: `/dashboard/creator/live-classes`, label: "Live Classes", icon: Video },
          { href: `/dashboard/creator/products`, label: "Digital Products", icon: Package },
          { href: `/dashboard/creator/sales`, label: "Sales & Analytics", icon: BarChart },
          { href: `/dashboard/creator/profile`, label: "Profile", icon: UserRound },
        ];
      case 'admin':
        return [
          { href: `/dashboard/admin`, label: "Dashboard", icon: LayoutDashboard },
          { href: `/dashboard/admin/users`, label: "Users", icon: Users },
          { href: `/dashboard/admin/creators`, label: "Creators", icon: Award },
           { href: `/dashboard/admin/applications`, label: "Applications", icon: ShieldCheck },
          { href: `/dashboard/admin/courses`, label: "Courses", icon: BookOpen },
          { href: `/dashboard/admin/live-classes`, label: "Live Classes", icon: Video },
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
    <div className="min-h-screen flex bg-[#FAFAFA]">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-64 border-r border-[#E5E5E5] bg-white flex flex-col fixed inset-y-0 z-40 md:z-10 transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="h-20 flex items-center justify-between px-6 border-b border-[#E5E5E5]">
          <Link href="/" className="flex items-center gap-2">
            <img src={`${import.meta.env.BASE_URL}brand/logo-mark.svg`} alt="CoreSkils" className="w-8 h-8" />
            <span className="font-bold text-[18px] text-black tracking-tight">CoreSkils {role === 'creator' ? 'Creator' : role === 'admin' ? 'Admin' : 'Student'}</span>
          </Link>
          <button className="md:hidden text-[#394649] p-2" onClick={() => setIsMobileMenuOpen(false)} aria-label="Close menu">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {links.map((link) => {
            const isActive = location === link.href || (link.href !== `/dashboard/${role}` && location.startsWith(link.href + '/'));
            return (
              <Link key={link.href} href={link.href} onClick={() => setIsMobileMenuOpen(false)}>
                <div className={`relative flex items-center gap-3 px-3 py-3 rounded-md text-[15px] font-medium transition-all cursor-pointer mb-1 ${
                  isActive 
                    ? "bg-[#E3F9EF] text-primary" 
                    : "text-[#394649] hover:bg-gray-50 hover:text-primary"
                }`}>
                  {isActive && <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />}
                  <link.icon className="w-[20px] h-[20px]" />
                  {link.label}
                </div>
              </Link>
            )
          })}
        </div>

        <div className="p-4 border-t border-[#E5E5E5] space-y-2 bg-white">
          <button
            type="button"
            onClick={async () => {
              await logout();
              queryClient.setQueryData(getGetSessionQueryKey(), { authenticated: false, user: null });
              setLocation("/auth/login");
            }}
            className="w-full text-left"
            data-testid="button-logout"
          >
            <div className="flex items-center gap-3 px-3 py-3 rounded-md text-[14px] font-medium text-[#E53E3E] hover:bg-red-50 transition-colors cursor-pointer">
              <LogOut className="w-[18px] h-[18px]" />
              Log out
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:pl-64 min-h-screen">
        <header className="h-20 border-b border-[#E5E5E5] bg-white flex items-center justify-between px-4 md:px-8 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-[#394649] p-2" onClick={() => setIsMobileMenuOpen(true)} aria-label="Open menu" aria-expanded={isMobileMenuOpen}>
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="font-bold text-[20px] capitalize text-black hidden sm:block">{role} Portal</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-[14px] font-medium text-[#394649]">{userName}</span>
            <div
              className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-[14px] shadow-[0_4px_10px_rgba(21,207,116,0.2)]"
              aria-hidden="true"
            >
              {userInitial}
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
