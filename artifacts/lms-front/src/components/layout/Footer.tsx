import { Link } from "wouter";
import { useTranslations } from "@/lib/i18n";

const linkClass = "text-[#9794AA] hover:text-white text-[14px] transition-colors";

export function Footer() {
  const t = useTranslations("footer");
  const platformName = "CoreSkils";
  const currentYear = new Date().getFullYear();

  // Only real destinations: every link below resolves to an existing route.
  const columns = [
    {
      title: t("explore"),
      links: [
        { href: "/products", label: t("links.products") },
        { href: "/products/freelancing-client-acquisition-toolkit", label: "Featured toolkit" },
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
    <footer className="bg-[#222222] pt-20 pb-8 text-white">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 mb-16">
          {/* Brand & Description */}
          <div className="md:col-span-4 lg:col-span-5 flex flex-col">
            <Link href="/" className="flex items-center gap-3 mb-6 w-fit">
              <img src={`${import.meta.env.BASE_URL}brand/logo-mark.svg`} alt="" className="w-9 h-9 brightness-0 invert" />
              <span className="text-[32px] font-bold tracking-tight">{platformName}</span>
            </Link>
            <p className="text-[#9794AA] text-[15px] leading-relaxed max-w-sm">
              Practical downloadable digital toolkits with clear product details, electronic delivery terms, and customer support.
            </p>
            <p className="mt-5 text-[13px] leading-6 text-[#B7B4C2]">
              Operated by Abhishek Kumar<br />
              Vadodara, Gujarat 391760, India<br />
              <a href="mailto:growora.org@gmail.com" className="hover:text-white">growora.org@gmail.com</a>
            </p>
          </div>

          {/* Links Columns */}
          <div className="md:col-span-8 lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {columns.map((column) => (
              <div key={column.title} className="flex flex-col">
                <h4 className="text-[16px] font-bold mb-6">{column.title}</h4>
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
        <div className="pt-8 border-t border-[#515151] flex flex-col sm:flex-row justify-between items-center gap-4 text-[13px] text-[#9794AA]">
          <p>{t("copyright", { year: currentYear.toString(), platform: platformName })}</p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/refund-policy" className="hover:text-white">Refunds</Link>
            <Link href="/contact" className="hover:text-white">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
