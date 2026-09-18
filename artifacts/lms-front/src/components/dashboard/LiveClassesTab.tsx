import { useState, useRef, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListCreatorLiveClasses,
  getListCreatorLiveClassesQueryKey,
  useCreateLiveClass,
  useUpdateLiveClass,
  useDeleteLiveClass,
  useCancelLiveClass,
  useCompleteLiveClass,
  useListLiveClassAttendance,
  useGetCreatorCourseBuilder,
  LiveClass
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Edit2, MoreVertical, Plus, Trash, Video, XCircle, CheckCircle, Users, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { format, parseISO } from "date-fns";
import { LessonVideoUpload } from "@/components/dashboard/LessonVideoUpload";

export function LiveClassesTab({ productId, role = 'creator' }: { productId: number, role?: 'creator' | 'admin' }) {
  const { data: classes, isLoading } = useListCreatorLiveClasses(productId);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Live Classes</h2>
          <p className="text-muted-foreground text-sm mt-1">Schedule and manage live sessions for this course.</p>
        </div>
        <LiveClassFormDialog productId={productId} open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <Button><Plus className="w-4 h-4 mr-2" /> Schedule Class</Button>
        </LiveClassFormDialog>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : !classes || classes.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
          <Video className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="font-medium">No live classes scheduled</h3>
          <p className="text-sm text-muted-foreground mb-4">Start by scheduling a live class for your students.</p>
          <LiveClassFormDialog productId={productId} open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <Button variant="outline">Schedule Class</Button>
          </LiveClassFormDialog>
        </div>
      ) : (
        <div className="space-y-4">
          {classes.map((cls) => (
            <LiveClassItem key={cls.id} liveClass={cls} productId={productId} role={role} />
          ))}
        </div>
      )}
    </div>
  );
}

