import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
import { Globe2, LayoutDashboard, LogOut } from "lucide-react";
import { getGetSessionQueryKey, logout, useGetSession } from "@workspace/api-client-react";

export function Navbar() {
  const t = useTranslations("navbar");
  const { data: session, isPending } = useGetSession();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

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

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        
        {/* Logo + Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center space-x-2">
            <img src="/brand/logo-mark.svg" alt="LMS Platform" className="w-8 h-8 dark:invert" />
            <span className="font-bold text-lg text-foreground tracking-tight">
              LMS Platform
            </span>
          </Link>
        </div>

        {/* Center Links */}
        <div className="hidden md:flex items-center space-x-8">
          <Link href="/courses" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t("courses")}
          </Link>
          <Link href="/platform-pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t("pricing")}
          </Link>
          <Link href="/creators" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t("creators")}
          </Link>
          <Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t("about")}
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="text-muted-foreground" title="Language">
            <Globe2 className="w-4 h-4" />
          </Button>

          {isPending ? (
            <div className="h-9 w-24 rounded-xl bg-muted/60 animate-pulse" aria-hidden="true" />
          ) : user ? (
            <>
              <Link href={dashboardHref}>
                <Button variant="ghost" className="hidden text-muted-foreground hover:text-foreground sm:inline-flex" data-testid="link-dashboard">
                  {t("dashboard")}
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="w-9 h-9 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm shadow-sm ring-2 ring-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={t("accountMenu")}
                    data-testid="button-account-menu"
                  >
                    {userInitial}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-medium text-foreground truncate">{userName}</p>
                    {user.email && <p className="text-xs text-muted-foreground truncate">{user.email}</p>}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setLocation(dashboardHref)} data-testid="menu-dashboard">
                    <LayoutDashboard className="w-4 h-4" />
                    {t("dashboard")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => void handleLogout()} data-testid="menu-logout">
                    <LogOut className="w-4 h-4" />
                    {t("logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" className="hidden text-muted-foreground hover:text-foreground sm:inline-flex">
                  {t("login")}
                </Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button data-testid="link-start-free" className="font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-xl">
                  {t("startFree")} →
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
