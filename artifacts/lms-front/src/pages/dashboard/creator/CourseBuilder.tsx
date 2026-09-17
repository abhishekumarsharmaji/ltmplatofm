import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetCreatorCourseBuilder,
  getGetCreatorCourseBuilderQueryKey,
  useUpdateCreatorCourseBasics,
  useGetCreatorCourseReadiness,
  getGetCreatorCourseReadinessQueryKey,
  usePublishCreatorCourse,
  useCreateCreatorCourseModule,
  useUpdateCreatorCourseModule,
  useDeleteCreatorCourseModule,
  useReorderCreatorCourseModules,
  useCreateCreatorCourseLesson,
  useUpdateCreatorCourseLesson,
  useDeleteCreatorCourseLesson,
  useReorderCreatorCourseLessons,
  getListCreatorProductsQueryKey
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, CheckCircle2, ChevronDown, ChevronUp, GripVertical, 
  Layout, ListVideo, MoreVertical, Plus, Settings, Video, FileText, 
  Trash, Edit2, Check, AlertCircle, PlayCircle 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function CourseBuilder({ productId }: { productId: number }) {
  const [activeTab, setActiveTab] = useState<"basics" | "curriculum" | "publish">("basics");
  
  const { data: builder, isLoading, error } = useGetCreatorCourseBuilder(productId);
  const { data: readiness } = useGetCreatorCourseReadiness(productId);
  
  if (isLoading) {
    return <div className="p-20 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }
  
  if (error || !builder) {
    return <div className="p-20 text-center text-destructive">Failed to load course builder.</div>;
  }

  const { product, modules } = builder;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4 border-b border-border pb-4">
        <Link href="/dashboard/creator/courses">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{product.title}</h1>
            <Badge variant="secondary" className={product.status === 'published' ? 'bg-success/10 text-success border-success/20' : 'bg-muted text-muted-foreground'}>
              {product.status}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">Course Builder</p>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 space-y-1">
          <TabButton 
            active={activeTab === "basics"} 
            onClick={() => setActiveTab("basics")} 
            icon={Settings} 
            label="Basics & Pricing" 
          />
          <TabButton 
            active={activeTab === "curriculum"} 
            onClick={() => setActiveTab("curriculum")} 
            icon={ListVideo} 
            label="Curriculum" 
          />
          <TabButton 
            active={activeTab === "publish"} 
            onClick={() => setActiveTab("publish")} 
            icon={CheckCircle2} 
            label="Publish" 
            badge={readiness?.ready ? undefined : <AlertCircle className="w-4 h-4 text-warning" />}
          />
        </div>
        
        <div className="flex-1 bg-card border border-border rounded-xl p-6 shadow-sm min-h-[500px]">
          {activeTab === "basics" && <BasicsTab productId={productId} product={product} />}
          {activeTab === "curriculum" && <CurriculumTab productId={productId} modules={modules || []} />}
          {activeTab === "publish" && <PublishTab productId={productId} product={product} readiness={readiness} />}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label, badge }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
        active 
          ? "bg-primary text-primary-foreground shadow-sm" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      {badge}
    </button>
  );
}

