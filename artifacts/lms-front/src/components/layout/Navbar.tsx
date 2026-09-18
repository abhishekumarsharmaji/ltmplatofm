import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Globe2, LayoutDashboard, LogOut, Search, Menu, X } from "lucide-react";
import { getGetSessionQueryKey, logout, useGetSession } from "@workspace/api-client-react";

export function Navbar() {
  const t = useTranslations("navbar");
  const { data: session, isPending } = useGetSession();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/courses?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  const NavLinks = () => (
    <>
      <Link href="/" className="text-[14px] font-medium text-[#4D4D4D] hover:text-primary transition-colors">
        {t("home")}
      </Link>
      <Link href="/courses" className="text-[14px] font-medium text-[#4D4D4D] hover:text-primary transition-colors">
        {t("courses")}
      </Link>
      <Link href="/platform-pricing" className="text-[14px] font-medium text-[#4D4D4D] hover:text-primary transition-colors">
        {t("pricing")}
      </Link>
      <Link href="/creators" className="text-[14px] font-medium text-[#4D4D4D] hover:text-primary transition-colors">
        {t("creators")}
      </Link>
      <Link href="/about" className="text-[14px] font-medium text-[#4D4D4D] hover:text-primary transition-colors">
        {t("about")}
      </Link>
    </>
  );

  return (
    <nav className="fixed top-0 z-50 w-full bg-white border-b border-gray-100">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 lg:px-8">
        
        {/* Left: Logo & Search */}
        <div className="flex items-center gap-8 flex-1">
          <Link href="/" className="flex items-center space-x-2 shrink-0">
            <img src="/brand/logo-mark.svg" alt="LMS Platform" className="w-8 h-8" />
            <span className="font-bold text-xl text-black tracking-tight hidden sm:block">
              LMS Platform
            </span>
          </Link>
          
          <form onSubmit={handleSearch} className="hidden md:flex items-center relative w-full max-w-sm">
            <Input 
              aria-label={t("searchPlaceholder")}
              placeholder={t("searchPlaceholder")}
              className="h-11 pl-5 pr-12 rounded-full border-[#E5E5E5] bg-white text-sm focus-visible:ring-1 focus-visible:ring-primary/50 placeholder:text-[#9794AA]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button 
              type="submit" 
              aria-label="Search"
              className="absolute right-1.5 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white hover:bg-[#10A364] transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Center/Right Links - Desktop */}
        <div className="hidden lg:flex items-center space-x-8">
          <NavLinks />
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-4 ml-8 shrink-0">
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
              <Link href="/auth/login" className="hidden lg:block text-[14px] font-medium text-[#4D4D4D] hover:text-primary transition-colors">
                {t("login")}
              </Link>
              <Link href="/auth/sign-up">
                <Button data-testid="link-start-free" className="hidden sm:inline-flex h-11 px-6 bg-primary hover:bg-[#10A364] text-white font-medium rounded-md shadow-[0_10px_24px_rgba(21,207,116,0.35)] transition-all">
                  {t("join")}
                </Button>
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
          <form onSubmit={handleSearch} className="flex items-center relative w-full md:hidden">
            <Input 
              aria-label={t("searchPlaceholder")}
              placeholder={t("searchPlaceholder")}
              className="h-12 pl-5 pr-12 rounded-full border-[#E5E5E5] bg-white text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button 
              type="submit" 
              aria-label="Search"
              className="absolute right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
          
          <div className="flex flex-col space-y-4 pt-2 pb-4">
            <NavLinks />
            {!user && (
              <>
                <div className="h-px bg-gray-100 w-full my-2"></div>
                <Link href="/auth/login" className="text-[14px] font-medium text-[#4D4D4D]" onClick={() => setIsMobileMenuOpen(false)}>
                  {t("login")}
                </Link>
                <Link href="/auth/sign-up" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full h-11 bg-primary hover:bg-[#10A364] text-white font-medium rounded-md shadow-[0_10px_24px_rgba(21,207,116,0.35)]">
                    {t("join")}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
