import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Video, BookOpen } from "lucide-react";

export function CreatorLiveClassesStandalone() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto py-10">
      <div className="text-center py-20 bg-card border border-border rounded-2xl shadow-sm">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Video className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Live Classes are Managed per Course</h2>
        <p className="text-muted-foreground max-w-md mx-auto mb-8">
          To schedule or manage live classes, please navigate to the specific Course Builder. 
          Live classes are tied to a course's curriculum and enrollment.
        </p>
        <Link href="/dashboard/creator/courses">
          <Button size="lg" className="h-12 px-8">
            <BookOpen className="w-5 h-5 mr-2" />
            Go to Courses
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function AdminLiveClassesStandalone() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto py-10">
      <div className="text-center py-20 bg-card border border-border rounded-2xl shadow-sm">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Video className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Live Classes are Managed per Course</h2>
        <p className="text-muted-foreground max-w-md mx-auto mb-8">
          To view or moderate live classes, please navigate to the Course Studio for a specific course.
        </p>
        <Link href="/dashboard/admin/courses">
          <Button size="lg" className="h-12 px-8">
            <BookOpen className="w-5 h-5 mr-2" />
            Go to Courses
          </Button>
        </Link>
      </div>
    </div>
  );
}
