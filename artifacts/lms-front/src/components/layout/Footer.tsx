import { Link } from "wouter";
import { useTranslations } from "@/lib/i18n";

export function Footer() {
  const t = useTranslations("seo");
  const platformName = "LMS Platform";

  return (
    <footer className="border-t border-border bg-muted/50 py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <h3 className="font-bold text-lg mb-4 text-foreground">{platformName}</h3>
            <p className="text-muted-foreground text-sm">
              {t("defaultDescription")}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/courses" className="hover:text-foreground transition-colors">
                  Courses
                </Link>
              </li>
              <li>
                <Link href="/platform-pricing" className="hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/creators" className="hover:text-foreground transition-colors">
                  For Creators
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-foreground transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/create-school" className="hover:text-foreground transition-colors">
                  Create a School
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} {platformName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
