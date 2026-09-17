import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "@/lib/i18n";
import { PublicLayout } from "@/components/layout/PublicLayout";
import {
  ArrowRight,
  Zap,
  Code2,
  Users,
  Shield,
  Rocket,
  GraduationCap,
  Gem,
  CheckCircle2,
  Brain,
  Trophy,
  Flame,
  BarChart3,
  Globe2,
  CreditCard,
  Bell,
  FileText,
  Layers,
  Sparkles,
  TrendingUp,
  Award,
  BookOpen,
  Play,
  MessageSquare,
} from "lucide-react";

const PREVIEW_XP = { current: 3240, total: 4000, percent: 81 };
const PREVIEW_LEADERS = [
  { rank: 1, name: "Maria S.", xp: 4820 },
  { rank: 2, name: "Carlos R.", xp: 4210 },
];
const MOCK_SCHOOLS = [
  { key: 'a', students: 124, courses: 8, tone: 'blue' as const },
  { key: 'b', students: 89, courses: 5, tone: 'purple' as const },
  { key: 'c', students: 312, courses: 14, tone: 'emerald' as const },
  { key: 'd', students: 47, courses: 3, tone: 'amber' as const },
];
const MOCK_SCHOOL_TONES = {
  blue: { wrap: 'bg-blue-900/10 border-blue-800/30', icon: 'bg-blue-500/20 text-blue-400', badge: 'border-blue-800/50 text-blue-400' },
  purple: { wrap: 'bg-purple-900/10 border-purple-800/30', icon: 'bg-purple-500/20 text-purple-400', badge: 'border-purple-800/50 text-purple-400' },
  emerald: { wrap: 'bg-emerald-900/10 border-emerald-800/30', icon: 'bg-emerald-500/20 text-emerald-400', badge: 'border-emerald-800/50 text-emerald-400' },
  amber: { wrap: 'bg-amber-900/10 border-amber-800/30', icon: 'bg-amber-500/20 text-amber-400', badge: 'border-amber-800/50 text-amber-400' },
};

