import { Link } from "wouter";
import { useTranslations } from "@/lib/i18n";

const linkClass = "text-slate-400 hover:text-white text-sm font-medium transition-colors";

export function Footer() {
  const t = useTranslations("footer");
  const platformName = "CoreSkils";
  const currentYear = new Date().getFullYear();

  const columns = [
    {
      title: t("explore"),
      links: [
        { href: "/products", label: t("links.products") },
        { href: "/about", label: t("links.about") },
      ],
    },
    {
      title: "Customer help",
      links: [
        { href: "/contact", label: "Contact support" },
        { href: "/shipping-delivery", label: "Digital delivery" },
        { href: "/refund-policy", label: "Refund requests" },
      ],
    },
    {
      title: t("account"),
      links: [
        { href: "/auth/login", label: t("links.signIn") },
        { href: "/auth/sign-up", label: t("links.joinFree") },
        { href: "/contact", label: "Account support" },
      ],
    },
    {
      title: "Policies",
      links: [
        { href: "/terms", label: "Terms & Conditions" },
        { href: "/privacy", label: "Privacy Policy" },
        { href: "/refund-policy", label: "Refund & Cancellation" },
        { href: "/shipping-delivery", label: "Shipping & Delivery" },
        { href: "/contact", label: "Contact Us" },
      ],
    },
  ];

  return (
    <footer className="bg-[#0A120E] pt-24 pb-8 text-white relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-8 max-w-7xl relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 lg:gap-12 mb-20">
          {/* Brand & Description */}
          <div className="md:col-span-4 lg:col-span-5 flex flex-col">
            <Link href="/" className="flex items-center gap-3 mb-6 w-fit group">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                <img src={`${import.meta.env.BASE_URL}brand/logo-mark.svg`} alt="" className="w-6 h-6 brightness-0 invert" />
              </div>
              <span className="text-2xl font-heading font-bold tracking-tight">{platformName}</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              The professional platform for digital knowledge. Practical downloadable digital toolkits, courses, and live classes with clear product details, electronic delivery terms, and dedicated customer support.
            </p>
          </div>

          {/* Links Columns */}
          <div className="md:col-span-8 lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {columns.map((column) => (
              <div key={column.title} className="flex flex-col">
                <h4 className="text-base font-bold mb-6 text-slate-200">{column.title}</h4>
                <ul className="space-y-4">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className={linkClass}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500 font-medium">
          <p>{t("copyright", { year: currentYear.toString(), platform: platformName })}</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/refund-policy" className="hover:text-white transition-colors">Refunds</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
