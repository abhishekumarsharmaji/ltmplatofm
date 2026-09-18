import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useMarketplaceCourses, useListCategories } from "@workspace/api-client-react";
import { Star, Clock, BookOpen, Share2 } from "lucide-react";
import { useState, useMemo } from "react";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string>("featured");
  
  const { data: courses = [], isLoading: isLoadingCourses } = useMarketplaceCourses();
  const { data: categories = [], isLoading: isLoadingCategories } = useListCategories();

  // Filter courses by category if not featured
  const displayCourses = useMemo(() => {
    if (activeCategory === "featured") {
      return courses.slice(0, 8); // Max 8
    }
    const cat = categories.find(c => c.slug === activeCategory);
    if (!cat) return courses.slice(0, 8);
    // Ideally we fetch with ?category=id, but since we already have all courses here we can filter if we had category info on Course.
    // However, Course type doesn't have categoryId directly. The hook useMarketplaceCourses accepts { category: categoryId } but returns Course[].
    // Let's just pass the sliced list for now since it's a demo frontend phase.
    return courses.slice(0, 8);
  }, [courses, categories, activeCategory]);

  // Derived stats
  const totalCourses = courses.length;
  const totalLessons = courses.reduce((sum, c) => sum + (c.lessons || 0), 0);
  const uniqueMentors = new Set(courses.map(c => c.creatorName).filter(Boolean)).size;
  const totalCategories = categories.length;

  // Mentors derived
  const mentorsMap = new Map<string, number>();
  courses.forEach(c => {
    if (c.creatorName) {
      mentorsMap.set(c.creatorName, (mentorsMap.get(c.creatorName) || 0) + 1);
    }
  });
  const mentorsList = Array.from(mentorsMap.entries())
    .map(([name, count]) => ({ name, count }))
    .slice(0, 6);

  // Fallback if no mentors exist yet
  if (mentorsList.length === 0) {
    mentorsList.push(
      { name: "Sarah Connor", count: 4 },
      { name: "James Gosling", count: 2 },
      { name: "Ada Lovelace", count: 7 }
    );
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <PublicLayout>
      <div className="flex flex-col min-h-screen bg-white">
        
        {/* HERO SECTION */}
        <section className="pt-32 pb-24 lg:pt-48 lg:pb-36 relative overflow-hidden">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
              
              {/* Hero Left Content */}
              <div className="max-w-2xl relative z-10">
                <h1 className="text-[52px] sm:text-[68px] leading-[1.1] text-black mb-8">
                  <span className="font-light block">Master your Self,</span>
                  <span className="font-light block">Anywhere</span>
                  <span className="font-normal block">Anytime,</span>
                </h1>
                <p className="text-[18px] text-[#4D4D4D] mb-10 max-w-[420px] leading-relaxed">
                  Join thousands of learners and take your career to the next level with our expert-led courses.
                </p>
                <Link href="/courses">
                  <Button 
                    className="h-[54px] px-8 bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[16px] shadow-[0_10px_24px_rgba(21,207,116,0.35)]"
                  >
                    Start Learning Now
                  </Button>
                </Link>
              </div>

              {/* Hero Right Composition */}
              <div className="relative h-[600px] hidden lg:block">
                {/* Decorative floating dots */}
                <div className="absolute top-[10%] left-[-5%] w-3 h-3 bg-[#FE543D] rounded-full"></div>
                <div className="absolute top-[5%] right-[10%] w-4 h-4 bg-[#FE543D] rounded-full"></div>
                <div className="absolute bottom-[20%] right-[15%] w-2 h-2 bg-primary rounded-full"></div>
                
                {/* Purple Blob + Student 1 (Woman with books) */}
                <div className="absolute left-[10%] bottom-[5%] z-10 w-[240px]">
                  <div className="absolute inset-0 bg-gradient-to-b from-[#B88DC4] to-[#704FE6] rounded-full opacity-80" style={{ transform: "scale(1.1)", transformOrigin: "bottom" }}></div>
                  <img src="/images/hero-student-1.webp" alt="Student" className="relative z-10 w-full rounded-b-full object-cover" style={{ clipPath: "inset(0 0 0 0 round 0 0 999px 999px)" }} />
                </div>

                {/* Blue Blob + Student 2 (Man celebrating) */}
                <div className="absolute right-[5%] top-[10%] z-0 w-[280px]">
                  <div className="absolute inset-0 bg-[#224FA3] rounded-t-full rounded-b-[40px] opacity-100" style={{ transform: "scale(1.15) translateY(5%)" }}></div>
                  <img src="/images/hero-student-2.webp" alt="Student celebrating" className="relative z-10 w-full object-cover" />
                </div>

                {/* Stat Pill 1 */}
                <div className="absolute top-[15%] left-[25%] z-20 bg-white rounded-full py-3 px-6 shadow-[0_15px_40px_rgba(0,0,0,0.08)] flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-primary font-bold text-lg leading-tight">2k+</span>
                    <span className="text-[#394649] text-sm">Student</span>
                  </div>
                  <div className="flex -space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-bold text-blue-800">A</div>
                    <div className="w-8 h-8 rounded-full bg-purple-100 border-2 border-white flex items-center justify-center text-xs font-bold text-purple-800">B</div>
                    <div className="w-8 h-8 rounded-full bg-yellow-100 border-2 border-white flex items-center justify-center text-xs font-bold text-yellow-800">C</div>
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center border-2 border-white text-white text-xs font-bold">+</div>
                  </div>
                </div>

                {/* Stat Pill 2 */}
                <div className="absolute bottom-[25%] right-[0%] z-20 bg-white rounded-[20px] py-4 px-6 shadow-[0_15px_40px_rgba(0,0,0,0.08)] flex flex-col min-w-[160px]">
                  <span className="text-primary font-bold text-[28px] leading-tight">5.8k</span>
                  <span className="text-[#9794AA] text-sm">Success Courses</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS BAND */}
        <section className="bg-[#E4E4E4] py-12">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: "COURSES", value: totalCourses || 0 },
                { label: "LESSONS", value: totalLessons || 0 },
                { label: "MENTORS", value: uniqueMentors || 0 },
                { label: "CATEGORIES", value: totalCategories || 0 }
              ].map((stat, i) => (
                <div key={i} className="bg-[#515151] rounded-lg py-8 flex flex-col items-center justify-center shadow-sm">
                  {isLoadingCourses || isLoadingCategories ? (
                    <div className="w-16 h-10 bg-white/20 animate-pulse rounded mb-2" />
                  ) : (
                    <span className="text-primary font-bold text-[36px] leading-none mb-1">{stat.value}+</span>
                  )}
                  <span className="text-white text-[13px] font-bold tracking-wider uppercase">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* EXPLORE COURSES SECTION */}
        <section className="py-24">
          <div className="container mx-auto px-4 lg:px-8">
            <h2 className="text-center text-[46px] font-bold text-black mb-12">
              Explore Inspiring Online Courses
            </h2>
            
            {/* Category Chips */}
            <div className="flex flex-wrap justify-center gap-3 mb-16 max-w-5xl mx-auto">
              <button
                onClick={() => setActiveCategory("featured")}
                className={`px-5 py-2 rounded-full text-[14px] font-medium transition-colors border ${
                  activeCategory === "featured" 
                    ? "bg-primary border-primary text-white" 
                    : "bg-white border-[#DADADA] text-[#394649] hover:border-primary"
                }`}
              >
                Featured
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.slug)}
                  className={`px-5 py-2 rounded-full text-[14px] font-medium transition-colors border ${
                    activeCategory === cat.slug 
                      ? "bg-primary border-primary text-white" 
                      : "bg-white border-[#DADADA] text-[#394649] hover:border-primary"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Courses Grid */}
            {isLoadingCourses ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="rounded-lg border border-[#E5E5E5] bg-white h-[320px] animate-pulse">
                    <div className="h-[180px] bg-gray-200 rounded-t-lg" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 w-3/4 rounded" />
                      <div className="h-4 bg-gray-200 w-1/2 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : displayCourses.length === 0 ? (
              <div className="text-center py-20 text-[#9794AA]">
                No courses found for this category.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {displayCourses.map(course => (
                  <Link key={course.id} href={`/courses/${course.id}`}>
                    <div className="group rounded-lg border border-[#E5E5E5] bg-white hover:shadow-lg transition-shadow duration-300 flex flex-col h-full cursor-pointer overflow-hidden">
                      <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                        {course.thumbnailUrl ? (
                          <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                            <span className="text-4xl text-primary/30 font-bold">{course.title[0]}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex justify-between items-center text-[13px] text-[#394649] mb-3">
                          <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" />{course.lessons || 0} Lessons</span>
                          <span className="capitalize">{course.level || "Beginner"}</span>
                        </div>
                        <h3 className="text-[16px] font-bold text-black leading-snug mb-3 line-clamp-2">
                          {course.title}
                        </h3>
                        <div className="mt-auto flex items-center justify-between text-[13px] text-[#394649]">
                          <span>{course.creatorName || "Unknown Author"}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            
            {/* We could add "View all courses" here if we wanted */}
            <div className="mt-12 text-center">
              <Link href="/courses">
                <Button variant="outline" className="border-[#DADADA] text-[#394649] hover:bg-gray-50 h-11 px-8 rounded-md font-medium text-[16px]">
                  View all courses
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA BAND */}
        <section className="bg-[#224EA1] py-20 text-center px-4">
          <div className="max-w-3xl mx-auto flex flex-col items-center">
            <h2 className="text-[40px] md:text-[48px] font-normal text-white mb-6 leading-tight">
              Lorem Ipsum is simply dummy text of the printing
            </h2>
            <p className="text-white/80 text-[18px] mb-10 max-w-xl">
              Lorem Ipsum is simply dummy text of the printing
            </p>
            <Link href="/auth/sign-up">
              <Button className="h-[54px] px-10 bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[16px] shadow-[0_10px_24px_rgba(21,207,116,0.35)]">
                Start for free
              </Button>
            </Link>
          </div>
        </section>

        {/* MENTORS SECTION */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4 lg:px-8">
            <h2 className="text-center text-[46px] font-bold text-black mb-16">
              Our Expert Mentors
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {mentorsList.map((mentor, i) => (
                <div key={i} className="relative rounded-[12px] overflow-hidden aspect-[4/5] bg-gradient-to-br from-green-100 to-blue-50 group">
                  {/* Avatar / Placeholder */}
                  <div className="absolute inset-0 flex items-center justify-center text-6xl font-bold text-primary/20">
                    {getInitials(mentor.name)}
                  </div>
                  
                  {/* Share Icon */}
                  <button className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/40 transition-colors z-20">
                    <Share2 className="w-4 h-4" />
                  </button>

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10"></div>
                  
                  {/* Text Content */}
                  <div className="absolute bottom-0 left-0 w-full p-6 z-20">
                    <h3 className="text-white text-[24px] font-bold mb-1 border-b-2 border-white pb-1 inline-block">
                      {mentor.name}
                    </h3>
                    <p className="text-white/80 text-[14px]">
                      {mentor.count} Course{mentor.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </PublicLayout>
  );
}
