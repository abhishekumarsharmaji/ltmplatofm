import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  useAdminCourseStudioCourses,
  useAdminCreators,
  useAdminCreateCourse,
  useAdminCourseOutline,
  useCreateCreatorCourseModule,
  useCreateCreatorCourseLesson,
  AdminCourse
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Sparkles, BookOpen, Users, ArrowRight, Loader2, PlayCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AdminCourseStudioList() {
  const { data: courses, isLoading, error } = useAdminCourseStudioCourses();
  const [search, setSearch] = useState("");
  
  const filtered = courses?.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase()) || 
    c.creatorName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Course Studio</h2>
          <p className="text-muted-foreground mt-1">Manage and repair all creator courses across the platform.</p>
        </div>
        <CreateCourseDialog />
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by title or creator..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-20 border border-destructive/20 bg-destructive/5 rounded-xl text-destructive">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="font-semibold text-lg">Failed to load courses</h3>
          <p className="text-sm mt-1">{error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      ) : filtered?.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
          <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-semibold text-lg">No courses found</h3>
          <p className="text-muted-foreground text-sm mt-1 mb-6">Create a course manually or generate one with AI.</p>
          <CreateCourseDialog />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered?.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}

function CourseCard({ course }: { course: AdminCourse }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/50 transition-colors flex flex-col group relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
      <div className="flex justify-between items-start mb-4">
        <Badge variant="outline" className="bg-muted text-xs capitalize">
          {course.status}
        </Badge>
        <span className="font-semibold text-sm text-foreground">
          ${(course.priceMinor / 100).toFixed(2)} {course.currency}
        </span>
      </div>
      
      <h3 className="font-bold text-lg leading-tight mb-2 line-clamp-2" title={course.title}>
        {course.title}
      </h3>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
        {course.description || "No description provided."}
      </p>

      <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border">
        <div className="flex items-center gap-1.5 truncate pr-2">
          <Users className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{course.creatorName}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0 font-medium">
          <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {course.moduleCount}</span>
          <span className="flex items-center gap-1"><PlayCircle className="w-3.5 h-3.5" /> {course.lessonCount}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border flex">
        {course.productId ? (
          <Link href={`/dashboard/admin/courses/${course.productId}/studio`} className="w-full inline-flex items-center justify-between whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-10 px-4 py-2 bg-primary/5 hover:bg-primary/10 text-primary">
            Open Studio <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <span className="w-full text-sm text-destructive">Linked course product is missing</span>
        )}
      </div>
    </div>
  );
}