function LiveClassItem({ liveClass, productId, role }: { liveClass: LiveClass, productId: number, role: 'creator' | 'admin' }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const deleteClass = useDeleteLiveClass();
  const cancelClass = useCancelLiveClass();
  const completeClass = useCompleteLiveClass();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListCreatorLiveClassesQueryKey(productId) });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this class? This cannot be undone.")) {
      deleteClass.mutate({ id: liveClass.id }, {
        onSuccess: () => {
          toast({ title: "Class deleted" });
          invalidate();
        },
        onError: (err) => toast({ title: "Could not delete", description: err.message, variant: "destructive" })
      });
    }
  };

  const handleCancel = () => {
    if (confirm("Are you sure you want to cancel this class?")) {
      cancelClass.mutate({ id: liveClass.id }, {
        onSuccess: () => {
          toast({ title: "Class cancelled" });
          invalidate();
        },
        onError: (err) => toast({ title: "Could not cancel", description: err.message, variant: "destructive" })
      });
    }
  };

  const handleComplete = () => {
    if (confirm("End this live class now? All connected students will be disconnected.")) {
      completeClass.mutate({ id: liveClass.id }, {
        onSuccess: () => {
          toast({ title: "Live class ended" });
          invalidate();
        },
        onError: (err) => toast({ title: "Could not complete", description: err.message, variant: "destructive" })
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-destructive/10 text-destructive border-destructive/20 animate-pulse';
      case 'completed': return 'bg-success/10 text-success border-success/20';
      case 'cancelled': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-brand/10 text-brand border-brand/20';
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-card border border-border rounded-xl shadow-sm gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-bold text-lg">{liveClass.title}</h3>
          <Badge variant="outline" className={getStatusColor(liveClass.status)}>
            {liveClass.status === 'live' ? 'LIVE NOW' : liveClass.status.toUpperCase()}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-1">{liveClass.description || "No description provided."}</p>
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground font-medium">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {format(parseISO(liveClass.startsAt), "MMM d, yyyy")}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {format(parseISO(liveClass.startsAt), "h:mm a")} - {format(parseISO(liveClass.endsAt), "h:mm a")} ({liveClass.timezone})
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <AttendanceDialog liveClass={liveClass} />
        {(liveClass.status === "completed" || liveClass.status === "live") && (
          <RecordingUploadDialog liveClass={liveClass} productId={productId} />
        )}
        {liveClass.status === "live" && (
          <Button variant="destructive" size="sm" onClick={handleComplete} disabled={completeClass.isPending}>
            <CheckCircle className="mr-2 h-4 w-4" />
            {completeClass.isPending ? "Ending..." : "End Live Class"}
          </Button>
        )}
        {liveClass.status === 'scheduled' || liveClass.status === 'live' ? (
          <Link href={`/dashboard/${role}/live-classes/${liveClass.id}/classroom`}>
            <Button variant={liveClass.status === 'live' ? "destructive" : "default"} size="sm">
              <Video className="w-4 h-4 mr-2" />
              {liveClass.status === 'live' ? 'Join Class' : 'Enter Studio'}
            </Button>
          </Link>
        ) : liveClass.recordingUrl ? (
          <Button variant="outline" size="sm" asChild>
            <a href={liveClass.recordingUrl} target="_blank" rel="noopener noreferrer">View Recording</a>
          </Button>
        ) : null}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9"><MoreVertical className="w-4 h-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <LiveClassFormDialog productId={productId} liveClass={liveClass} open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Edit2 className="w-4 h-4 mr-2" /> Edit Details
              </DropdownMenuItem>
            </LiveClassFormDialog>
            {liveClass.status === 'scheduled' && (
              <DropdownMenuItem onClick={handleCancel}>
                <XCircle className="w-4 h-4 mr-2" /> Cancel Class
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDelete}>
              <Trash className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function AttendanceDialog({ liveClass }: { liveClass: LiveClass }) {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useListLiveClassAttendance(liveClass.id);
  const students = data?.filter((entry) => entry.role === "student") ?? [];
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Users className="w-4 h-4 mr-2" />Attendance</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Attendance — {liveClass.title}</DialogTitle>
          <DialogDescription>Join history and total connected time for this class.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="py-10 text-center text-muted-foreground">Loading attendance…</div>
        ) : !data?.length ? (
          <div className="py-10 text-center text-muted-foreground">No one has joined this class yet.</div>
        ) : (
          <div className="max-h-[55vh] overflow-auto rounded-lg border border-border">
            <div className="grid grid-cols-[1fr_auto_auto] gap-3 bg-muted/50 px-4 py-2 text-xs font-semibold text-muted-foreground">
              <span>Participant</span><span>Time</span><span>Joins</span>
            </div>
            {data.map((entry) => (
              <div key={entry.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-t border-border px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{entry.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{entry.email}</p>
                </div>
                <span className="text-sm">{formatDuration(entry.durationSeconds)}</span>
                <Badge variant="secondary">{entry.joinCount}</Badge>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">{students.length} student{students.length === 1 ? "" : "s"} attended.</p>
      </DialogContent>
    </Dialog>
  );
}

function RecordingUploadDialog({ liveClass, productId }: { liveClass: LiveClass; productId: number }) {
  const [open, setOpen] = useState(false);
  const [lessonId, setLessonId] = useState("");
  const { data: builder } = useGetCreatorCourseBuilder(productId);
  const lessons = builder?.modules.flatMap((module) =>
    (module.lessons ?? []).map((lesson) => ({ lesson, moduleTitle: module.title }))
  ) ?? [];
  const selected = lessons.find((item) => item.lesson.id === Number(lessonId));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Upload className="w-4 h-4 mr-2" />Add recording</Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-xl overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>Add class recording to a lesson</DialogTitle>
          <DialogDescription>
            Select a curriculum lesson, then upload the completed class recording securely.
          </DialogDescription>
        </DialogHeader>
        <div className="min-w-0 space-y-4">
          <div className="min-w-0 space-y-2">
            <Label>Destination lesson</Label>
            <Select value={lessonId} onValueChange={setLessonId}>
              <SelectTrigger className="w-full min-w-0 [&>span]:block [&>span]:truncate">
                <SelectValue placeholder="Choose a lesson" />
              </SelectTrigger>
              <SelectContent>
                {lessons.map(({ lesson, moduleTitle }) => (
                  <SelectItem key={lesson.id} value={String(lesson.id)}>
                    {moduleTitle} — {lesson.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selected ? (
            <LessonVideoUpload lesson={selected.lesson} productId={productId} />
          ) : (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Select the lesson where students should watch this class recording.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LiveClassFormDialog({ 
  productId, 
  liveClass, 
  children,
  open,
  onOpenChange
}: { 
  productId: number, 
  liveClass?: LiveClass, 
  children: React.ReactNode,
  open: boolean,
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createClass = useCreateLiveClass();
  const updateClass = useUpdateLiveClass();
  const isEditing = !!liveClass;

  const [title, setTitle] = useState(liveClass?.title || "");
  const [description, setDescription] = useState(liveClass?.description || "");
  
  // Format dates for datetime-local input (YYYY-MM-DDThh:mm)
  const formatForInput = (isoString?: string | null) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };
  
  const [startsAt, setStartsAt] = useState(formatForInput(liveClass?.startsAt));
  const [endsAt, setEndsAt] = useState(formatForInput(liveClass?.endsAt));

  useEffect(() => {
    if (open) {
      setTitle(liveClass?.title || "");
      setDescription(liveClass?.description || "");
      setStartsAt(formatForInput(liveClass?.startsAt));
      setEndsAt(formatForInput(liveClass?.endsAt));
    }
  }, [open, liveClass]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startsAt || !endsAt) {
      toast({ title: "Missing fields", description: "Title, start time, and end time are required.", variant: "destructive" });
      return;
    }

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const startIso = new Date(startsAt).toISOString();
    const endIso = new Date(endsAt).toISOString();

    if (new Date(endIso) <= new Date(startIso)) {
      toast({ title: "Invalid times", description: "End time must be after start time.", variant: "destructive" });
      return;
    }

    const data = { title, description, startsAt: startIso, endsAt: endIso, timezone };

    if (isEditing) {
      updateClass.mutate({ id: liveClass.id, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCreatorLiveClassesQueryKey(productId) });
          toast({ title: "Class updated" });
          onOpenChange(false);
        },
        onError: (err) => toast({ title: "Could not update class", description: err.message, variant: "destructive" })
      });
    } else {
      createClass.mutate({ productId, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCreatorLiveClassesQueryKey(productId) });
          toast({ title: "Class scheduled" });
          onOpenChange(false);
        },
        onError: (err) => toast({ title: "Could not schedule class", description: err.message, variant: "destructive" })
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Live Class" : "Schedule Live Class"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Update the details for this session." : "Set up a new live session for your students."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Class Title</Label>
              <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Q&A Session: Week 1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="What will be covered?" rows={3} className="resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startsAt">Start Time</Label>
                <Input id="startsAt" type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endsAt">End Time</Label>
                <Input id="endsAt" type="datetime-local" value={endsAt} onChange={e => setEndsAt(e.target.value)} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Times will be saved in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone}).</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createClass.isPending || updateClass.isPending}>
              {(createClass.isPending || updateClass.isPending) ? "Saving..." : isEditing ? "Save Changes" : "Schedule Class"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