function BasicsTab({ productId, product }: { productId: number, product: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateBasics = useUpdateCreatorCourseBasics();
  
  const [title, setTitle] = useState(product.title || "");
  const [description, setDescription] = useState(product.description || "");
  const [priceMinor, setPriceMinor] = useState(product.priceMinor || 0);
  
  const lastSaved = useRef({ title: product.title, description: product.description, priceMinor: product.priceMinor });
  
  const updateBasicsRef = useRef(updateBasics.mutate);
  updateBasicsRef.current = updateBasics.mutate;
  
  const saveBasics = useCallback(() => {
    if (title === lastSaved.current.title && description === lastSaved.current.description && priceMinor === lastSaved.current.priceMinor) return;
    
    updateBasicsRef.current({
      productId,
      data: { title, description, priceMinor: Number(priceMinor), currency: "USD" }
    }, {
      onSuccess: () => {
        lastSaved.current = { title, description, priceMinor: Number(priceMinor) };
        queryClient.invalidateQueries({ queryKey: getGetCreatorCourseBuilderQueryKey(productId) });
        queryClient.invalidateQueries({ queryKey: getGetCreatorCourseReadinessQueryKey(productId) });
        queryClient.invalidateQueries({ queryKey: getListCreatorProductsQueryKey() });
        toast({ title: "Saved", description: "Course basics updated.", duration: 2000 });
      },
      onError: (error: Error) => {
        toast({
          title: "Could not save course",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  }, [productId, title, description, priceMinor, queryClient, toast]);

  useEffect(() => {
    const timer = setTimeout(saveBasics, 1000);
    return () => clearTimeout(timer);
  }, [title, description, priceMinor, saveBasics]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h2 className="text-xl font-bold">Basics</h2>
        <p className="text-muted-foreground text-sm mt-1">Define your course identity and pricing.</p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Course Title</Label>
          <Input 
            id="title" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            placeholder="e.g. Advanced TypeScript Patterns"
            className="text-lg font-medium h-12"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="desc">Description</Label>
          <Textarea 
            id="desc" 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            placeholder="What will students learn in this course?"
            className="min-h-[120px] resize-none"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="price">Price (USD cents)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input 
              id="price" 
              type="number" 
              value={priceMinor} 
              onChange={e => setPriceMinor(e.target.value ? Number(e.target.value) : 0)} 
              className="pl-7"
            />
          </div>
          <p className="text-xs text-muted-foreground">Will be displayed as ${(priceMinor / 100).toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}

function CurriculumTab({ productId, modules }: { productId: number, modules: any[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createModule = useCreateCreatorCourseModule();
  const updateModule = useUpdateCreatorCourseModule();
  const deleteModule = useDeleteCreatorCourseModule();
  const reorderModules = useReorderCreatorCourseModules();
  
  const handleAddModule = () => {
    createModule.mutate({
      productId,
      data: { title: "New Module" }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCreatorCourseBuilderQueryKey(productId) });
        queryClient.invalidateQueries({ queryKey: getGetCreatorCourseReadinessQueryKey(productId) });
      }
    });
  };

  const handleMoveModule = (currentIndex: number, direction: 'up' | 'down') => {
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === modules.length - 1) return;
    
    const newModules = [...modules];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const temp = newModules[currentIndex];
    newModules[currentIndex] = newModules[targetIndex];
    newModules[targetIndex] = temp;
    
    reorderModules.mutate({
      productId,
      data: { moduleIds: newModules.map(m => m.id) }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCreatorCourseBuilderQueryKey(productId) });
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Curriculum</h2>
          <p className="text-muted-foreground text-sm mt-1">Organize your lessons into modules.</p>
        </div>
        <Button onClick={handleAddModule} disabled={createModule.isPending}>
          <Plus className="w-4 h-4 mr-2" />
          Add Module
        </Button>
      </div>

      <div className="space-y-4">
        {modules.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
            <ListVideo className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="font-medium">No modules yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Start by adding a module to organize your lessons.</p>
            <Button variant="outline" onClick={handleAddModule} disabled={createModule.isPending}>Add Module</Button>
          </div>
        ) : (
          modules.map((mod: any, index: number) => (
            <ModuleItem 
              key={mod.id} 
              module={mod} 
              index={index} 
              total={modules.length}
              onMove={handleMoveModule}
              productId={productId}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ModuleItem({ module, index, total, onMove, productId }: any) {
  const queryClient = useQueryClient();
  const updateModule = useUpdateCreatorCourseModule();
  const deleteModule = useDeleteCreatorCourseModule();
  const createLesson = useCreateCreatorCourseLesson();
  const reorderLessons = useReorderCreatorCourseLessons();
  
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(module.title);
  
  const saveTitle = () => {
    if (title !== module.title) {
      updateModule.mutate({
        moduleId: module.id,
        data: { title }
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCreatorCourseBuilderQueryKey(productId) });
        }
      });
    }
    setIsEditing(false);
  };
  
  const handleAddLesson = () => {
    createLesson.mutate({
      moduleId: module.id,
      data: { title: "New Lesson", isPreview: false }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCreatorCourseBuilderQueryKey(productId) });
        queryClient.invalidateQueries({ queryKey: getGetCreatorCourseReadinessQueryKey(productId) });
      }
    });
  };

  const handleMoveLesson = (lessonIndex: number, direction: 'up' | 'down') => {
    const lessons = module.lessons || [];
    if (direction === 'up' && lessonIndex === 0) return;
    if (direction === 'down' && lessonIndex === lessons.length - 1) return;
    
    const newLessons = [...lessons];
    const targetIndex = direction === 'up' ? lessonIndex - 1 : lessonIndex + 1;
    const temp = newLessons[lessonIndex];
    newLessons[lessonIndex] = newLessons[targetIndex];
    newLessons[targetIndex] = temp;
    
    reorderLessons.mutate({
      moduleId: module.id,
      data: { lessonIds: newLessons.map(l => l.id) }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCreatorCourseBuilderQueryKey(productId) });
      }
    });
  };

  return (
    <div className="border border-border rounded-xl bg-muted/20 overflow-hidden">
      <div className="flex items-center justify-between p-3 bg-card border-b border-border group">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex flex-col">
            <button aria-label={`Move ${module.title} up`} onClick={() => onMove(index, 'up')} disabled={index === 0} className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronUp className="w-3 h-3" /></button>
            <button aria-label={`Move ${module.title} down`} onClick={() => onMove(index, 'down')} disabled={index === total - 1} className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronDown className="w-3 h-3" /></button>
          </div>
          <span className="text-sm font-semibold text-muted-foreground uppercase w-24">Module {index + 1}</span>
          {isEditing ? (
            <Input 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              onBlur={saveTitle}
              onKeyDown={e => e.key === 'Enter' && saveTitle()}
              autoFocus
              className="h-8 max-w-sm"
            />
          ) : (
            <h3 className="font-bold flex-1 cursor-pointer hover:text-primary" onClick={() => setIsEditing(true)}>
              {module.title}
            </h3>
          )}
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button aria-label={`Edit ${module.title}`} variant="ghost" size="icon" onClick={() => setIsEditing(!isEditing)} className="h-8 w-8">
            <Edit2 className="w-4 h-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-label={`More actions for ${module.title}`} variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleAddLesson}><Plus className="w-4 h-4 mr-2" /> Add Lesson</DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={() => {
                  if(confirm('Delete this module and all its lessons?')) {
                    deleteModule.mutate({ moduleId: module.id }, {
                      onSuccess: () => {
                        queryClient.invalidateQueries({ queryKey: getGetCreatorCourseBuilderQueryKey(productId) });
                        queryClient.invalidateQueries({ queryKey: getGetCreatorCourseReadinessQueryKey(productId) });
                      }
                    });
                  }
                }}
              >
                <Trash className="w-4 h-4 mr-2" /> Delete Module
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="p-3 space-y-2">
        {(!module.lessons || module.lessons.length === 0) ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-3">No lessons in this module.</p>
            <Button variant="outline" size="sm" onClick={handleAddLesson} disabled={createLesson.isPending}>Add First Lesson</Button>
          </div>
        ) : (
          module.lessons.map((lesson: any, lIndex: number) => (
            <LessonItem 
              key={lesson.id} 
              lesson={lesson} 
              index={lIndex} 
              total={module.lessons.length}
              onMove={handleMoveLesson}
              productId={productId}
            />
          ))
        )}
      </div>
    </div>
  );
}

