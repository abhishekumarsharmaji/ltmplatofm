import { PublicLayout } from "@/components/layout/PublicLayout";
import { Badge } from "@/components/ui/badge";

export default function About() {
  return (
    <PublicLayout>
      <div className="bg-[#0A0A0A] min-h-screen text-white pt-24 pb-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto space-y-8">
            <Badge variant="outline" className="border-zinc-800 text-zinc-400 rounded-full px-4 py-1">
              About Us
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight" style={{ textWrap: "balance" }}>
              Empowering creators to share knowledge globally
            </h1>
            
            <div className="prose prose-invert prose-lg mt-12 max-w-none text-zinc-300">
              <p className="lead text-xl text-zinc-400">
                We built this platform because we believe that anyone with knowledge to share should have access to world-class tools to teach, engage, and monetize their audience.
              </p>
              
              <div className="my-12 relative h-80 rounded-3xl overflow-hidden border border-zinc-800">
                <img 
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=800&fit=crop" 
                  alt="Team collaborating" 
                  className="w-full h-full object-cover"
                />
              </div>
              
              <h2>Our Mission</h2>
              <p>
                Our mission is to democratize education technology. Traditional LMS platforms are often clunky, expensive, and difficult to set up. We wanted to create a solution that feels as polished as modern consumer apps, but packs the power needed to run a full-scale online academy.
              </p>
              
              <h2>Why We Are Different</h2>
              <p>
                Unlike marketplaces that own your audience, or basic website builders that lack real learning tools, we provide the best of both worlds. You own your data, your brand, and your audience, while giving your students a premium learning experience complete with AI assistance, gamification, and verified certificates.
              </p>
              
              <div className="grid md:grid-cols-2 gap-8 my-12 not-prose">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                  <div className="text-3xl font-black text-blue-400 mb-2">10k+</div>
                  <div className="font-semibold text-white mb-2">Active Schools</div>
                  <p className="text-sm text-zinc-400">Creators and institutions using our platform to teach daily.</p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                  <div className="text-3xl font-black text-purple-400 mb-2">2M+</div>
                  <div className="font-semibold text-white mb-2">Students Enrolled</div>
                  <p className="text-sm text-zinc-400">Learners advancing their careers through our schools.</p>
                </div>
              </div>
              
              <h2>Join the Movement</h2>
              <p>
                Whether you are an independent creator launching your first course, or a large organization looking to migrate your internal training, we have the tools to support you at every scale.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
