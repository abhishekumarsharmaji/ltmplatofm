import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, CheckCircle2, ListVideo, PlayCircle } from "lucide-react";
import { UpgradeCreatorButton } from "@/components/auth/UpgradeCreatorButton";

export default function Creators() {
  return (
    <PublicLayout>
      <div className="bg-white min-h-screen pt-32 pb-0 lg:pt-40 flex flex-col">
        <div className="container mx-auto px-4 lg:px-8 flex-1 mb-24 lg:mb-36">
          
          {/* HERO SECTION */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-32">
            <div className="max-w-2xl relative z-10">
              <span className="inline-block bg-[#E4E4E4] text-[#394649] text-[13px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-8">
                For Independent Educators
              </span>
              <h1 className="text-[48px] sm:text-[60px] leading-[1.1] text-black mb-8">
                <span className="font-light block">Turn your expertise</span>
                <span className="font-light block">into a sustainable</span>
                <span className="font-bold block">business</span>
              </h1>
              <p className="text-[18px] text-[#4D4D4D] leading-relaxed mb-10 max-w-xl">
                Stop fighting algorithms and algorithmic feeds. Build a premium destination for your biggest fans, own your audience, and keep 100% of your revenue.
              </p>
              <UpgradeCreatorButton size="lg" className="h-[54px] px-8 bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[16px] shadow-[0_10px_24px_rgba(21,207,116,0.35)]">
                Create your first course
              </UpgradeCreatorButton>
            </div>
            
            <div className="relative" aria-label="Course builder preview">
              <div className="relative rounded-lg border border-[#E5E5E5] bg-white shadow-[0_20px_40px_rgba(0,0,0,0.06)] h-[450px] overflow-hidden p-6">
                <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4">
                  <div>
                    <p className="text-[12px] font-bold uppercase tracking-wider text-[#9794AA]">Course builder</p>
                    <p className="mt-1 font-bold text-black text-[18px]">Complete React Development</p>
                  </div>
                  <span className="bg-amber-50 text-amber-600 text-[12px] font-medium px-3 py-1 rounded-full border border-amber-200">Draft</span>
                </div>
                <div className="mt-6 grid grid-cols-[120px_1fr] gap-6">
                  <div className="space-y-2">
                    {["Basics", "Curriculum", "Publish"].map((item, index) => (
                      <div key={item} className={`rounded-md px-3 py-2 text-[14px] font-medium ${index === 1 ? "bg-primary text-white" : "text-[#4D4D4D] hover:bg-gray-50"}`}>
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-lg border border-[#E5E5E5] bg-[#F8F9FA] p-5">
                      <div className="flex items-center gap-2 text-[15px] font-bold text-black mb-4">
                        <ListVideo className="h-5 w-5 text-[#9794AA]" />
                        Section 1 · Getting started
                      </div>
                      <div className="space-y-3">
                        {["Welcome & course overview", "Set up your workspace", "Your first component"].map((lesson, index) => (
                          <div key={lesson} className="flex items-center justify-between rounded-md border border-[#E5E5E5] bg-white px-4 py-3 text-[14px] text-[#394649] shadow-sm">
                            <span className="flex items-center gap-2"><PlayCircle className="h-4 w-4 text-[#9794AA]" />{lesson}</span>
                            {index === 0 && <span className="text-primary text-[12px] font-medium">Preview</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[13px] text-primary font-medium">
                      <CheckCircle2 className="h-4 w-4" />
                      Changes saved
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mb-16">
            <h2 className="text-[46px] font-bold text-black mb-6">Everything you need to create</h2>
            <p className="text-[18px] text-[#4D4D4D] max-w-2xl mx-auto">Focus on the content. We handle the tech, the hosting, the payments, and the student experience.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
             {[
               { icon: ListVideo, title: "Structured Curriculum", desc: "Organize your course into ordered sections and focused lessons." },
               { icon: PlayCircle, title: "Lesson Previews", desc: "Choose which lessons students can preview before enrolling." },
               { icon: BookOpen, title: "Course Catalog", desc: "Publish completed courses directly to the learner marketplace." },
               { icon: CheckCircle2, title: "Publish Checklist", desc: "See exactly what is missing before making your course live." }
             ].map((feature, i) => (
              <div key={i} className="bg-white border border-[#E5E5E5] rounded-lg p-8 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-[#E4E4E4] rounded-full flex items-center justify-center mb-6">
                  <feature.icon className="w-5 h-5 text-[#394649]" />
                </div>
                <h3 className="font-bold text-[18px] text-black mb-3">{feature.title}</h3>
                <p className="text-[#4D4D4D] text-[14px] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>

        </div>
        
        {/* CTA BAND */}
        <section className="bg-[#224EA1] py-20 text-center px-4">
          <div className="max-w-3xl mx-auto flex flex-col items-center">
            <h2 className="text-[40px] md:text-[48px] font-normal text-white mb-6 leading-tight">
              Ready to stop renting <br />your audience?
            </h2>
            <p className="text-white/80 text-[18px] mb-10 max-w-xl">
              Join thousands of creators who have already made the switch.
            </p>
            <UpgradeCreatorButton size="lg" className="h-[54px] px-10 bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[16px] shadow-[0_10px_24px_rgba(21,207,116,0.35)] flex items-center gap-2">
              Start teaching for free
              <ArrowRight className="w-5 h-5" />
            </UpgradeCreatorButton>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