function LessonItem({ lesson, index, total, onMove, productId }: any) {
  const queryClient = useQueryClient();
  const updateLesson = useUpdateCreatorCourseLesson();
  const deleteLesson = useDeleteCreatorCourseLesson();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(lesson.title);
  const [description, setDescription] = useState(lesson.description || "");
  const [isPreview, setIsPreview] = useState(lesson.isPreview || false);
  
  const saveLesson = () => {
    if (title !== lesson.title || description !== lesson.description || isPreview !== lesson.isPreview) {
      updateLesson.mutate({
        lessonId: lesson.id,
        data: { title, description, isPreview }
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCreatorCourseBuilderQueryKey(productId) });
          queryClient.invalidateQueries({ queryKey: getGetCreatorCourseReadinessQueryKey(productId) });
          toast({ title: "Lesson saved", description: "Your lesson changes are now live in this draft." });
        },
        onError: (error: Error) => {
          toast({ title: "Could not save lesson", description: error.message, variant: "destructive" });
        }
      });
    }
    setIsEditing(false);
  };
  
  if (isEditing) {
    return (
      <div className="bg-card border border-primary/30 rounded-lg p-4 shadow-sm animate-in fade-in duration-200 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm">Edit Lesson</h4>
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} autoFocus />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="resize-none" />
          </div>
          <div className="flex items-center space-x-2 pt-1">
            <Switch id={`preview-${lesson.id}`} checked={isPreview} onCheckedChange={setIsPreview} />
            <Label htmlFor={`preview-${lesson.id}`} className="text-sm font-normal">Free preview</Label>
          </div>
          <Button className="w-full" size="sm" onClick={saveLesson} disabled={updateLesson.isPending}>Save Lesson</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg group hover:border-primary/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <button aria-label={`Move ${lesson.title} up`} onClick={() => onMove(index, 'up')} disabled={index === 0} className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronUp className="w-3 h-3" /></button>
          <button aria-label={`Move ${lesson.title} down`} onClick={() => onMove(index, 'down')} disabled={index === total - 1} className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronDown className="w-3 h-3" /></button>
        </div>
        <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
          <PlayCircle className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h4 className="font-medium text-sm leading-none flex items-center gap-2">
            {lesson.title}
            {lesson.isPreview && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">Preview</Badge>}
          </h4>
          {lesson.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{lesson.description}</p>}
        </div>
      </div>
      
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button aria-label={`Edit ${lesson.title}`} variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="h-8 w-8">
          <Edit2 className="w-3.5 h-3.5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          aria-label={`Delete ${lesson.title}`}
          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => {
            if(confirm('Delete this lesson?')) {
              deleteLesson.mutate({ lessonId: lesson.id }, {
                onSuccess: () => {
                  queryClient.invalidateQueries({ queryKey: getGetCreatorCourseBuilderQueryKey(productId) });
                  queryClient.invalidateQueries({ queryKey: getGetCreatorCourseReadinessQueryKey(productId) });
                }
              });
            }
          }}
        >
          <Trash className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

function PublishTab({ productId, product, readiness }: { productId: number, product: any, readiness: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const publish = usePublishCreatorCourse();
  
  const handlePublish = () => {
    publish.mutate({ productId }, {
      onSuccess: () => {
        toast({ title: "Course published successfully!" });
        queryClient.invalidateQueries({ queryKey: getGetCreatorCourseBuilderQueryKey(productId) });
        queryClient.invalidateQueries({ queryKey: getListCreatorProductsQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Publish failed", description: err.message, variant: "destructive" });
      }
    });
  };

  const isPublished = product.status === 'published';
  const checks = readiness?.checks || {};

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h2 className="text-xl font-bold">Course Readiness</h2>
        <p className="text-muted-foreground text-sm mt-1">Review your course before making it live.</p>
      </div>

      <div className="bg-muted/30 border border-border rounded-xl p-5 space-y-4">
        <ReadinessCheck 
          passed={checks.title} 
          title="Course Title" 
          desc="Your course has a title." 
        />
        <ReadinessCheck 
          passed={checks.description} 
          title="Course Description" 
          desc="Your course has a description." 
        />
        <ReadinessCheck 
          passed={checks.module} 
          title="Modules" 
          desc={`Your course has at least one module (${readiness?.moduleCount || 0} total).`} 
        />
        <ReadinessCheck 
          passed={checks.lesson} 
          title="Lessons" 
          desc={`Your course has at least one lesson (${readiness?.lessonCount || 0} total).`} 
        />
      </div>

      <div className="pt-6 border-t border-border flex items-center justify-between">
        <div>
          <h3 className="font-bold">{isPublished ? 'Course is Live' : 'Publish Course'}</h3>
          <p className="text-sm text-muted-foreground">
            {isPublished 
              ? 'Your course is visible to students.' 
              : 'Make this course available for purchase.'}
          </p>
        </div>
        <Button 
          size="lg" 
          onClick={handlePublish}
          disabled={!readiness?.ready || isPublished || publish.isPending}
          className={isPublished ? "bg-success hover:bg-success/90 text-success-foreground" : ""}
        >
          {publish.isPending ? "Publishing..." : isPublished ? "Update Live Course" : "Publish Course"}
        </Button>
      </div>
    </div>
  );
}

function ReadinessCheck({ passed, title, desc }: { passed: boolean, title: string, desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${passed ? 'bg-success/20 text-success' : 'bg-muted border border-border text-muted-foreground'}`}>
        {passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />}
      </div>
      <div>
        <h4 className={`text-sm font-semibold ${passed ? 'text-foreground' : 'text-muted-foreground'}`}>{title}</h4>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}
