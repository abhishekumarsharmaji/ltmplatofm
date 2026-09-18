import { PublicLayout } from "@/components/layout/PublicLayout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useMarketplaceCourses, useListCategories } from "@workspace/api-client-react";

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

export default function About() {
  const coursesQuery = useMarketplaceCourses({});
  const categoriesQuery = useListCategories();
  const courses = coursesQuery.data ?? [];
  const statsLoading = coursesQuery.isLoading || categoriesQuery.isLoading;

  // Only stats with a real, non-zero value are shown.
  const stats = [
    {
      value: courses.length,
      label: "Courses",
      caption: "Published courses you can start right now.",
    },
    {
      value: courses.reduce((sum, c) => sum + (c.lessons || 0), 0),
      label: "Lessons",
      caption: "Video lessons across every course.",
    },
    {
      value: (categoriesQuery.data ?? []).length,
      label: "Categories",
      caption: "Topics to explore, from business to design.",
    },
  ].filter((stat) => stat.value > 0);

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
                <span className="font-light block">A marketplace for</span>
                <span className="font-bold block">learning and teaching</span>
              </h1>
            </div>
            
            <div className="text-[18px] md:text-[20px] leading-relaxed text-[#4D4D4D] text-center max-w-3xl mx-auto">
              CoreSkils connects learners with independent instructors. Instructors can create, organize, and publish their own courses, while learners can discover practical knowledge in one accessible marketplace.
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
                <h2 className="text-[32px] font-bold text-black">Our mission</h2>
                <p className="text-[16px] text-[#394649] leading-relaxed">
                  Our mission is to make practical education easier to publish and easier to access. We give independent instructors a structured course platform and give learners a clear way to find, enroll in, and complete courses.
                </p>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-[32px] font-bold text-black">How the marketplace works</h2>
                <p className="text-[16px] text-[#394649] leading-relaxed">
                  Courses on CoreSkils are created and managed by independent instructors. CoreSkils provides the technology for course publishing, structured lessons, learning resources, enrollment, and live classes; each instructor remains responsible for their own course content.
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 my-20" data-testid="about-stats">
              {stats.map((stat) => (
                <div key={stat.label} className="w-[calc(50%-12px)] lg:w-[220px] bg-[#515151] rounded-lg py-10 px-4 flex flex-col items-center justify-center shadow-sm text-center">
                  {statsLoading ? (
                    <div className="h-[46px] w-16 rounded bg-white/10 animate-pulse mb-2" aria-hidden="true" />
                  ) : (
                    <div className="text-[46px] font-bold text-primary mb-2 leading-none">{compact.format(stat.value)}</div>
                  )}
                  <div className="font-bold text-white text-[15px] mb-2 uppercase tracking-wider">{stat.label}</div>
                  <p className="text-[13px] text-gray-300 max-w-[200px] mt-1">{stat.caption}</p>
                </div>
              ))}
            </div>
            
          </div>
        </div>

        {/* CTA BAND */}
        <section className="bg-[#224EA1] py-20 text-center px-4">
          <div className="max-w-3xl mx-auto flex flex-col items-center">
            <h2 className="text-[40px] md:text-[48px] font-normal text-white mb-6 leading-tight">
              Learn or teach on CoreSkils
            </h2>
            <p className="text-white/80 text-[18px] mb-10 max-w-xl">
              Explore courses as a learner, or apply as an instructor to create and publish your own course.
            </p>
            <Link href="/auth/sign-up">
              <Button className="h-[54px] px-10 bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[16px] shadow-[0_10px_24px_rgba(21,207,116,0.35)]">
                Create a free account
              </Button>
            </Link>
          </div>
        </section>

      </div>
    </PublicLayout>
  );
}
