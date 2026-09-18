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
      <div className="mx-auto max-w-xl py-20 text-center">
        <h2 className="text-2xl font-bold">Course unavailable</h2>
        <p className="mt-2 text-muted-foreground">You must be enrolled to open this learning area.</p>
        <Link href="/dashboard/student/library"><Button className="mt-6">Back to My Learning</Button></Link>
      </div>
    );
  }

  const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId) ?? lessons[0];
  const videoAsset = selectedLesson?.assets.find((asset) => asset.status === "uploaded");
  const activeClasses = liveClasses?.filter((item) => item.status === "live" || item.status === "scheduled") ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-start gap-3">
        <Link href="/dashboard/student/library">
          <Button variant="ghost" size="icon" aria-label="Back to My Learning"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{course.title}</h1>
            <Badge className="bg-success text-success-foreground">Enrolled</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {course.creatorName ? `Created by ${course.creatorName}` : "Your enrolled course"}
          </p>
        </div>
      </div>

      {activeClasses.length > 0 && (
        <section className="rounded-2xl border border-primary/25 bg-primary/5 p-4 md:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Radio className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Live classes for this course</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {activeClasses.map((liveClass) => (
              <div key={liveClass.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{liveClass.title}</h3>
                    {liveClass.description && <p className="mt-1 text-sm text-muted-foreground">{liveClass.description}</p>}
                  </div>
                  <Badge variant="outline" className={liveClass.status === "live" ? "border-red-500/30 bg-red-500/10 text-red-400" : ""}>
                    {liveClass.status === "live" ? "LIVE NOW" : "SCHEDULED"}
                  </Badge>
                </div>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{format(parseISO(liveClass.startsAt), "MMMM d, yyyy")}</p>
                  <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{format(parseISO(liveClass.startsAt), "h:mm a")} ({liveClass.timezone})</p>
                </div>
                <Link href={`/dashboard/student/live-classes/${liveClass.id}/classroom`}>
                  <Button className="mt-4 w-full" variant={liveClass.status === "live" ? "destructive" : "default"}>
                    <Video className="mr-2 h-4 w-4" />{liveClass.status === "live" ? "Join Live Class" : "Open Classroom"}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <main className="min-w-0 space-y-5">
          <div className="overflow-hidden rounded-2xl border border-border bg-black shadow-sm">
            <div className="aspect-video">
              {videoAsset ? (
                <SecureVideoPlayer key={videoAsset.id} streamUrl={videoAsset.streamUrl} watermark={watermark} />
              ) : (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center text-white">
                  <MonitorPlay className="mb-3 h-12 w-12 text-white/30" />
                  <p className="font-semibold">{selectedLesson ? "Video not added yet" : "Select a lesson"}</p>
                  <p className="mt-1 text-sm text-white/60">The creator’s uploaded lesson video will play here.</p>
                </div>
              )}
            </div>
          </div>
          {selectedLesson && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Current lesson</p>
              <h2 className="mt-2 text-xl font-bold">{selectedLesson.title}</h2>
              {selectedLesson.description && <p className="mt-2 leading-relaxed text-muted-foreground">{selectedLesson.description}</p>}
            </div>
          )}
        </main>

        <aside className="overflow-hidden rounded-2xl border border-border bg-card lg:max-h-[calc(100vh-150px)]">
          <div className="border-b border-border p-4">
            <h2 className="font-bold">Course content</h2>
            <p className="mt-1 text-xs text-muted-foreground">{lessons.length} lesson{lessons.length === 1 ? "" : "s"}</p>
          </div>
          <div className="max-h-[560px] overflow-y-auto">
            {course.modules.map((module, moduleIndex) => (
              <div key={module.id} className="border-b border-border last:border-0">
                <div className="bg-muted/40 px-4 py-3">
                  <p className="text-sm font-semibold">Module {moduleIndex + 1}: {module.title}</p>
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
      className={`flex w-full items-start gap-3 border-t border-border px-4 py-4 text-left transition-colors ${active ? "bg-primary/10 text-primary" : "hover:bg-muted/40"}`}
    >
      <PlayCircle className={`mt-0.5 h-4 w-4 shrink-0 ${hasVideo ? "" : "opacity-40"}`} />
      <span className="min-w-0">
        <span className="block text-xs text-muted-foreground">Lesson {index + 1}</span>
        <span className="block truncate text-sm font-medium">{lesson.title}</span>
        <span className="mt-1 block text-xs text-muted-foreground">{hasVideo ? "Video available" : "No video yet"}</span>
      </span>
    </button>
  );
}