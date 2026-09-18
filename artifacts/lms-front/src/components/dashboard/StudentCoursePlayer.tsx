import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { format, parseISO } from "date-fns";
import { useGetSession, useGetStudentCourse, useListUpcomingLiveClasses, type StudentLesson } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, MonitorPlay, PlayCircle, Radio, Video } from "lucide-react";
import { SecureVideoPlayer } from "@/components/dashboard/SecureVideoPlayer";

export function StudentCoursePlayer({ courseId }: { courseId: number }) {
  const { data: course, isLoading, error } = useGetStudentCourse(courseId);
  const { data: liveClasses } = useListUpcomingLiveClasses({ courseId });
  const { data: session } = useGetSession();
  const watermark = session?.user?.email ?? session?.user?.name ?? undefined;
  const lessons = useMemo(() => course?.modules.flatMap((module) => module.lessons) ?? [], [course]);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);

  useEffect(() => {
    if (!selectedLessonId && lessons.length) setSelectedLessonId(lessons[0].id);
  }, [lessons, selectedLessonId]);

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-9 w-9 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  if (error || !course) {
    return (
      <div className="mx-auto max-w-xl py-24 text-center border border-[#E5E5E5] bg-white rounded-xl shadow-sm">
        <h2 className="text-[24px] font-bold text-black">Course unavailable</h2>
        <p className="mt-2 text-[15px] text-[#4D4D4D]">You must be enrolled to open this learning area.</p>
        <Link href="/dashboard/student/library">
          <Button className="mt-8 h-11 px-6 bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[14px] shadow-[0_4px_14px_rgba(21,207,116,0.25)]">Back to My Learning</Button>
        </Link>
      </div>
    );
  }

  const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId) ?? lessons[0];
  const videoAsset = selectedLesson?.assets.find((asset) => asset.status === "uploaded");
  const activeClasses = liveClasses?.filter((item) => item.status === "live" || item.status === "scheduled") ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-8 pt-4">
      <div className="flex items-start gap-4">
        <Link href="/dashboard/student/library">
          <Button variant="ghost" size="icon" aria-label="Back to My Learning" className="h-10 w-10 border border-[#E5E5E5] bg-white text-[#394649] hover:bg-gray-50"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[28px] md:text-[32px] font-bold text-black tracking-tight leading-tight">{course.title}</h1>
            <Badge className="bg-[#E3F9EF] text-primary border-none shadow-none font-bold uppercase tracking-wider text-[10px]">Enrolled</Badge>
          </div>
          <p className="mt-1 text-[14px] text-[#4D4D4D]">
            {course.creatorName ? `Created by ${course.creatorName}` : "Your enrolled course"}
          </p>
        </div>
      </div>

      {activeClasses.length > 0 && (
        <section className="rounded-xl border border-primary/25 bg-[#FAFAFA] p-5 md:p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-primary">
            <Radio className="h-5 w-5" />
            <h2 className="text-[18px] font-bold">Live classes for this course</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {activeClasses.map((liveClass) => (
              <div key={liveClass.id} className="rounded-lg border border-[#E5E5E5] bg-white p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="font-bold text-[16px] text-black">{liveClass.title}</h3>
                    {liveClass.description && <p className="mt-1 text-[13px] text-[#4D4D4D]">{liveClass.description}</p>}
                  </div>
                  <Badge className={`border-none shadow-none font-bold uppercase tracking-wider text-[10px] ${liveClass.status === "live" ? "bg-[#FFEFEB] text-[#FE543D] animate-pulse" : "bg-[#E3F9EF] text-primary"}`}>
                    {liveClass.status === "live" ? "LIVE NOW" : "SCHEDULED"}
                  </Badge>
                </div>
                <div className="mt-4 space-y-2 text-[13px] text-[#4D4D4D] font-medium pt-4 border-t border-[#E5E5E5]">
                  <p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-[#9794AA]" />{format(parseISO(liveClass.startsAt), "MMMM d, yyyy")}</p>
                  <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-[#9794AA]" />{format(parseISO(liveClass.startsAt), "h:mm a")} ({liveClass.timezone})</p>
                </div>
                <Link href={`/dashboard/student/live-classes/${liveClass.id}/classroom`}>
                  <Button className={`mt-5 w-full h-11 font-medium rounded-md text-[14px] ${liveClass.status === "live" ? "bg-[#FE543D] hover:bg-red-600 text-white shadow-[0_4px_14px_rgba(254,84,61,0.25)]" : "bg-primary hover:bg-[#10A364] text-white shadow-[0_4px_14px_rgba(21,207,116,0.25)]"}`}>
                    <Video className="mr-2 h-4 w-4" />{liveClass.status === "live" ? "Join Live Class" : "Open Classroom"}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <main className="min-w-0 space-y-6">
          <div className="overflow-hidden rounded-xl border border-[#E5E5E5] bg-black shadow-sm">
            <div className="aspect-video relative">
              {videoAsset ? (
                <SecureVideoPlayer key={videoAsset.id} streamUrl={videoAsset.streamUrl} watermark={watermark} />
              ) : (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center text-white">
                  <MonitorPlay className="mb-4 h-14 w-14 text-white/30" />
                  <p className="font-bold text-[18px]">{selectedLesson ? "Video not added yet" : "Select a lesson"}</p>
                  <p className="mt-2 text-[14px] text-white/60">The creator’s uploaded lesson video will play here.</p>
                </div>
              )}
            </div>
          </div>
          {selectedLesson && (
            <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
              <p className="text-[12px] font-bold uppercase tracking-wider text-primary mb-2">Current lesson</p>
              <h2 className="text-[24px] font-bold text-black">{selectedLesson.title}</h2>
              {selectedLesson.description && <p className="mt-3 leading-relaxed text-[15px] text-[#4D4D4D]">{selectedLesson.description}</p>}
            </div>
          )}
        </main>

        <aside className="overflow-hidden rounded-xl border border-[#E5E5E5] bg-white shadow-sm lg:max-h-[calc(100vh-150px)]">
          <div className="border-b border-[#E5E5E5] p-5 bg-[#FAFAFA]">
            <h2 className="font-bold text-[18px] text-black">Course content</h2>
            <p className="mt-1 text-[13px] text-[#9794AA]">{lessons.length} lesson{lessons.length === 1 ? "" : "s"}</p>
          </div>
          <div className="max-h-[560px] overflow-y-auto">
            {course.modules.map((module, moduleIndex) => (
              <div key={module.id} className="border-b border-[#E5E5E5] last:border-0">
                <div className="bg-[#F1EEFC] px-5 py-3 border-y border-[#E5E5E5] first:border-t-0">
                  <p className="text-[13px] font-bold text-[#704FE6]">Module {moduleIndex + 1}: {module.title}</p>
                </div>
                {module.lessons.map((lesson, lessonIndex) => (
                  <LessonButton key={lesson.id} lesson={lesson} index={lessonIndex} active={lesson.id === selectedLesson?.id} onSelect={setSelectedLessonId} />
                ))}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function LessonButton({ lesson, index, active, onSelect }: { lesson: StudentLesson; index: number; active: boolean; onSelect: (id: number) => void }) {
  const hasVideo = lesson.assets.some((asset) => asset.status === "uploaded");
  return (
    <button
      type="button"
      onClick={() => onSelect(lesson.id)}
      className={`flex w-full items-start gap-3 border-t border-[#E5E5E5] px-5 py-4 text-left transition-colors first:border-t-0 ${active ? "bg-[#E3F9EF] text-primary" : "hover:bg-gray-50 text-[#394649]"}`}
    >
      <PlayCircle className={`mt-0.5 h-4 w-4 shrink-0 ${hasVideo ? (active ? "text-primary" : "text-[#9794AA]") : "opacity-40"}`} />
      <span className="min-w-0 flex-1">
        <span className={`block text-[11px] font-bold uppercase tracking-wider ${active ? "text-primary/70" : "text-[#9794AA]"}`}>Lesson {index + 1}</span>
        <span className={`block truncate text-[14px] font-bold mt-1 ${active ? "text-primary" : "text-black"}`}>{lesson.title}</span>
        <span className={`mt-1 block text-[12px] ${active ? "text-primary/70" : "text-[#9794AA]"}`}>{hasVideo ? "Video available" : "No video yet"}</span>
      </span>
    </button>
  );
}