import { PublicLayout } from "@/components/layout/PublicLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, CheckCircle2, ListVideo, PlayCircle } from "lucide-react";
import { UpgradeCreatorButton } from "@/components/auth/UpgradeCreatorButton";

export default function Creators() {
  return (
    <PublicLayout>
      <div className="bg-[#0A0A0A] min-h-screen text-white pt-24 pb-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
            <div className="space-y-8">
              <Badge variant="outline" className="border-blue-800/50 bg-blue-900/20 text-blue-400 rounded-full px-4 py-1">
                For Independent Educators
              </Badge>
              <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-[1.1]">
                Turn your expertise into a sustainable business
              </h1>
              <p className="text-xl text-zinc-400 leading-relaxed">
                Stop fighting algorithms and algorithmic feeds. Build a premium destination for your biggest fans, own your audience, and keep 100% of your revenue.
              </p>
              <div className="flex gap-4">
                <UpgradeCreatorButton size="lg" className="bg-white text-black hover:bg-zinc-200 font-bold rounded-xl h-14 px-8 text-lg">
                  Create your first course
                </UpgradeCreatorButton>
              </div>
            </div>
            <div className="relative" aria-label="Course builder preview">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-2xl rounded-full" />
              <div className="relative rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl h-[400px] overflow-hidden p-5">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">Course builder</p>
                    <p className="mt-1 font-bold">Complete React Development</p>
                  </div>
                  <Badge className="bg-amber-400/10 text-amber-300 border-amber-400/20">Draft</Badge>
                </div>
                <div className="mt-5 grid grid-cols-[110px_1fr] gap-4">
                  <div className="space-y-2">
                    {["Basics", "Curriculum", "Publish"].map((item, index) => (
                      <div key={item} className={`rounded-lg px-3 py-2 text-xs font-medium ${index === 1 ? "bg-blue-600 text-white" : "text-zinc-500"}`}>
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <ListVideo className="h-4 w-4 text-blue-400" />
                        Section 1 · Getting started
                      </div>
                      <div className="mt-3 space-y-2">
                        {["Welcome & course overview", "Set up your workspace", "Your first component"].map((lesson, index) => (
                          <div key={lesson} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-black/30 px-3 py-2 text-xs text-zinc-300">
                            <span className="flex items-center gap-2"><PlayCircle className="h-3.5 w-3.5 text-zinc-500" />{lesson}</span>
                            {index === 0 && <span className="text-blue-400">Preview</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                      Changes saved
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything you need to create</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">Focus on the content. We handle the tech, the hosting, the payments, and the student experience.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
             {[
               { icon: ListVideo, title: "Structured Curriculum", desc: "Organize your course into ordered sections and focused lessons." },
               { icon: PlayCircle, title: "Lesson Previews", desc: "Choose which lessons students can preview before enrolling." },
               { icon: BookOpen, title: "Course Catalog", desc: "Publish completed courses directly to the learner marketplace." },
               { icon: CheckCircle2, title: "Publish Checklist", desc: "See exactly what is missing before making your course live." }
             ].map((feature, i) => (
              <div key={i} className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-6">
                <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-zinc-400 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-32 bg-zinc-900/50 border border-zinc-800 rounded-3xl p-12 text-center max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Ready to stop renting your audience?</h2>
            <p className="text-zinc-400 mb-8 text-lg">Join thousands of creators who have already made the switch.</p>
            <UpgradeCreatorButton size="lg" className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl h-14 px-10 text-lg">
                Start teaching for free
                <ArrowRight className="ml-2 w-5 h-5" />
            </UpgradeCreatorButton>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
