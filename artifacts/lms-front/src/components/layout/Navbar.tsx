import { useState } from "react";
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
import { LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { getGetSessionQueryKey, logout, useGetSession } from "@workspace/api-client-react";

export function Navbar() {
  const t = useTranslations("navbar");
  const { data: session, isPending } = useGetSession();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      <Link href="/" onClick={onClick} className="block py-3 text-[16px] font-semibold text-[#394649] transition-colors hover:text-primary lg:py-0">
        {t("home")}
      </Link>
      <Link href="/courses" onClick={onClick} className="block py-3 text-[16px] font-semibold text-[#394649] transition-colors hover:text-primary lg:py-0">
        {t("courses")}
      </Link>
      <Link href="/products" onClick={onClick} className="block py-3 text-[16px] font-semibold text-[#394649] transition-colors hover:text-primary lg:py-0">
        Digital products
      </Link>
      <Link href="/about" onClick={onClick} className="block py-3 text-[16px] font-semibold text-[#394649] transition-colors hover:text-primary lg:py-0">
        {t("about")}
      </Link>
      <Link href="/contact" onClick={onClick} className="block py-3 text-[16px] font-semibold text-[#394649] transition-colors hover:text-primary lg:py-0">
        Contact
      </Link>
    </>
  );

  return (
    <nav className="fixed top-0 z-50 w-full bg-white border-b border-gray-100">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 lg:px-8">
        
        {/* Brand */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2 shrink-0">
            <img src={`${import.meta.env.BASE_URL}brand/logo-mark.svg`} alt="CoreSkils" className="w-8 h-8" />
            <span className="font-bold text-xl text-black tracking-tight hidden sm:block">
              CoreSkils
            </span>
          </Link>
        </div>

        {/* Center/Right Links - Desktop */}
        <div className="hidden items-center space-x-9 lg:flex">
          <NavLinks />
        </div>

        {/* Right Actions */}
        <div className="ml-6 flex shrink-0 items-center space-x-4 lg:ml-8">
          {isPending ? (
            <div className="h-9 w-24 rounded-full bg-muted animate-pulse" aria-hidden="true" />
          ) : user ? (
            <>
              <Link href={dashboardHref}>
                <span className="hidden text-[14px] font-medium text-[#4D4D4D] hover:text-primary transition-colors cursor-pointer sm:inline-block" data-testid="link-dashboard">
                  {t("dashboard")}
                </span>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white hover:bg-[#10A364] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={t("accountMenu")}
                    data-testid="button-account-menu"
                  >
                    {userInitial}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2">
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-medium text-foreground truncate">{userName}</p>
                    {user.email && <p className="text-xs text-muted-foreground truncate">{user.email}</p>}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setLocation(dashboardHref)} data-testid="menu-dashboard" className="cursor-pointer">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    {t("dashboard")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => void handleLogout()} data-testid="menu-logout" className="cursor-pointer text-red-600 focus:text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    {t("logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="hidden text-[16px] font-semibold text-[#394649] transition-colors hover:text-primary lg:block">
                {t("login")}
              </Link>
              <Link href="/auth/sign-up" data-testid="link-start-free" className="hidden h-12 items-center justify-center rounded-md bg-primary px-8 text-[16px] font-semibold text-white shadow-[0_10px_24px_rgba(21,207,116,0.35)] transition-all hover:bg-[#10A364] sm:inline-flex">
                  {t("join")}
              </Link>
            </>
          )}

          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden p-2 text-[#4D4D4D]" 
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
        <div className="lg:hidden border-t border-gray-100 bg-white p-4 space-y-4 shadow-lg absolute w-full left-0">
          <div className="flex flex-col pb-4">
            <NavLinks onClick={() => setIsMobileMenuOpen(false)} />
            {!user && (
              <>
                <div className="h-px bg-gray-100 w-full my-2"></div>
                <Link href="/auth/login" className="py-3 text-[16px] font-semibold text-[#394649]" onClick={() => setIsMobileMenuOpen(false)}>
                  {t("login")}
                </Link>
                <Link href="/auth/sign-up" onClick={() => setIsMobileMenuOpen(false)} className="inline-flex h-12 w-full items-center justify-center rounded-md bg-primary text-[16px] font-semibold text-white shadow-[0_10px_24px_rgba(21,207,116,0.35)] hover:bg-[#10A364]">
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
