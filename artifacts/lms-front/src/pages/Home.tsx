import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useMarketplaceCourses, useListCategories } from "@workspace/api-client-react";
import { Star, Clock, BookOpen, Share2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useTranslations } from "@/lib/i18n";

export default function Home() {
  const t = useTranslations("home");
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const compactFormatter = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1
  });

  const isLoading = isLoadingCourses || isLoadingCategories;

  // Pill 1: Mentors / Categories
  let pill1Label = "";
  let pill1Value = "";
  let pill1Avatars: string[] = [];

  if (uniqueMentors > 0) {
    pill1Value = compactFormatter.format(uniqueMentors);
    pill1Label = uniqueMentors === 1 ? t("hero.pills.mentor") as string : t("hero.pills.mentors") as string;
    pill1Avatars = mentorsList.slice(0, 3).map(m => getInitials(m.name));
  } else {
    pill1Value = compactFormatter.format(totalCategories);
    pill1Label = totalCategories === 1 ? t("hero.pills.category") as string : t("hero.pills.categories") as string;
  }

  // Pill 2: Lessons / Courses
  let pill2Label = "";
  let pill2Value = "";

  if (totalLessons > 0) {
    pill2Value = compactFormatter.format(totalLessons);
    pill2Label = totalLessons === 1 ? t("hero.pills.lesson") as string : t("hero.pills.lessons") as string;
  } else {
    pill2Value = compactFormatter.format(totalCourses);
    pill2Label = totalCourses === 1 ? t("hero.pills.course") as string : t("hero.pills.courses") as string;
  }

  return (
    <PublicLayout>
      <div className="flex flex-col min-h-screen bg-white">
        
        {/* HERO SECTION */}
        <section className="pt-28 pb-16 lg:pt-36 lg:pb-20 relative overflow-hidden">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
              
              {/* Hero Left Content */}
              <div className="max-w-2xl relative z-10">
                <h1 className="text-[52px] sm:text-[68px] leading-[1.1] text-black mb-8">
                  <span className="font-light block">{t("hero.title1")}</span>
                  <span className="font-light block">{t("hero.title2")}</span>
                  <span className="font-normal block">{t("hero.title3")}</span>
                </h1>
                <p className="text-[18px] text-[#4D4D4D] mb-10 max-w-[420px] leading-relaxed">
                  {t("hero.subtitle")}
                </p>
                <Link href="/courses">
                  <Button 
                    className="h-[54px] px-8 bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[16px] shadow-[0_10px_24px_rgba(21,207,116,0.35)]"
                  >
                    {t("hero.startLearning")}
                  </Button>
                </Link>
              </div>

              {/* Hero Right Composition */}
              <div className="relative h-[600px] hidden lg:block">
                {/* Decorative floating dots */}
                <div className="absolute top-[24%] left-[-4%] w-3 h-3 bg-[#FE543D] rounded-full"></div>
                <div className="absolute top-[6%] right-[4%] w-4 h-4 bg-[#FE543D] rounded-full"></div>
                <div className="absolute bottom-[4%] right-[22%] w-2.5 h-2.5 bg-primary rounded-full"></div>
                
                {/* Purple pill + Student 1 (Woman with books) */}
                <div className="absolute left-[8%] bottom-[6%] z-10 w-[250px] aspect-[371/900] max-h-[86%]">
                  <div className="absolute inset-x-[-14%] top-[6%] bottom-0 bg-gradient-to-b from-[#B88DC4] to-[#704FE6] rounded-full"></div>
                  <img
                    src={`${import.meta.env.BASE_URL}images/hero-student-1.webp`}
                    alt="Student holding books"
                    className="relative z-10 h-full w-full object-contain object-bottom"
                    style={{ clipPath: "inset(0 -14% 0 -14% round 0 0 999px 999px)" }}
                  />
                </div>

                {/* Blue pill + Student 2 (Man celebrating) */}
                <div className="absolute right-[4%] top-[8%] z-0 w-[330px] aspect-[576/900] max-h-[84%]">
                  <div className="absolute inset-x-0 top-[10%] bottom-0 bg-[#224FA3] rounded-t-full rounded-b-[56px]"></div>
                  <img
                    src={`${import.meta.env.BASE_URL}images/hero-student-2.webp`}
                    alt="Student celebrating"
                    className="relative z-10 h-full w-full object-contain object-bottom"
                    style={{ clipPath: "inset(0 0 0 0 round 0 0 56px 56px)" }}
                  />
                </div>

                {/* Stat Pill 1 */}
                <div className="absolute top-[12%] left-[-6%] z-20 bg-white rounded-full py-3 px-6 shadow-[0_15px_40px_rgba(0,0,0,0.08)] flex items-center gap-3">
                  {isLoading ? (
                    <div className="flex items-center gap-3 w-[140px]">
                      <div className="flex flex-col gap-1 w-12">
                        <div className="h-5 bg-gray-100 animate-pulse rounded"></div>
                        <div className="h-3 bg-gray-100 animate-pulse rounded"></div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse ml-auto"></div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col">
                        <span className="text-primary font-bold text-lg leading-tight">{pill1Value}</span>
                        <span className="text-[#394649] text-sm">{pill1Label}</span>
                      </div>
                      {pill1Avatars.length > 0 && (
                        <div className="flex -space-x-3">
                          {pill1Avatars.map((initials, idx) => (
                            <div key={idx} className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white
                              ${idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-purple-500' : 'bg-orange-500'}
                            `}>
                              {initials}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Stat Pill 2 */}
                <div className="absolute bottom-[14%] right-[-2%] z-20 bg-white rounded-[20px] py-4 px-6 shadow-[0_15px_40px_rgba(0,0,0,0.08)] flex flex-col min-w-[160px]">
                  {isLoading ? (
                    <>
                      <div className="h-8 bg-gray-100 animate-pulse rounded w-16 mb-2"></div>
                      <div className="h-4 bg-gray-100 animate-pulse rounded w-24"></div>
                    </>
                  ) : (
                    <>
                      <span className="text-primary font-bold text-[28px] leading-tight">{pill2Value}</span>
                      <span className="text-[#9794AA] text-sm">{pill2Label}</span>
                    </>
                  )}
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
                { label: t("stats.courses"), value: totalCourses || 0 },
                { label: t("stats.lessons"), value: totalLessons || 0 },
                { label: t("stats.mentors"), value: uniqueMentors || 0 },
                { label: t("stats.categories"), value: totalCategories || 0 }
              ].map((stat, i) => (
                <div key={i} className="bg-[#515151] rounded-lg py-8 flex flex-col items-center justify-center shadow-sm">
                  {isLoading ? (
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
              {t("courses.title")}
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
                {t("courses.featured")}
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
                {t("courses.empty")}
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
                          <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" />{course.lessons || 0} {t("courses.lessons")}</span>
                          <span className="capitalize">{course.level || t("courses.beginner")}</span>
                        </div>
                        <h3 className="text-[16px] font-bold text-black leading-snug mb-3 line-clamp-2">
                          {course.title}
                        </h3>
                        <div className="mt-auto flex items-center justify-between text-[13px] text-[#394649]">
                          <span>{course.creatorName || t("courses.unknownAuthor")}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            
            <div className="mt-12 text-center">
              <Link href="/courses">
                <Button variant="outline" className="border-[#DADADA] text-[#394649] hover:bg-gray-50 h-11 px-8 rounded-md font-medium text-[16px]">
                  {t("courses.viewAll")}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA BAND */}
        <section className="bg-[#224EA1] py-20 text-center px-4">
          <div className="max-w-3xl mx-auto flex flex-col items-center">
            <h2 className="text-[40px] md:text-[48px] font-normal text-white mb-6 leading-tight">
              {t("cta.title1")}<br />{t("cta.title2")}
            </h2>
            <p className="text-white/80 text-[18px] mb-10 max-w-xl">
              {t("cta.subtitle")}
            </p>
            <Link href="/auth/sign-up">
              <Button className="h-[54px] px-10 bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[16px] shadow-[0_10px_24px_rgba(21,207,116,0.35)]">
                {t("cta.button")}
              </Button>
            </Link>
          </div>
        </section>

        {/* MENTORS SECTION */}
        {mentorsList.length > 0 && (
          <section className="py-24 bg-white">
            <div className="container mx-auto px-4 lg:px-8">
              <h2 className="text-center text-[46px] font-bold text-black mb-16">
                {t("mentors.title")}
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
                        {mentor.count === 1 ? (t("mentors.subtitleSingle", { count: mentor.count }) as string) : (t("mentors.subtitlePlural", { count: mentor.count }) as string)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

      </div>
    </PublicLayout>
  );
}
