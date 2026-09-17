import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n";
import { Globe2 } from "lucide-react";
import { useGetSession } from "@workspace/api-client-react";

export function Navbar() {
  const t = useTranslations("navbar");
  const { data: session } = useGetSession();

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

          {session?.authenticated ? (
            <Link href={`/dashboard/${session.user?.role || 'student'}`}>
              <Button variant="ghost" className="hidden text-muted-foreground hover:text-foreground sm:inline-flex">
                Dashboard
              </Button>
            </Link>
          ) : (
            <Link href="/auth/login">
              <Button variant="ghost" className="hidden text-muted-foreground hover:text-foreground sm:inline-flex">
                {t("login")}
              </Button>
            </Link>
          )}
          <Link href="/create-school">
            <Button data-testid="link-start-free" className="font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-xl">
              {t("startFree")} →
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