function CreateCourseDialog() {
  const [open, setOpen] = useState(false);
  const [creatorId, setCreatorId] = useState("");
  const { data: creators, isLoading: creatorsLoading } = useAdminCreators();
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          New Course
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl overflow-hidden p-0 gap-0">
        <DialogHeader className="p-6 pb-2 border-b border-border bg-muted/20">
          <DialogTitle className="text-2xl">Create Course</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">Assign a new course to a creator.</p>
          
          <div className="pt-4 pb-2">
            <Label className="mb-2 block">1. Select Creator</Label>
            <Select value={creatorId} onValueChange={setCreatorId}>
              <SelectTrigger>
                <SelectValue placeholder={creatorsLoading ? "Loading creators..." : "Choose a creator"} />
              </SelectTrigger>
              <SelectContent>
                {creators?.map((c: any) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name} ({c.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </DialogHeader>

        {creatorId ? (
          <Tabs defaultValue="manual" className="w-full flex flex-col h-[500px]">
            <TabsList className="w-full justify-start rounded-none border-b border-border bg-card px-6 h-12">
              <TabsTrigger value="manual" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md px-4">Manual Entry</TabsTrigger>
              <TabsTrigger value="ai" className="data-[state=active]:bg-brand/10 data-[state=active]:text-brand rounded-md px-4">
                <Sparkles className="w-3.5 h-3.5 mr-2 text-brand" />
                AI Curriculum Builder
              </TabsTrigger>
            </TabsList>
            
            <div className="flex-1 overflow-y-auto p-6 bg-card">
              <TabsContent value="manual" className="m-0 h-full">
                <ManualCourseForm creatorId={Number(creatorId)} onSuccess={() => setOpen(false)} />
              </TabsContent>
              <TabsContent value="ai" className="m-0 h-full">
                <AICourseForm creatorId={Number(creatorId)} onSuccess={() => setOpen(false)} />
              </TabsContent>
            </div>
          </Tabs>
        ) : (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center h-[400px]">
            <Users className="w-12 h-12 mb-4 opacity-20" />
            <p>Select a creator above to continue.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ManualCourseForm({ creatorId, onSuccess }: { creatorId: number, onSuccess: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceMinor, setPriceMinor] = useState(0);
  
  const createCourse = useAdminCreateCourse();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    
    createCourse.mutate({
      data: { creatorId, title, description, priceMinor: Number(priceMinor), currency: "USD" }
    }, {
      onSuccess: (res) => {
        toast({ title: "Course created successfully" });
        onSuccess();
        if (res.productId) {
          setLocation(`/dashboard/admin/courses/${res.productId}/studio`);
        }
      },
      onError: (err: Error) => {
        toast({ title: "Creation failed", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Course Title</Label>
        <Input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Complete React Bootcamp" />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea required value={description} onChange={e => setDescription(e.target.value)} rows={4} />
      </div>
      <div className="space-y-2">
        <Label>Price (USD cents)</Label>
        <Input type="number" required value={priceMinor} onChange={e => setPriceMinor(Number(e.target.value))} />
      </div>
      <div className="pt-4 flex justify-end">
        <Button type="submit" disabled={createCourse.isPending}>
          {createCourse.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Create Course
        </Button>
      </div>
    </form>
  );
}

function AICourseForm({ creatorId, onSuccess }: { creatorId: number, onSuccess: () => void }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const generateOutline = useAdminCourseOutline();
  const createCourse = useAdminCreateCourse();
  const createModule = useCreateCreatorCourseModule();
  const createLesson = useCreateCreatorCourseLesson();

  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("Beginners");
  const [level, setLevel] = useState("beginner");
  const [sectionCount, setSectionCount] = useState([3]);
  
  const [draft, setDraft] = useState<any | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) return;
    
    generateOutline.mutate({
      data: { topic, audience, level, sectionCount: sectionCount[0] }
    }, {
      onSuccess: (res) => {
        setDraft(res);
      },
      onError: (err: Error) => {
        toast({ title: "AI Generation failed", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleApply = async () => {
    if (!draft) return;
    setIsApplying(true);
    try {
      // 1. Create canonical course
       const courseRes = await createCourse.mutateAsync({
        data: { 
          creatorId, 
          title: draft.title, 
          description: draft.description, 
          priceMinor: 0, 
          currency: "USD" 
        }
      });
      
      const productId = courseRes.productId;
      if (!productId) throw new Error("Course created but missing productId");

      // 2. Apply modules and lessons
      for (const section of draft.sections) {
        const modRes: any = await createModule.mutateAsync({
          productId,
          data: { title: section.title }
        });
        
        if (section.lessons) {
          for (const lesson of section.lessons) {
            await createLesson.mutateAsync({
              moduleId: modRes.id,
              data: { title: lesson.title, isPreview: false }
            });
          }
        }
      }
      
      toast({ title: "AI Course built successfully!" });
      onSuccess();
      setLocation(`/dashboard/admin/courses/${productId}/studio`);
      
    } catch (err: any) {
      toast({ title: "Failed to apply AI draft", description: err.message, variant: "destructive" });
    } finally {
      setIsApplying(false);
    }
  };

  if (draft) {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="bg-brand/5 border border-brand/20 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-brand font-semibold mb-2">
            <Sparkles className="w-4 h-4" />
            Review Generated Draft
          </div>
          
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Title</Label>
              <Input value={draft.title} onChange={e => setDraft({...draft, title: e.target.value})} className="font-bold border-brand/20 bg-card" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Description</Label>
              <Textarea value={draft.description} onChange={e => setDraft({...draft, description: e.target.value})} rows={3} className="border-brand/20 bg-card" />
            </div>
            
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Curriculum ({draft.sections?.length || 0} Modules)</Label>
              <div className="space-y-3">
                {draft.sections?.map((sec: any, i: number) => (
                  <div key={i} className="border border-border bg-card rounded p-3">
                    <Input value={sec.title} onChange={e => {
                      const newSecs = [...draft.sections];
                      newSecs[i].title = e.target.value;
                      setDraft({...draft, sections: newSecs});
                    }} className="font-semibold h-8 mb-2" />
                    
                    <div className="pl-4 border-l-2 border-muted space-y-2">
                      {sec.lessons?.map((les: any, j: number) => (
                        <div key={j} className="flex items-center gap-2">
                          <PlayCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <Input value={les.title} onChange={e => {
                            const newSecs = [...draft.sections];
                            newSecs[i].lessons[j].title = e.target.value;
                            setDraft({...draft, sections: newSecs});
                          }} className="h-7 text-sm" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 justify-end pt-2">
          <Button variant="outline" onClick={() => setDraft(null)} disabled={isApplying}>Discard & Restart</Button>
          <Button onClick={handleApply} disabled={isApplying} className="bg-brand hover:bg-brand/90 text-brand-foreground">
            {isApplying && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Confirm & Build Course
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleGenerate} className="space-y-5">
      <div className="space-y-2">
        <Label>Topic</Label>
        <Input required value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Advanced System Design in Node.js" />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Target Audience</Label>
          <Input required value={audience} onChange={e => setAudience(e.target.value)} placeholder="e.g. Frontend Developers" />
        </div>
        <div className="space-y-2">
          <Label>Level</Label>
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
              <SelectItem value="expert">Expert</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <div className="flex justify-between items-center">
          <Label>Number of Modules</Label>
          <span className="font-bold text-sm bg-muted px-2 py-1 rounded">{sectionCount[0]}</span>
        </div>
        <Slider 
          min={1} max={10} step={1} 
          value={sectionCount} 
          onValueChange={setSectionCount} 
        />
      </div>

      <div className="pt-6">
        <Button type="submit" disabled={generateOutline.isPending} className="w-full bg-brand hover:bg-brand/90 text-brand-foreground">
          {generateOutline.isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing Topic...</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" /> Generate Curriculum Draft</>
          )}
        </Button>
      </div>
    </form>
  );
}
