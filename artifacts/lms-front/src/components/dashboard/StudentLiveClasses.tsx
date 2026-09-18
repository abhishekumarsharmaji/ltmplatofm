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
      <div className="space-y-8 max-w-6xl mx-auto pt-4">
        <div>
          <h2 className="text-[32px] md:text-[40px] font-bold text-black tracking-tight leading-tight">Upcoming Live Classes</h2>
          <p className="text-[16px] text-[#4D4D4D] mt-1">Live sessions from your enrolled courses.</p>
        </div>
        <div className="text-center py-20 bg-white border border-[#E5E5E5] rounded-xl shadow-sm">
          <Video className="w-12 h-12 text-[#9794AA] mx-auto mb-4" />
          <h3 className="font-bold text-[18px] text-black mb-2">No courses enrolled</h3>
          <p className="text-[14px] text-[#4D4D4D] mb-6">Enroll in a course to see upcoming live classes.</p>
          <Link href="/courses">
            <Button className="h-[44px] px-8 bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[14px] shadow-[0_4px_14px_rgba(21,207,116,0.25)]">Browse Courses</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pt-4">
      <div>
        <h2 className="text-[32px] md:text-[40px] font-bold text-black tracking-tight leading-tight">Upcoming Live Classes</h2>
        <p className="text-[16px] text-[#4D4D4D] mt-1">Live sessions from your enrolled courses.</p>
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
    <div className="bg-white border border-[#E5E5E5] rounded-xl p-6 md:p-8 shadow-sm">
      <h3 className="text-[20px] font-bold text-black mb-6">{courseTitle}</h3>
      <div className="grid md:grid-cols-2 gap-6">
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
      case 'live': return 'bg-[#FFEFEB] text-[#FE543D] animate-pulse';
      case 'completed': return 'bg-[#E3F9EF] text-primary';
      case 'cancelled': return 'bg-gray-100 text-[#9794AA]';
      default: return 'bg-[#EAEFF8] text-[#224EA1]';
    }
  };

  return (
    <div className="flex flex-col border border-[#E5E5E5] rounded-lg p-5 bg-[#FAFAFA] hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-3 gap-2">
        <h4 className="font-bold text-[16px] text-black group-hover:text-primary transition-colors">{liveClass.title}</h4>
        <Badge className={`font-bold text-[10px] border-none shadow-none uppercase tracking-wider ${getStatusColor(liveClass.status)}`}>
          {liveClass.status === 'live' ? 'LIVE NOW' : liveClass.status}
        </Badge>
      </div>
      {liveClass.description && (
        <p className="text-[14px] text-[#4D4D4D] line-clamp-2 mb-4">{liveClass.description}</p>
      )}
      
      <div className="flex-1" />
      
      <div className="space-y-4 mt-2 pt-4 border-t border-[#E5E5E5]">
        <div className="flex flex-col gap-2 text-[13px] font-medium text-[#4D4D4D]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#9794AA]" />
            {format(parseISO(liveClass.startsAt), "MMMM d, yyyy")}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#9794AA]" />
            {format(parseISO(liveClass.startsAt), "h:mm a")} - {format(parseISO(liveClass.endsAt), "h:mm a")} ({liveClass.timezone})
          </div>
        </div>
        
        {liveClass.status === 'live' || liveClass.status === 'scheduled' ? (
          <Link href={`/dashboard/student/live-classes/${liveClass.id}/classroom`}>
            <Button className={`w-full h-11 rounded-md font-medium text-[14px] shadow-[0_4px_14px_rgba(21,207,116,0.25)] ${liveClass.status === 'live' ? 'bg-[#FE543D] hover:bg-red-600 shadow-[0_4px_14px_rgba(254,84,61,0.25)]' : 'bg-primary hover:bg-[#10A364]'}`}>
              <Video className="w-4 h-4 mr-2" />
              {liveClass.status === 'live' ? 'Join Class Now' : 'Go to Classroom'}
            </Button>
          </Link>
        ) : liveClass.recordingUrl ? (
          <Button className="w-full border border-[#DADADA] text-[#394649] bg-white hover:bg-gray-50 h-11 rounded-md font-medium text-[14px]" asChild>
            <a href={liveClass.recordingUrl} target="_blank" rel="noopener noreferrer">Watch Recording</a>
          </Button>
        ) : (
          <Button variant="secondary" className="w-full h-11 rounded-md text-[14px] font-medium bg-gray-100 text-[#9794AA]" disabled>Class Ended</Button>
        )}
      </div>
    </div>
  );
}
