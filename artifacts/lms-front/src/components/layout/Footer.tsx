import { Link } from "wouter";
import { useTranslations } from "@/lib/i18n";
import { Facebook, Instagram, Linkedin, Twitter, Youtube } from "lucide-react";

export function Footer() {
  const t = useTranslations("seo");
  const platformName = "LMS Platform";

  return (
    <footer className="bg-[#222222] pt-20 pb-8 text-white">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 mb-16">
          
          {/* Brand & Description */}
          <div className="md:col-span-4 lg:col-span-5 flex flex-col">
            <h2 className="text-[32px] font-bold tracking-tight mb-6">
              {platformName}
            </h2>
            <p className="text-[#9794AA] text-[15px] leading-relaxed max-w-sm mb-8">
              Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.
            </p>
            <div className="flex items-center gap-3">
              {[
                { icon: Youtube, label: "Youtube" },
                { icon: Facebook, label: "Facebook" },
                { icon: Instagram, label: "Instagram" },
                { icon: Twitter, label: "Twitter" },
                { icon: Linkedin, label: "LinkedIn" }
              ].map((social, i) => (
                <a 
                  key={i} 
                  href="#" 
                  aria-label={social.label}
                  className="w-10 h-10 rounded-full border border-[#515151] flex items-center justify-center text-white hover:bg-primary hover:border-primary transition-colors"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div className="md:col-span-8 lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            
            {/* Explore */}
            <div className="flex flex-col">
              <h4 className="text-[16px] font-bold mb-6">Explore</h4>
              <ul className="space-y-4">
                <li><Link href="/courses" className="text-[#9794AA] hover:text-white text-[14px] transition-colors">Courses</Link></li>
                <li><Link href="/platform-pricing" className="text-[#9794AA] hover:text-white text-[14px] transition-colors">Pricing</Link></li>
                <li><Link href="/creators" className="text-[#9794AA] hover:text-white text-[14px] transition-colors">Creators</Link></li>
                <li><Link href="/about" className="text-[#9794AA] hover:text-white text-[14px] transition-colors">About</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div className="flex flex-col">
              <h4 className="text-[16px] font-bold mb-6">Company</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-[#9794AA] hover:text-white text-[14px] transition-colors">Careers</a></li>
                <li><a href="#" className="text-[#9794AA] hover:text-white text-[14px] transition-colors">Blog</a></li>
                <li><a href="#" className="text-[#9794AA] hover:text-white text-[14px] transition-colors">Press</a></li>
                <li><a href="#" className="text-[#9794AA] hover:text-white text-[14px] transition-colors">Partners</a></li>
                <li><a href="#" className="text-[#9794AA] hover:text-white text-[14px] transition-colors">Newsletter</a></li>
              </ul>
            </div>

            {/* Support */}
            <div className="flex flex-col">
              <h4 className="text-[16px] font-bold mb-6">Support</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-[#9794AA] hover:text-white text-[14px] transition-colors">Help Center</a></li>
                <li><a href="#" className="text-[#9794AA] hover:text-white text-[14px] transition-colors">House Rules</a></li>
                <li><a href="#" className="text-[#9794AA] hover:text-white text-[14px] transition-colors">Content Guidelines</a></li>
              </ul>
            </div>

          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-[#515151] flex flex-col sm:flex-row justify-between items-center gap-4 text-[13px] text-[#9794AA]">
          <p>Copyright © {new Date().getFullYear()} {platformName}, Inc. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Use</a>
            <a href="#" className="hover:text-white transition-colors">Cookies Policy</a>
            <a href="#" className="hover:text-white transition-colors">Preferences</a>
            <a href="#" className="hover:text-white transition-colors">Ethics Line</a>
            <a href="#" className="hover:text-white transition-colors">Accessibility</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
