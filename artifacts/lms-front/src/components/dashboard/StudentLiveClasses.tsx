import { useStudentLibrary, useListUpcomingLiveClasses, LiveClass } from "@workspace/api-client-react";
import { Video, Calendar, Clock } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";

export function StudentLiveClasses() {
  const { data: library, isLoading: libLoading } = useStudentLibrary();

  if (libLoading) {
    return <div className="py-20 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  if (!library || library.length === 0) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Upcoming Live Classes</h2>
          <p className="text-muted-foreground mt-1">Live sessions from your enrolled courses.</p>
        </div>
        <div className="text-center py-20 bg-card border border-border rounded-2xl shadow-sm">
          <Video className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-2">No courses enrolled</h3>
          <p className="text-muted-foreground mb-4">Enroll in a course to see upcoming live classes.</p>
          <Link href="/courses"><Button>Browse Courses</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Upcoming Live Classes</h2>
        <p className="text-muted-foreground mt-1">Live sessions from your enrolled courses.</p>
      </div>

      <div className="space-y-6">
        {library.map((item: any) => {
          const courseId = item.course?.id ?? item.courseId ?? item.id;
          const courseTitle = item.course?.title ?? item.title;
          return <CourseLiveClasses key={courseId} courseId={courseId} courseTitle={courseTitle} />;
        })}
      </div>
    </div>
  );
}

function CourseLiveClasses({ courseId, courseTitle }: { courseId: number, courseTitle: string }) {
  const { data: classes, isLoading } = useListUpcomingLiveClasses({ courseId });

  if (isLoading) {
    return <div className="p-8 border border-border rounded-2xl bg-card animate-pulse h-32" />;
  }

  if (!classes || classes.length === 0) {
    return null; // Don't show courses with no upcoming classes to reduce noise
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <h3 className="text-xl font-bold mb-4">{courseTitle}</h3>
      <div className="grid md:grid-cols-2 gap-4">
        {classes.map((cls) => (
          <StudentLiveClassItem key={cls.id} liveClass={cls} />
        ))}
      </div>
    </div>
  );
}

function StudentLiveClassItem({ liveClass }: { liveClass: LiveClass }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-destructive/10 text-destructive border-destructive/20 animate-pulse';
      case 'completed': return 'bg-success/10 text-success border-success/20';
      case 'cancelled': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-brand/10 text-brand border-brand/20';
    }
  };

  return (
    <div className="flex flex-col border border-border rounded-xl p-4 bg-muted/20 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between mb-2 gap-2">
        <h4 className="font-bold">{liveClass.title}</h4>
        <Badge variant="outline" className={getStatusColor(liveClass.status)}>
          {liveClass.status === 'live' ? 'LIVE NOW' : liveClass.status.toUpperCase()}
        </Badge>
      </div>
      {liveClass.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{liveClass.description}</p>
      )}
      
      <div className="flex-1" />
      
      <div className="space-y-3 mt-4 pt-4 border-t border-border">
        <div className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {format(parseISO(liveClass.startsAt), "MMMM d, yyyy")}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {format(parseISO(liveClass.startsAt), "h:mm a")} - {format(parseISO(liveClass.endsAt), "h:mm a")} ({liveClass.timezone})
          </div>
        </div>
        
        {liveClass.status === 'live' || liveClass.status === 'scheduled' ? (
          <Link href={`/dashboard/student/live-classes/${liveClass.id}/classroom`}>
            <Button className="w-full" variant={liveClass.status === 'live' ? "destructive" : "default"}>
              <Video className="w-4 h-4 mr-2" />
              {liveClass.status === 'live' ? 'Join Class Now' : 'Go to Classroom'}
            </Button>
          </Link>
        ) : liveClass.recordingUrl ? (
          <Button variant="outline" className="w-full" asChild>
            <a href={liveClass.recordingUrl} target="_blank" rel="noopener noreferrer">Watch Recording</a>
          </Button>
        ) : (
          <Button variant="secondary" className="w-full" disabled>Class Ended</Button>
        )}
      </div>
    </div>
  );
}
