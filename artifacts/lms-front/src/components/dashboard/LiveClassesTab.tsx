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
  const { data: builder } = useGetCreatorCourseBuilder(productId);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[24px] font-bold text-black">Live Classes</h2>
          <p className="text-[#4D4D4D] text-[14px] mt-1">Schedule and manage live sessions for this course.</p>
        </div>
        <LiveClassFormDialog productId={productId} modules={builder?.modules} open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <Button className="border border-[#DADADA] text-[#394649] bg-white hover:bg-gray-50 h-9 px-4 rounded-md font-medium text-[13px]"><Plus className="w-4 h-4 mr-2" /> Schedule Class</Button>
        </LiveClassFormDialog>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : !classes || classes.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-[#E5E5E5] rounded-xl bg-[#FAFAFA]">
          <Video className="w-10 h-10 text-[#9794AA] mx-auto mb-3" />
          <h3 className="font-bold text-[16px] text-black">No live classes scheduled</h3>
          <p className="text-[14px] text-[#4D4D4D] mb-4">Start by scheduling a live class for your students.</p>
          <LiveClassFormDialog productId={productId} modules={builder?.modules} open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <Button variant="outline" className="border border-[#DADADA] text-[#394649] bg-white hover:bg-gray-50 h-10 px-6 rounded-md font-medium text-[14px]">Schedule Class</Button>
          </LiveClassFormDialog>
        </div>
      ) : (
        <div className="space-y-4">
          {classes.map((cls) => (
            <LiveClassItem key={cls.id} liveClass={cls} productId={productId} role={role} modules={builder?.modules} />
          ))}
        </div>
      )}
    </div>
  );
}

function LiveClassItem({ liveClass, productId, role, modules }: { liveClass: LiveClass, productId: number, role: 'creator' | 'admin', modules?: any[] }) {
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
      case 'live': return 'bg-[#FFEFEB] text-[#FE543D] animate-pulse';
      case 'completed': return 'bg-[#E3F9EF] text-primary';
      case 'cancelled': return 'bg-gray-100 text-[#9794AA]';
      default: return 'bg-[#EAEFF8] text-[#224EA1]';
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white border border-[#E5E5E5] rounded-lg shadow-sm gap-4 hover:shadow-md transition-shadow">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-bold text-[16px] text-black">{liveClass.title}</h3>
          <Badge className={`font-bold text-[10px] uppercase tracking-wider border-none shadow-none ${getStatusColor(liveClass.status)}`}>
            {liveClass.status === 'live' ? 'LIVE NOW' : liveClass.status}
          </Badge>
        </div>
        <p className="text-[14px] text-[#4D4D4D] line-clamp-1">{liveClass.description || "No description provided."}</p>
        <div className="flex items-center gap-4 mt-3 text-[13px] text-[#4D4D4D] font-medium">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#9794AA]" />
            {format(parseISO(liveClass.startsAt), "MMM d, yyyy")}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#9794AA]" />
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
          <Button variant="destructive" size="sm" onClick={handleComplete} disabled={completeClass.isPending} className="h-9 px-4 bg-[#E53E3E] hover:bg-red-600 rounded-md font-medium text-[13px]">
            <CheckCircle className="mr-2 h-4 w-4" />
            {completeClass.isPending ? "Ending..." : "End Live Class"}
          </Button>
        )}
        {liveClass.status === 'scheduled' || liveClass.status === 'live' ? (
          <Link href={`/dashboard/${role}/live-classes/${liveClass.id}/classroom`}>
            <Button className={`h-9 px-4 rounded-md font-medium text-[13px] ${liveClass.status === 'live' ? 'bg-[#FE543D] hover:bg-red-600 text-white shadow-[0_4px_14px_rgba(254,84,61,0.25)]' : 'bg-primary hover:bg-[#10A364] text-white shadow-[0_4px_14px_rgba(21,207,116,0.25)]'}`} size="sm">
              <Video className="w-4 h-4 mr-2" />
              {liveClass.status === 'live' ? 'Join Class' : 'Enter Studio'}
            </Button>
          </Link>
        ) : liveClass.recordingUrl ? (
          <Button variant="outline" size="sm" className="border border-[#DADADA] text-[#394649] bg-white hover:bg-gray-50 h-9 px-4 rounded-md font-medium text-[13px]" asChild>
            <a href={liveClass.recordingUrl} target="_blank" rel="noopener noreferrer">View Recording</a>
          </Button>
        ) : null}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-[#9794AA] hover:text-black hover:bg-gray-100"><MoreVertical className="w-4 h-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <LiveClassFormDialog productId={productId} liveClass={liveClass} modules={modules} open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer font-medium text-[13px]">
                <Edit2 className="w-4 h-4 mr-2" /> Edit Details
              </DropdownMenuItem>
            </LiveClassFormDialog>
            {liveClass.status === 'scheduled' && (
              <DropdownMenuItem onClick={handleCancel} className="cursor-pointer font-medium text-[13px]">
                <XCircle className="w-4 h-4 mr-2" /> Cancel Class
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator className="bg-[#E5E5E5]" />
            <DropdownMenuItem className="text-[#E53E3E] focus:text-[#E53E3E] focus:bg-red-50 cursor-pointer font-medium text-[13px]" onClick={handleDelete}>
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

export function LiveClassFormDialog({ 
  productId, 
  liveClass, 
  children,
  open,
  onOpenChange,
  defaultModuleId,
  modules
}: { 
  productId: number, 
  liveClass?: LiveClass, 
  children: React.ReactNode,
  open: boolean,
  onOpenChange: (open: boolean) => void,
  defaultModuleId?: number | null,
  modules?: any[]
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createClass = useCreateLiveClass();
  const updateClass = useUpdateLiveClass();
  const isEditing = !!liveClass;

  const [title, setTitle] = useState(liveClass?.title || "");
  const [description, setDescription] = useState(liveClass?.description || "");
  const [moduleId, setModuleId] = useState<number | null>(liveClass?.moduleId ?? defaultModuleId ?? null);
  
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
      setModuleId(liveClass?.moduleId ?? defaultModuleId ?? null);
    }
  }, [open, liveClass, defaultModuleId]);

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

    const data = { title, description, startsAt: startIso, endsAt: endIso, timezone, moduleId };

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
            {modules && modules.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="module">Associated Module (Optional)</Label>
                <Select value={moduleId ? moduleId.toString() : "none"} onValueChange={(val) => setModuleId(val === "none" ? null : parseInt(val))}>
                  <SelectTrigger id="module">
                    <SelectValue placeholder="Select a module" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Course-wide (No specific module)</SelectItem>
                    {modules.map(m => (
                      <SelectItem key={m.id} value={m.id.toString()}>{m.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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