export default function Home() {
  const t = useTranslations("seo.home"); // Or just hardcode for demo, since we don't have the full translations.
  // Using direct text to perfectly match the Next.js visual without a massive JSON.

  const features = [
    { key: 'mdx', icon: Code2, wrap: "bg-blue-500/10 border-blue-500/20", icon_: "text-blue-400", title: "Rich Course Content", desc: "Build courses with MDX, video, and rich interactive components." },
    { key: 'exams', icon: FileText, wrap: "bg-violet-500/10 border-violet-500/20", icon_: "text-violet-400", title: "Exams & Quizzes", desc: "Test knowledge with timed exams and auto-graded quizzes." },
    { key: 'video', icon: Play, wrap: "bg-red-500/10 border-red-500/20", icon_: "text-red-400", title: "Video Hosting", desc: "Securely host and stream video content for your students." },
    { key: 'exercises', icon: Brain, wrap: "bg-purple-500/10 border-purple-500/20", icon_: "text-purple-400", title: "Practice Exercises", desc: "Interactive coding or text exercises graded by AI." },
    { key: 'payments', icon: CreditCard, wrap: "bg-emerald-500/10 border-emerald-500/20", icon_: "text-emerald-400", title: "Global Payments", desc: "Accept Stripe, PayPal, or manual bank transfers globally." },
    { key: 'plans', icon: Layers, wrap: "bg-cyan-500/10 border-cyan-500/20", icon_: "text-cyan-400", title: "Subscriptions", desc: "Sell individual courses, bundles, or monthly recurring access." },
  ];

  const steps = [
    { key: 'create', step: "01", icon: Rocket, title: "Launch your school", desc: "Deploy your branded platform instantly. No coding required." },
    { key: 'build', step: "02", icon: BookOpen, title: "Create courses", desc: "Upload videos, write lessons, and structure your curriculum." },
    { key: 'enroll', step: "03", icon: Users, title: "Enroll students", desc: "Share your link and start accepting payments and enrollments." },
  ];

  return (
    <PublicLayout>
      <div className="flex flex-col min-h-screen bg-[#0A0A0A] overflow-hidden selection:bg-blue-500/30 text-white">
        {/* Background glows */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
          <div className="absolute top-[-10%] right-[-10%] w-[700px] h-[700px] bg-blue-500/8 rounded-full blur-[140px]" />
          <div className="absolute bottom-[30%] left-[-10%] w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-5%] right-[20%] w-[400px] h-[400px] bg-emerald-500/4 rounded-full blur-[100px]" />
        </div>

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-36" aria-labelledby="home-hero-title">
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="flex flex-col items-center text-center max-w-5xl mx-auto space-y-8">
              <Badge
                variant="secondary"
                className="bg-blue-900/20 text-blue-400 border-blue-800/50 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide uppercase flex items-center gap-2"
              >
                <Zap className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                The modern way to teach
              </Badge>

              <h1
                id="home-hero-title"
                className="text-6xl lg:text-8xl font-black tracking-tight text-white leading-[1.05] bg-clip-text text-transparent bg-gradient-to-b from-white via-zinc-200 to-zinc-500"
                style={{ textWrap: "balance" }}
              >
                Online Courses &amp;&nbsp;
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                  Verified Certificates
                </span>
              </h1>

              <p className="text-xl text-zinc-400 max-w-2xl leading-relaxed font-medium" style={{ textWrap: "pretty" }}>
                Launch your own online school, sell courses, and manage students with an all-in-one learning platform built for the modern creator.
              </p>

              <div className="flex flex-wrap gap-4 justify-center pt-2">
                <Link href="/create-school">
                  <Button
                    size="lg"
                    data-testid="button-start-free"
                    className="h-14 px-10 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-lg shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_45px_rgba(37,99,235,0.45)] transition-[box-shadow,background-color] duration-200 active:scale-95"
                  >
                    Start for free
                    <ArrowRight className="ml-2 w-5 h-5" aria-hidden="true" />
                  </Button>
                </Link>
                <Link href="/courses">
                  <Button
                    size="lg"
                    variant="outline"
                    data-testid="button-browse-courses"
                    className="h-14 px-10 bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800/80 rounded-xl text-lg backdrop-blur-sm transition-[background-color,color] duration-200"
                  >
                    Browse courses
                  </Button>
                </Link>
              </div>

              <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 pt-6 border-t border-white/5 w-full" role="list">
                {["No credit card required", "Free plan available", "Custom subdomain", "Open source"].map((chip) => (
                  <li key={chip} className="flex items-center gap-2 text-sm text-zinc-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                    <span>{chip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── For Whom ─────────────────────────────────────────── */}
        <section className="py-28 relative border-t border-white/5">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
              <Badge variant="outline" className="border-zinc-800 text-zinc-400 rounded-full px-4 py-1">
                Built for both sides
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight" style={{ textWrap: "balance" }}>
                A platform that serves everyone
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              <div className="bg-gradient-to-br from-blue-900/20 to-blue-900/5 border border-blue-800/30 rounded-3xl p-8 space-y-6">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                  <GraduationCap className="w-6 h-6 text-blue-400" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">For Schools & Creators</h3>
                  <p className="text-zinc-400 leading-relaxed">Everything you need to run an online academy under your own brand.</p>
                </div>
                <ul className="space-y-2">
                  {['Custom domain & branding', 'Global payment processing', 'AI grading & tutors', 'Detailed analytics'].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-zinc-300">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/create-school">
                  <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl">
                    Create your school
                    <ArrowRight className="ml-2 w-4 h-4" aria-hidden="true" />
                  </Button>
                </Link>
              </div>

              <div className="bg-gradient-to-br from-purple-900/20 to-purple-900/5 border border-purple-800/30 rounded-3xl p-8 space-y-6">
                <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20">
                  <BookOpen className="w-6 h-6 text-purple-400" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">For Students</h3>
                  <p className="text-zinc-400 leading-relaxed">An engaging, distraction-free environment to learn and track your progress.</p>
                </div>
                <ul className="space-y-2">
                  {['Clear progress tracking', '24/7 AI Tutor assistance', 'Gamification & levels', 'Verified certificates'].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-zinc-300">
                      <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/courses">
                  <Button variant="outline" className="border-purple-800/50 bg-purple-900/20 text-purple-300 hover:text-white hover:bg-purple-800/40 rounded-xl">
                    Explore courses
                    <ArrowRight className="ml-2 w-4 h-4" aria-hidden="true" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Gamification Preview ─────────────────────────────────────── */}
        <section className="py-28 relative overflow-hidden">
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
              <div className="space-y-8">
                <Badge variant="secondary" className="bg-amber-900/20 text-amber-400 border-amber-800/50 rounded-full px-4 py-1">
                  <Trophy className="w-3.5 h-3.5 mr-1.5 inline" aria-hidden="true" />
                  Gamified Learning
                </Badge>
                <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight" style={{ textWrap: "balance" }}>
                  Keep students engaged and motivated
                </h2>
                <p className="text-zinc-400 text-lg leading-relaxed">
                  Turn learning into an interactive journey. Reward progress with XP, track daily streaks, and let students compete on the leaderboard.
                </p>
                <ul className="space-y-4" role="list">
                  <li className="flex items-start gap-4">
                    <div className="w-9 h-9 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20 shrink-0 mt-0.5">
                      <Zap className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">Earn Experience</p>
                      <p className="text-zinc-500 text-sm">Students get XP for completing lessons and passing exams.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="w-9 h-9 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20 shrink-0 mt-0.5">
                      <Flame className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">Daily Streaks</p>
                      <p className="text-zinc-500 text-sm">Encourage consistency with streak counters and multipliers.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="w-9 h-9 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20 shrink-0 mt-0.5">
                      <Award className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">Achievements</p>
                      <p className="text-zinc-500 text-sm">Unlock badges for reaching milestones and perfecting quizzes.</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Visual preview */}
              <div className="relative">
                <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-3xl p-6 space-y-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-zinc-400 text-sm font-medium">Your Progress</p>
                    <Badge variant="outline" className="border-amber-800/50 text-amber-400 text-xs">
                      Level 7
                    </Badge>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
                      <span>XP Progress</span>
                      <span>3,240 / 4,000 XP</span>
                    </div>
                    <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full w-[81%]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
                      <p className="text-xs text-zinc-500 mb-1">🔥 Streak</p>
                      <p className="text-white font-bold text-sm tabular-nums">12 Days</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
                      <p className="text-xs text-zinc-500 mb-1">🪙 Coins</p>
                      <p className="text-white font-bold text-sm tabular-nums">840</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
                      <p className="text-xs text-zinc-500 mb-1">🏆 Rank</p>
                      <p className="text-white font-bold text-sm tabular-nums">#3</p>
                    </div>
                  </div>
                  <div className="border-t border-zinc-800 pt-4">
                    <p className="text-xs text-zinc-500 mb-2 font-medium">Top Students</p>
                    <div className="flex items-center justify-between py-1.5 text-sm text-zinc-400">
                      <span>#1 Maria S.</span>
                      <span>4,820 XP</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 text-sm text-zinc-400">
                      <span>#2 Carlos R.</span>
                      <span>4,210 XP</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 text-sm text-amber-400 font-semibold">
                      <span>#3 You</span>
                      <span>3,240 XP</span>
                    </div>
                  </div>
                </div>
                <div className="absolute -inset-8 bg-amber-600/5 rounded-full blur-[80px] -z-10" />
              </div>
            </div>
          </div>
        </section>

        {/* ── Feature Grid ─────────────────────────────────── */}
        <section className="py-28 bg-zinc-900/20 relative">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <Badge variant="outline" className="border-zinc-800 text-zinc-400 rounded-full px-4 py-1">
                Powerful Features
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight" style={{ textWrap: "balance" }}>
                Everything you need to scale
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
              {features.map((f) => (
                <article key={f.key} className="bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-2xl hover:bg-zinc-800/40 hover:border-zinc-700/50 transition-[background-color,border-color] duration-200 group">
                  <div className={`w-10 h-10 ${f.wrap} rounded-xl flex items-center justify-center mb-4 border group-hover:scale-110 transition-transform duration-200`}>
                    <f.icon className={`w-5 h-5 ${f.icon_}`} />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed group-hover:text-zinc-400 transition-colors duration-200">
                    {f.desc}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
        
        {/* ── How It Works ──────────────────────────────────────── */}
        <section className="py-28 relative">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
              <Badge variant="outline" className="border-zinc-800 text-zinc-400 rounded-full px-4 py-1">
                How it works
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight" style={{ textWrap: "balance" }}>
                Start teaching in minutes
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto relative">
              <div className="hidden md:block absolute top-10 left-[33%] right-[33%] h-px bg-gradient-to-r from-blue-500/50 to-blue-500/50 via-blue-500/10" aria-hidden="true" />
              {steps.map((step) => (
                <article key={step.key} className="flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-3xl flex items-center justify-center ring-1 ring-zinc-700/50">
                      <step.icon className="w-8 h-8 text-blue-400" aria-hidden="true" />
                    </div>
                    <span className="absolute -top-2 -right-2 text-xs font-black text-zinc-600 bg-zinc-900 border border-zinc-800 rounded-full w-6 h-6 flex items-center justify-center" aria-hidden="true">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white">{step.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{step.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

      </div>
    </PublicLayout>
  );
}
