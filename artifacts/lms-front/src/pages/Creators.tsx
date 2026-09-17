import { PublicLayout } from "@/components/layout/PublicLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Video, PenTool, LayoutTemplate, Zap } from "lucide-react";

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
                <Link href="/create-school">
                  <Button size="lg" className="bg-white text-black hover:bg-zinc-200 font-bold rounded-xl h-14 px-8 text-lg">
                    Start your academy
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-2xl rounded-full" />
              <img 
                src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop" 
                alt="Creator recording video" 
                className="relative rounded-3xl border border-zinc-800 object-cover shadow-2xl"
              />
            </div>
          </div>

          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything you need to create</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">Focus on the content. We handle the tech, the hosting, the payments, and the student experience.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { icon: Video, title: "Video Hosting", desc: "Fast, ad-free streaming with adaptive bitrate built in." },
              { icon: PenTool, title: "Rich Editor", desc: "Write lessons in MDX with code blocks and interactivity." },
              { icon: LayoutTemplate, title: "Custom Pages", desc: "Design a beautiful landing page with our drag-and-drop builder." },
              { icon: Zap, title: "Instant Payouts", desc: "Connect Stripe and get paid immediately. No waiting periods." }
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
            <Link href="/create-school">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl h-14 px-10 text-lg">
                Create your school for free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
