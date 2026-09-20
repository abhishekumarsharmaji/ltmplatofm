import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { LayoutDashboard, LogOut, Menu, X, ChevronRight } from "lucide-react";
import { getGetSessionQueryKey, logout, useGetSession } from "@workspace/api-client-react";

export function Navbar() {
  const t = useTranslations("navbar");
  const { data: session, isPending } = useGetSession();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const user = session?.authenticated ? session.user : null;
  const dashboardHref = `/dashboard/${user?.role || "student"}`;
  const userName = user?.name || user?.email || "User";
  const userInitial = userName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      toast({ title: t("logoutFailed"), variant: "destructive" });
      return;
    }
    queryClient.setQueryData(getGetSessionQueryKey(), { authenticated: false, user: null });
    setLocation("/");
  };

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      <Link href="/" onClick={onClick} className="block py-3 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900 lg:py-0">
        {t("home")}
      </Link>
      <Link href="/courses" onClick={onClick} className="block py-3 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900 lg:py-0">
        Courses
      </Link>
      <Link href="/products" onClick={onClick} className="block py-3 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900 lg:py-0">
        Digital products
      </Link>
      <Link href="/about" onClick={onClick} className="block py-3 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900 lg:py-0">
        {t("about")}
      </Link>
      <Link href="/contact" onClick={onClick} className="block py-3 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900 lg:py-0">
        Contact
      </Link>
    </>
  );

  return (
    <nav className={`fixed top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md border-b border-slate-200/50 shadow-sm' : 'bg-white/0 border-b border-transparent'}`}>
      <div className="container mx-auto flex h-20 items-center justify-between px-4 lg:px-8 max-w-7xl">
        
        {/* Brand */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2 shrink-0 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <img src={`${import.meta.env.BASE_URL}brand/logo-mark.svg`} alt="CoreSkils" className="w-5 h-5 brightness-0 invert" />
            </div>
            <span className="font-heading font-bold text-xl text-slate-900 tracking-tight hidden sm:block">
              CoreSkils
            </span>
          </Link>
        </div>

        {/* Center Links - Desktop */}
        <div className="hidden lg:flex items-center justify-center absolute left-1/2 -translate-x-1/2 space-x-8">
          <NavLinks />
        </div>

        {/* Right Actions */}
        <div className="flex shrink-0 items-center space-x-4">
          {isPending ? (
            <div className="h-9 w-24 rounded-full bg-slate-100 animate-pulse" aria-hidden="true" />
          ) : user ? (
            <>
              <Link href={dashboardHref}>
                <span className="hidden text-sm font-medium text-slate-600 hover:text-primary transition-colors cursor-pointer sm:inline-block" data-testid="link-dashboard">
                  {t("dashboard")}
                </span>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    aria-label={t("accountMenu")}
                    data-testid="button-account-menu"
                  >
                    {userInitial}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl">
                  <DropdownMenuLabel className="font-normal p-3">
                    <p className="text-sm font-bold text-slate-900 truncate">{userName}</p>
                    {user.email && <p className="text-xs text-slate-500 truncate mt-0.5">{user.email}</p>}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setLocation(dashboardHref)} data-testid="menu-dashboard" className="cursor-pointer py-2.5">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    {t("dashboard")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => void handleLogout()} data-testid="menu-logout" className="cursor-pointer py-2.5 text-red-600 focus:text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    {t("logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="hidden text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900 lg:block">
                {t("login")}
              </Link>
              <Link href="/auth/sign-up" data-testid="link-start-free" className="hidden h-10 items-center justify-center rounded-lg bg-[#0F1C16] px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 hover:-translate-y-0.5 sm:inline-flex group">
                  {t("join")} <ChevronRight className="w-3.5 h-3.5 ml-1 opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </>
          )}

          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 transition-colors" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white p-4 shadow-lg absolute w-full left-0 animate-fade-in-up">
          <div className="flex flex-col pb-4 max-w-sm mx-auto">
            <NavLinks onClick={() => setIsMobileMenuOpen(false)} />
            {!user && (
              <>
                <div className="h-px bg-slate-100 w-full my-4"></div>
                <Link href="/auth/login" className="py-3 text-sm font-semibold text-slate-600" onClick={() => setIsMobileMenuOpen(false)}>
                  {t("login")}
                </Link>
                <Link href="/auth/sign-up" onClick={() => setIsMobileMenuOpen(false)} className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#0F1C16] text-sm font-semibold text-white shadow-sm hover:bg-slate-800">
                    {t("join")}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
