import { useParams, Link } from "wouter";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useGetMarketplaceCourse, useAddWishlist, getListWishlistQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, CheckCircle2, Clock, Star, Play, PlayCircle, Trophy, BarChart3, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function CourseDetail() {
  const params = useParams();
  const courseId = params.id ? parseInt(params.id) : 0;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const addWishlist = useAddWishlist();
  
  const handleWishlist = () => {
     addWishlist.mutate({ productId: course?.productId ?? 0 }, {
      onSuccess: () => {
        toast({ title: "Added to wishlist" });
        queryClient.invalidateQueries({ queryKey: getListWishlistQueryKey() });
      },
      onError: () => toast({ title: "Failed to add to wishlist", variant: "destructive" })
    });
  };

  const { data: course, isLoading, isError } = useGetMarketplaceCourse(courseId, { 
    query: { enabled: !!courseId, queryKey: ['getMarketplaceCourse', courseId] } 
  });

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
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="bg-background min-h-screen text-foreground">
        {/* Hero Section */}
        <section className="pt-32 pb-16 bg-card border-b border-border">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10">Course</Badge>
                  <Badge variant="outline" className="border-border text-muted-foreground">{course.level}</Badge>
                </div>
                
                <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-balance">
                  {course.title}
                </h1>
                
                <p className="text-lg text-muted-foreground leading-relaxed text-balance">
                  {course.description}
                </p>
                
                <div className="flex items-center gap-6 pt-4 text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <span>Self-paced</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-muted-foreground" />
                    <span>{course.lessons} Lessons</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-muted-foreground" />
                    <span>Certificate</span>
                  </div>
                </div>
                
                <div className="pt-6 flex gap-4">
                  <Link href="/checkout">
                    <Button size="lg" className="h-14 px-8 text-base" data-testid="button-enroll">
                      Enroll Now
                    </Button>
                  </Link>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="h-14 px-8 text-base bg-transparent" 
                    data-testid="button-wishlist"
                    onClick={handleWishlist}
                     disabled={addWishlist.isPending || !course?.productId}
                  >
                    {addWishlist.isPending ? "Adding..." : "Add to Wishlist"}
                  </Button>
                </div>
              </div>
              
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-muted border border-border shadow-2xl flex items-center justify-center group cursor-pointer">
                <BookOpen className="w-24 h-24 text-muted-foreground/20" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center text-primary-foreground backdrop-blur-sm">
                    <Play className="w-6 h-6 fill-current ml-1" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-bold mb-6">What you'll learn</h2>
              <div className="grid sm:grid-cols-2 gap-4 mb-12">
                {[
                  "Master the core concepts and principles",
                  "Build real-world projects from scratch",
                  "Best practices and industry standards",
                  "Advanced techniques used by professionals"
                ].map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>

              <h2 className="text-2xl font-bold mb-6">Course Curriculum</h2>
              <div className="space-y-4">
                {Array.from({ length: course.lessons }).slice(0, 5).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border border-border rounded-xl bg-card hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {i + 1}
                      </div>
                      <div>
                        <h4 className="font-medium">Lesson {i + 1}</h4>
                        <p className="text-sm text-muted-foreground">Module overview and fundamentals</p>
                      </div>
                    </div>
                    {i === 0 ? (
                      <Badge variant="secondary" className="bg-primary/10 text-primary">Preview</Badge>
                    ) : (
                      <Clock className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
                {course.lessons > 5 && (
                  <div className="text-center pt-4">
                    <Button variant="ghost" className="text-muted-foreground">
                      Show {course.lessons - 5} more lessons
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
