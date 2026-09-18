import { PublicLayout } from "@/components/layout/PublicLayout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function About() {
  return (
    <PublicLayout>
      <div className="bg-white min-h-screen pt-32 pb-0 lg:pt-40 flex flex-col">
        <div className="container mx-auto px-4 lg:px-8 flex-1 mb-24 lg:mb-36">
          
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-6 mb-16">
              <span className="inline-block bg-[#E4E4E4] text-[#394649] text-[13px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                About Us
              </span>
              <h1 className="text-[48px] sm:text-[60px] leading-[1.1] text-black">
                <span className="font-light block">Empowering creators to</span>
                <span className="font-bold block">share knowledge globally</span>
              </h1>
            </div>
            
            <div className="text-[18px] md:text-[20px] leading-relaxed text-[#4D4D4D] text-center max-w-3xl mx-auto">
              We built this platform because we believe that anyone with knowledge to share should have access to world-class tools to teach, engage, and monetize their audience.
            </div>
            
            <div className="my-16 relative h-[400px] md:h-[500px] rounded-lg overflow-hidden border border-[#E5E5E5] bg-gray-100 shadow-sm">
              <img 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=800&fit=crop" 
                alt="Team collaborating" 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
              <div className="space-y-4">
                <h2 className="text-[32px] font-bold text-black">Our Mission</h2>
                <p className="text-[16px] text-[#394649] leading-relaxed">
                  Our mission is to democratize education technology. Traditional LMS platforms are often clunky, expensive, and difficult to set up. We wanted to create a solution that feels as polished as modern consumer apps, but packs the power needed to run a full-scale online academy.
                </p>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-[32px] font-bold text-black">Why We Are Different</h2>
                <p className="text-[16px] text-[#394649] leading-relaxed">
                  Unlike marketplaces that own your audience, or basic website builders that lack real learning tools, we provide the best of both worlds. You own your data, your brand, and your audience, while giving your students a premium learning experience complete with AI assistance, gamification, and verified certificates.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 my-20">
              <div className="bg-[#515151] rounded-lg py-12 flex flex-col items-center justify-center shadow-sm">
                <div className="text-[46px] font-bold text-primary mb-2 leading-none">10k+</div>
                <div className="font-bold text-white text-[16px] mb-2 uppercase tracking-wider">Active Creators</div>
                <p className="text-[13px] text-gray-300 max-w-[200px] text-center mt-2">Instructors using our platform to teach daily.</p>
              </div>
              <div className="bg-[#515151] rounded-lg py-12 flex flex-col items-center justify-center shadow-sm">
                <div className="text-[46px] font-bold text-primary mb-2 leading-none">2M+</div>
                <div className="font-bold text-white text-[16px] mb-2 uppercase tracking-wider">Students Enrolled</div>
                <p className="text-[13px] text-gray-300 max-w-[200px] text-center mt-2">Learners advancing their careers through our platform.</p>
              </div>
            </div>
            
          </div>
        </div>

        {/* CTA BAND */}
        <section className="bg-[#224EA1] py-20 text-center px-4">
          <div className="max-w-3xl mx-auto flex flex-col items-center">
            <h2 className="text-[40px] md:text-[48px] font-normal text-white mb-6 leading-tight">
              Join the Movement
            </h2>
            <p className="text-white/80 text-[18px] mb-10 max-w-xl">
              Whether you are an independent creator launching your first course, or a large organization looking to migrate your internal training, we have the tools to support you at every scale.
            </p>
            <Link href="/auth/sign-up">
              <Button className="h-[54px] px-10 bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[16px] shadow-[0_10px_24px_rgba(21,207,116,0.35)]">
                Get Started
              </Button>
            </Link>
          </div>
        </section>

      </div>
    </PublicLayout>
  );
}
