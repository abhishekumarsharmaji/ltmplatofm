import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useMarketplaceCourses, useListCategories } from "@workspace/api-client-react";
import { Star, Clock, BookOpen, Share2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useTranslations } from "@/lib/i18n";
import { CourseThumbnail } from "@/components/courses/CourseThumbnail";

export default function Home() {
  const t = useTranslations("home");
  const [activeCategory, setActiveCategory] = useState<string>("featured");
  
  const { data: courses = [], isLoading: isLoadingCourses } = useMarketplaceCourses();
  const { data: categories = [], isLoading: isLoadingCategories } = useListCategories();

  const activeCategoryId = categories.find(c => c.slug === activeCategory)?.id;
  const displayCourses = useMemo(() => {
    const source = activeCategoryId ? courses.filter((course) => course.categoryId === activeCategoryId) : courses;
    return source.slice(0, 8); // Max 8
  }, [courses, activeCategoryId]);
  const isLoadingDisplay = isLoadingCourses;

  const { totalCourses, totalLessons, uniqueMentors, mentorsList } = useMemo(() => {
    const mentors = new Map<string, number>();
    let lessons = 0;
    for (const course of courses) {
      lessons += course.lessons || 0;
      if (course.creatorName) mentors.set(course.creatorName, (mentors.get(course.creatorName) || 0) + 1);
    }
    return {
      totalCourses: courses.length,
      totalLessons: lessons,
      uniqueMentors: mentors.size,
      mentorsList: Array.from(mentors.entries()).map(([name, count]) => ({ name, count })).slice(0, 6),
    };
  }, [courses]);
  const totalCategories = categories.length;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const isLoading = isLoadingCourses || isLoadingCategories;

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
                <Link href="/courses" className="h-[54px] px-8 bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[16px] shadow-[0_10px_24px_rgba(21,207,116,0.35)] inline-flex items-center justify-center">
                    {t("hero.startLearning")}
                </Link>
              </div>

              {/* Hero Right Composition */}
              <div className="relative h-[600px] hidden lg:block">
                {/* Decorative floating dots */}
                <div className="absolute top-[24%] left-[-4%] w-3 h-3 bg-[#FE543D] rounded-full"></div>
                <div className="absolute top-[6%] right-[4%] w-4 h-4 bg-[#FE543D] rounded-full"></div>
                <div className="absolute bottom-[4%] right-[22%] w-2.5 h-2.5 bg-primary rounded-full"></div>
                
                {/* AI technology visual */}
                <div className="absolute inset-x-[2%] top-[5%] bottom-[2%] z-0 flex items-center justify-center">
                  <div className="absolute inset-[10%] rounded-full bg-[radial-gradient(circle,rgba(21,207,116,0.22)_0%,rgba(76,224,214,0.10)_45%,transparent_72%)] blur-2xl" />
                  <div className="absolute inset-[4%] rounded-[48px] border border-emerald-100/70 bg-[linear-gradient(rgba(21,207,116,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(21,207,116,0.05)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(circle_at_center,black,transparent_76%)]" />
                  <img
                    src={`${import.meta.env.BASE_URL}images/hero-ai-technology.webp`}
                    alt="AI technology platform with a neural network and intelligent data systems"
                    width="1100"
                    height="1100"
                    fetchPriority="high"
                    decoding="async"
                    className="relative z-10 h-full w-full object-contain mix-blend-multiply drop-shadow-[0_28px_55px_rgba(17,94,75,0.16)]"
                  />
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
            {isLoadingDisplay ? (
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
                        <CourseThumbnail src={course.thumbnailUrl} title={course.title} className="transition-transform duration-500 group-hover:scale-105" />
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
              <Link href="/courses" className="border border-[#DADADA] text-[#394649] hover:bg-gray-50 h-11 px-8 rounded-md font-medium text-[16px] inline-flex items-center justify-center">
                  {t("courses.viewAll")}
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
            <Link href="/auth/sign-up" className="h-[54px] px-10 bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[16px] shadow-[0_10px_24px_rgba(21,207,116,0.35)] inline-flex items-center justify-center">
                {t("cta.button")}
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
                    <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/40 transition-colors z-20">
                      <Share2 className="w-5 h-5" />
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
