import { Link, useLocation } from "wouter";
import { ArrowLeft, BookOpen, CheckCircle2, GraduationCap } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";

export default function PublicRoutePage() {
  const [location] = useLocation();
  const parts = location.split("/").filter(Boolean);
  const section = parts[0] ?? "courses";
  const isCourse = section === "courses";
  const title = isCourse
    ? `Course ${parts[1] ?? ""}`.trim()
    : section.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

  return (
    <PublicLayout>
      <main className="min-h-screen bg-white text-black pt-32 pb-24">
        <div className="container mx-auto px-4 md:px-8 max-w-5xl">
          <Link href={isCourse ? "/courses" : "/"} className="inline-flex items-center gap-2 text-[14px] font-medium text-[#394649] hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="mt-10 rounded-lg border border-[#E5E5E5] bg-white p-8 md:p-12 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-8">
              {isCourse ? <BookOpen className="w-8 h-8 text-primary" /> : <GraduationCap className="w-8 h-8 text-primary" />}
            </div>
            <h1 className="text-[40px] md:text-[46px] font-bold text-black leading-[1.1] mb-6">{title}</h1>
            <p className="text-[#394649] text-[18px] max-w-2xl leading-relaxed">
              Explore this part of the LMS through the same responsive, tenant-aware experience used across courses, creator storefronts, and learner accounts.
            </p>
            <div className="grid md:grid-cols-3 gap-4 mt-12">
              {["Responsive learning experience", "Tenant-aware platform structure", "Secure account access"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-lg border border-[#E5E5E5] bg-[#F8F9FA] p-4 text-[14px] text-[#394649]">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  {item}
                </div>
              ))}
            </div>
            <Link href={isCourse ? "/auth/login" : "/courses"}>
              <Button className="mt-12 h-[54px] px-10 bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[16px] shadow-[0_10px_24px_rgba(21,207,116,0.35)]" data-testid="button-route-primary">
                {isCourse ? "Sign in to learn" : "Browse courses"}
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </PublicLayout>
  );
}