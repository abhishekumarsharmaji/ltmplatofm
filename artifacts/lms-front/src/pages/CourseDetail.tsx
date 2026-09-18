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
        <div className="min-h-screen bg-background pt-32 pb-20 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </PublicLayout>
    );
  }

  if (isError || !course) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-background pt-32 pb-20 flex flex-col items-center justify-center">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Course not found</h2>
          <p className="text-muted-foreground">The course you're looking for doesn't exist or has been removed.</p>
          <Link href="/courses">
            <Button className="mt-6">Browse Courses</Button>
          </Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="bg-background min-h-screen text-foreground">
        {/* Hero Section */}
        <section className="pt-32 pb-20 bg-card border-b border-border relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="grid lg:grid-cols-12 gap-12 items-center">
              <div className="space-y-8 lg:col-span-7">
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-success text-success-foreground font-bold hover:bg-success">Free Course</Badge>
                  <Badge variant="outline" className="border-border text-muted-foreground capitalize">{course.level || "Beginner"}</Badge>
                </div>

                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-balance mb-4">
                    {course.title}
                  </h1>
                  {course.creatorName && (
                    <p className="text-lg font-medium text-muted-foreground">
                      Created by <span className="text-foreground">{course.creatorName}</span>
                    </p>
                  )}
                </div>

                <p className="text-lg text-muted-foreground leading-relaxed text-balance max-w-2xl">
                  {course.description}
                </p>

                <div className="flex flex-wrap items-center gap-6 pt-2 text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Infinity className="w-5 h-5 text-primary" />
                    <span>Lifetime Access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <span>{course.lessons} Lessons</span>
                  </div>
                </div>

                <div className="pt-6 flex gap-4">
                  {isEnrolled ? (
                    <Link href="/dashboard/student/library">
                      <Button size="lg" className="h-14 px-8 text-base">
                        Resume Learning
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      size="lg"
                      className="h-14 px-8 text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                      onClick={handleEnroll}
                      disabled={enroll.isPending}
                    >
                      {enroll.isPending ? "Enrolling..." : "Enroll for Free"}
                    </Button>
                  )}
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted border border-border shadow-2xl flex items-center justify-center group">
                  {course.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full bg-card flex flex-col items-center justify-center">
                      <BookOpen className="w-24 h-24 text-muted-foreground/20 mb-4 transition-transform duration-700 group-hover:scale-110" />
                      <div className="text-muted-foreground/40 font-medium tracking-widest uppercase text-sm">COURSE PREVIEW</div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center text-primary-foreground backdrop-blur-sm shadow-xl scale-95 group-hover:scale-100 transition-transform">
                      <Play className="w-8 h-8 fill-current ml-1" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid lg:grid-cols-12 gap-16">
              <div className="lg:col-span-8 space-y-16">

                {/* Outcomes */}
                {course.outcomes && course.outcomes.length > 0 && (
                  <div>
                    <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                      <Sparkles className="w-6 h-6 text-primary" />
                      What you'll learn
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4 bg-muted/30 border border-border rounded-3xl p-8">
                      {course.outcomes.map((item, i) => (
                        <div key={i} className="flex gap-4">
                          <div className="mt-1 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                          </div>
                          <span className="text-muted-foreground leading-relaxed">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Curriculum */}
                <div>
                  <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                    <MonitorPlay className="w-6 h-6 text-primary" />
                    Course Curriculum
                  </h2>

                  {(!course.modules || course.modules.length === 0) ? (
                    <div className="p-8 text-center border border-border rounded-2xl bg-card">
                      <p className="text-muted-foreground">Curriculum details are being finalized.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {course.modules.map((module, mIndex) => (
                        <div key={module.id} className="border border-border rounded-2xl overflow-hidden bg-card shadow-sm">
                          <div className="bg-muted/50 p-5 border-b border-border flex justify-between items-center">
                            <div>
                              <h3 className="font-bold text-lg">Module {mIndex + 1}: {module.title}</h3>
                              <p className="text-sm text-muted-foreground mt-1">{module.lessons?.length || 0} lessons</p>
                            </div>
                          </div>
                          <div className="divide-y divide-border">
                            {module.lessons?.map((lesson, lIndex) => (
                              <div key={lesson.id} className="flex items-center justify-between p-5 hover:bg-muted/30 transition-colors">
                                <div className="flex items-center gap-4">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                                    {lIndex + 1}
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-foreground">{lesson.title}</h4>
                                    {lesson.description && (
                                      <p className="text-sm text-muted-foreground mt-1">{lesson.description}</p>
                                    )}
                                  </div>
                                </div>
                                {lesson.isPreview ? (
                                  <Badge variant="secondary" className="bg-primary/10 text-primary ml-4 shrink-0">Preview</Badge>
                                ) : (
                                  <Clock className="w-4 h-4 text-muted-foreground ml-4 shrink-0" />
                                )}
                              </div>
                            ))}
                            {(!module.lessons || module.lessons.length === 0) && (
                              <div className="p-5 text-sm text-muted-foreground italic">
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
                    <h2 className="text-3xl font-bold mb-8">Frequently Asked Questions</h2>
                    <Accordion type="single" collapsible className="w-full space-y-4">
                      {course.faqs.map((faq, i) => (
                        <AccordionItem key={i} value={`faq-${i}`} className="bg-card border border-border rounded-xl px-6">
                          <AccordionTrigger className="text-left font-semibold hover:no-underline py-6">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
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
                <div className="sticky top-32 border border-border bg-card rounded-3xl p-8 shadow-sm">
                  <h3 className="text-xl font-bold mb-6">Ready to start?</h3>
                  {isEnrolled ? (
                    <Link href="/dashboard/student/library">
                      <Button className="w-full h-12 text-base mb-4">Resume Learning</Button>
                    </Link>
                  ) : (
                    <Button
                      className="w-full h-12 text-base mb-4 shadow-md"
                      onClick={handleEnroll}
                      disabled={enroll.isPending}
                    >
                      {enroll.isPending ? "Enrolling..." : "Enroll for Free"}
                    </Button>
                  )}
                  <p className="text-xs text-center text-muted-foreground mb-6">
                    Start now and learn at your own pace.
                  </p>

                  <div className="space-y-4 text-sm">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-primary" />
                      <span className="font-medium text-foreground">Self-paced learning</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Infinity className="w-5 h-5 text-primary" />
                      <span className="font-medium text-foreground">Lifetime access</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
