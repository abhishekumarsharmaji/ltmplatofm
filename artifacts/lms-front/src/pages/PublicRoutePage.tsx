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
      <main className="min-h-screen bg-[#0A0A0A] text-white pt-32 pb-24">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <Link href={isCourse ? "/courses" : "/"} className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="mt-10 rounded-3xl border border-zinc-800 bg-zinc-900/50 p-8 md:p-12">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 grid place-items-center">
              {isCourse ? <BookOpen className="w-6 h-6 text-blue-400" /> : <GraduationCap className="w-6 h-6 text-blue-400" />}
            </div>
            <h1 className="text-4xl md:text-6xl font-black mt-7">{title}</h1>
            <p className="text-zinc-400 text-lg mt-4 max-w-2xl">
              Explore this part of the LMS through the same responsive, tenant-aware experience used across courses, creator storefronts, and learner accounts.
            </p>
            <div className="grid md:grid-cols-3 gap-4 mt-10">
              {["Responsive learning experience", "Tenant-aware platform structure", "Secure account access"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-black/20 p-4 text-sm text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
            <Link href={isCourse ? "/auth/login" : "/courses"}>
              <Button className="mt-10 bg-blue-600 hover:bg-blue-500" data-testid="button-route-primary">
                {isCourse ? "Sign in to learn" : "Browse courses"}
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </PublicLayout>
  );
}