import { useParams, Link, useLocation } from "wouter";
import { PublicLayout } from "@/components/layout/PublicLayout";
import {
  useGetMarketplaceCourse,
  useEnrollInCourse,
  useGetSession,
  useStudentLibrary,
  getGetMarketplaceCourseQueryKey,
  getStudentLibraryQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, CheckCircle2, Clock, Play, AlertCircle, MonitorPlay, Infinity, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CourseThumbnail } from "@/components/courses/CourseThumbnail";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function CourseDetail() {
  const params = useParams();
  const courseId = params.id ? parseInt(params.id) : 0;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: session } = useGetSession();
  const { data: library } = useStudentLibrary({
    query: { enabled: session?.authenticated === true, queryKey: getStudentLibraryQueryKey() }
  });
  const enroll = useEnrollInCourse();

  const { data: course, isLoading, isError } = useGetMarketplaceCourse(courseId, {
    query: { enabled: !!courseId, queryKey: getGetMarketplaceCourseQueryKey(courseId) }
  });
  const isEnrolled = library?.some((item: any) => item.course?.id === courseId) ?? false;

  const handleEnroll = () => {
    if (!session?.authenticated) {
      setLocation("/auth/login");
      return;
    }

    enroll.mutate({ courseId }, {
      onSuccess: (result) => {
        if (result.alreadyEnrolled) {
          setLocation("/dashboard/student/library");
        } else {
          toast({
            title: "Enrollment successful",
            description: "You have successfully enrolled in this course for free."
          });
          queryClient.invalidateQueries({ queryKey: getGetMarketplaceCourseQueryKey(courseId) });
          queryClient.invalidateQueries({ queryKey: getStudentLibraryQueryKey() });
          setLocation("/dashboard/student/library");
        }
      },
      onError: (error: Error) => {
        toast({ title: "Enrollment failed", description: error.message, variant: "destructive" });
      }
    });
  };

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-white pt-32 pb-20 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </PublicLayout>
    );
  }

  if (isError || !course) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-white pt-32 pb-20 flex flex-col items-center justify-center">
          <AlertCircle className="w-12 h-12 text-red-600 mb-4" />
          <h2 className="text-[24px] font-bold mb-2 text-black">Course not found</h2>
          <p className="text-[#394649]">The course you're looking for doesn't exist or has been removed.</p>
          <Link href="/courses">
            <Button className="mt-6 h-[44px] px-8 bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[16px]">Browse Courses</Button>
          </Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="bg-white min-h-screen text-black">
        {/* Hero Section */}
        <section className="pt-32 pb-20 bg-white border-b border-[#E5E5E5] relative overflow-hidden">
          <div className="container mx-auto px-4 md:px-8 relative z-10">
            <div className="grid lg:grid-cols-12 gap-12 items-center">
              <div className="space-y-8 lg:col-span-7">
                <div className="flex flex-wrap gap-2">
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[13px] font-bold">Free Course</span>
                  <span className="border border-[#E5E5E5] text-[#394649] px-3 py-1 rounded-full text-[13px] font-medium capitalize">{course.level || "Beginner"}</span>
                </div>

                <div>
                  <h1 className="text-[40px] lg:text-[46px] font-bold tracking-tight text-black mb-4 leading-[1.1]">
                    {course.title}
                  </h1>
                  {course.creatorName && (
                    <p className="text-[16px] text-[#394649]">
                      Created by <span className="font-medium text-black">{course.creatorName}</span>
                    </p>
                  )}
                </div>

                <p className="text-[18px] text-[#394649] leading-relaxed max-w-2xl">
                  {course.description}
                </p>

                <div className="flex flex-wrap items-center gap-6 pt-2 text-[14px] font-medium text-[#394649]">
                  <div className="flex items-center gap-2">
                    <Infinity className="w-5 h-5 text-primary" />
                    <span>Lifetime Access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <span>{course.lessons} Lessons</span>
                  </div>
                </div>

                <div className="pt-6 flex gap-4 lg:hidden">
                  {isEnrolled ? (
                    <Link href={`/dashboard/student/courses/${courseId}`}>
                      <Button className="h-[54px] px-10 bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[16px] shadow-[0_10px_24px_rgba(21,207,116,0.35)] w-full">
                        Resume Learning
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      className="h-[54px] px-10 bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[16px] shadow-[0_10px_24px_rgba(21,207,116,0.35)] w-full"
                      onClick={handleEnroll}
                      disabled={enroll.isPending}
                    >
                      {enroll.isPending ? "Enrolling..." : "Enroll for Free"}
                    </Button>
                  )}
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 border border-[#E5E5E5] flex items-center justify-center group shadow-sm">
                  <CourseThumbnail src={course.thumbnailUrl} title={course.title} className="transition-transform duration-700 group-hover:scale-105" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-24">
          <div className="container mx-auto px-4 md:px-8">
            <div className="grid lg:grid-cols-12 gap-16">
              <div className="lg:col-span-8 space-y-16">

                {/* Outcomes */}
                {course.outcomes && course.outcomes.length > 0 && (
                  <div>
                    <h2 className="text-[32px] font-bold mb-8 flex items-center gap-3 text-black">
                      What you'll learn
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4 bg-[#F8F9FA] border border-[#E5E5E5] rounded-lg p-8">
                      {course.outcomes.map((item, i) => (
                        <div key={i} className="flex gap-4">
                          <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-[#394649] text-[16px] leading-relaxed">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Curriculum */}
                <div>
                  <h2 className="text-[32px] font-bold mb-8 flex items-center gap-3 text-black">
                    Course Curriculum
                  </h2>

                  {(!course.modules || course.modules.length === 0) ? (
                    <div className="p-8 text-center border border-[#E5E5E5] rounded-lg bg-white">
                      <p className="text-[#9794AA]">Curriculum details are being finalized.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {course.modules.map((module, mIndex) => (
                        <div key={module.id} className="border border-[#E5E5E5] rounded-lg overflow-hidden bg-white shadow-sm">
                          <div className="bg-[#F8F9FA] p-5 border-b border-[#E5E5E5] flex justify-between items-center">
                            <div>
                              <h3 className="font-bold text-[18px] text-black">Module {mIndex + 1}: {module.title}</h3>
                              <p className="text-[14px] text-[#9794AA] mt-1">{module.lessons?.length || 0} lessons</p>
                            </div>
                          </div>
                          <div className="divide-y divide-[#E5E5E5]">
                            {module.lessons?.map((lesson, lIndex) => (
                              <div key={lesson.id} className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[14px] shrink-0">
                                    {lIndex + 1}
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-black text-[16px]">{lesson.title}</h4>
                                    {lesson.description && (
                                      <p className="text-[14px] text-[#394649] mt-1">{lesson.description}</p>
                                    )}
                                  </div>
                                </div>
                                {lesson.isPreview ? (
                                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[12px] font-bold ml-4 shrink-0">Preview</span>
                                ) : (
                                  <Clock className="w-4 h-4 text-[#9794AA] ml-4 shrink-0" />
                                )}
                              </div>
                            ))}
                            {(!module.lessons || module.lessons.length === 0) && (
                              <div className="p-5 text-[14px] text-[#9794AA] italic">
                                Lessons coming soon
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* FAQs */}
                {course.faqs && course.faqs.length > 0 && (
                  <div>
                    <h2 className="text-[32px] font-bold mb-8 text-black">Frequently Asked Questions</h2>
                    <Accordion type="single" collapsible className="w-full space-y-4">
                      {course.faqs.map((faq, i) => (
                        <AccordionItem key={i} value={`faq-${i}`} className="bg-white border border-[#E5E5E5] rounded-lg px-6">
                          <AccordionTrigger className="text-left font-bold text-black hover:no-underline py-6 text-[18px]">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-[#394649] text-[16px] pb-6 leading-relaxed">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                )}
              </div>

              {/* Sticky Sidebar */}
              <div className="lg:col-span-4 hidden lg:block">
                <div className="sticky top-32 border border-[#E5E5E5] bg-white rounded-lg p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                  <div className="flex gap-4 mb-6">
                    <div className="w-20 h-20 rounded bg-gray-100 border border-[#E5E5E5] flex-shrink-0 overflow-hidden">
                      <CourseThumbnail src={course.thumbnailUrl} title={course.title} />
                    </div>
                    <div className="flex flex-col justify-center">
                      <h4 className="text-[14px] font-bold text-black line-clamp-2 leading-snug">{course.title}</h4>
                      {course.creatorName && <p className="text-[13px] text-[#9794AA] mt-1">{course.creatorName}</p>}
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-6 pt-4 border-t border-[#E5E5E5]">
                    <div className="flex items-center justify-between text-[16px]">
                      <span className="text-[#394649]">Course price</span>
                      <span className="text-black font-medium">Free</span>
                    </div>
                    <div className="flex items-center justify-between text-[16px]">
                      <span className="text-[#394649]">Access</span>
                      <span className="text-black font-medium">Lifetime</span>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-[#E5E5E5]">
                      <span className="text-black font-bold text-[18px]">Total</span>
                      <span className="text-black font-bold text-[24px]">Free</span>
                    </div>
                  </div>

                  {isEnrolled ? (
                    <Link href={`/dashboard/student/courses/${courseId}`}>
                      <Button className="w-full h-[54px] bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[16px] shadow-[0_10px_24px_rgba(21,207,116,0.35)]">
                        Resume Learning
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      className="w-full h-[54px] bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[16px] shadow-[0_10px_24px_rgba(21,207,116,0.35)]"
                      onClick={handleEnroll}
                      disabled={enroll.isPending}
                    >
                      {enroll.isPending ? "Enrolling..." : "Enroll for Free"}
                    </Button>
                  )}
                  <p className="text-[13px] text-center text-[#9794AA] mt-4">
                    Instant access to all course materials
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
