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
  getListCreatorProductsQueryKey,
  useRequestCourseThumbnailUpload,
  useFinalizeCourseThumbnailUpload,
  getMarketplaceCoursesQueryKey,
  useListCategories
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

import { LessonVideoUpload } from "@/components/dashboard/LessonVideoUpload";
import { LessonResourceUpload } from "@/components/dashboard/LessonResourceUpload";
import { LiveClassesTab, LiveClassFormDialog } from "@/components/dashboard/LiveClassesTab";

export function CourseBuilder({
  productId,
  backRoute = "/dashboard/creator/courses",
  backLabel = "Course Builder",
  role = "creator"
}: {
  productId: number,
  backRoute?: string,
  backLabel?: string,
  role?: 'creator' | 'admin'
}) {
  const [activeTab, setActiveTab] = useState<"basics" | "curriculum" | "live" | "publish">("basics");

  const { data: builder, isLoading, error } = useGetCreatorCourseBuilder(productId);
  const { data: readiness } = useGetCreatorCourseReadiness(productId);

  if (isLoading) {
    return <div className="p-20 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  if (error || !builder) {
    return <div className="p-20 text-center text-destructive">Failed to load course builder.</div>;
  }

  const { product, course, modules } = builder;

  return (
    <div className="mx-auto max-w-6xl min-w-0 space-y-5 pb-20 pt-2 sm:space-y-8 sm:pt-4">
      <div className="flex min-w-0 items-start gap-3 border-b border-[#E5E5E5] pb-5 sm:items-center sm:gap-4 sm:pb-6">
        <Link href={backRoute} className="inline-flex items-center justify-center h-10 w-10 rounded-md border border-[#E5E5E5] bg-white hover:bg-gray-50 text-[#394649] transition-colors shadow-sm">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-4">
            <h1 className="min-w-0 break-words text-[22px] font-bold leading-tight tracking-tight text-black sm:text-[28px] md:text-[32px]">{product.title}</h1>
            <Badge className={product.status === 'published' ? 'bg-[#E3F9EF] text-primary hover:bg-[#E3F9EF] border-none shadow-none font-medium' : 'bg-gray-100 text-[#9794AA] hover:bg-gray-100 border-none shadow-none font-medium'}>
              {product.status}
            </Badge>
          </div>
          <p className="text-[14px] text-[#4D4D4D]">{backLabel}</p>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-4 md:flex-row md:gap-8">
        <div className="-mx-1 flex w-auto gap-2 overflow-x-auto px-1 pb-2 md:mx-0 md:block md:w-64 md:space-y-1 md:overflow-visible md:px-0 md:pb-0">
          <TabButton
            active={activeTab === "basics"}
            onClick={() => setActiveTab("basics")}
            icon={Settings}
            label="Course Details"
          />
          <TabButton
            active={activeTab === "curriculum"}
            onClick={() => setActiveTab("curriculum")}
            icon={ListVideo}
            label="Curriculum"
          />
          <TabButton
            active={activeTab === "live"}
            onClick={() => setActiveTab("live")}
            icon={Video}
            label="Live Classes"
          />
          <TabButton
            active={activeTab === "publish"}
            onClick={() => setActiveTab("publish")}
            icon={CheckCircle2}
            label="Publish"
            badge={readiness?.ready ? undefined : <AlertCircle className="w-4 h-4 text-amber-500" />}
          />
        </div>

        <div className="min-h-[500px] min-w-0 flex-1 rounded-xl border border-[#E5E5E5] bg-white p-4 shadow-sm sm:p-6 md:p-8">
          {activeTab === "basics" && <BasicsTab productId={productId} product={product} course={course} />}
          {activeTab === "curriculum" && <CurriculumTab productId={productId} modules={modules || []} />}
          {activeTab === "live" && <LiveClassesTab productId={productId} role={role} />}
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
      className={`flex min-w-max items-center justify-between rounded-md px-4 py-3 text-[14px] font-medium transition-all md:w-full ${
        active
          ? "bg-[#E3F9EF] text-primary shadow-sm"
          : "text-[#394649] hover:bg-gray-50 hover:text-primary"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-[18px] h-[18px]" />
        {label}
      </div>
      {badge}
    </button>
  );
}

function BasicsTab({ productId, product, course }: { productId: number, product: any, course: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateBasics = useUpdateCreatorCourseBasics();
  const requestUpload = useRequestCourseThumbnailUpload();
  const finalizeUpload = useFinalizeCourseThumbnailUpload();
  const { data: categories = [] } = useListCategories();

  const [title, setTitle] = useState(product.title || "");
  const [description, setDescription] = useState(product.description || "");
  const [thumbnailUrl, setThumbnailUrl] = useState(course?.thumbnailUrl || "");
  const [level, setLevel] = useState(course?.level || "beginner");
  const [outcomes, setOutcomes] = useState<string[]>(course?.outcomes || []);
  const [faqs, setFaqs] = useState<{question: string, answer: string}[]>(course?.faqs || []);
  const [categoryId, setCategoryId] = useState<string>(course?.categoryId ? String(course.categoryId) : "");
  const [publicSlug, setPublicSlug] = useState(product.publicSlug || "");
  const [priceRupees, setPriceRupees] = useState(product.priceMinor ? String(product.priceMinor / 100) : "0");
  const [accessPlan, setAccessPlan] = useState(product.accessPlan || "lifetime");
  const [accessDays, setAccessDays] = useState(product.accessDays ? String(product.accessDays) : "30");
  const [trialDays, setTrialDays] = useState(product.trialDays ? String(product.trialDays) : "0");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  useEffect(() => {
    if (course?.thumbnailUrl) {
      setThumbnailUrl(course.thumbnailUrl);
    }
  }, [course?.thumbnailUrl]);

  const handleSave = () => {
    updateBasics.mutate({
      productId,
      data: {
        title,
        description,
        thumbnailUrl: thumbnailUrl || null,
        level,
        outcomes,
        faqs,
        categoryId: categoryId ? Number(categoryId) : null,
        publicSlug,
        priceMinor: Math.round(Number(priceRupees || 0) * 100),
        currency: "INR",
        accessPlan,
        accessDays: accessPlan === "fixed_days" ? Number(accessDays) : null,
        trialDays: Number(trialDays || 0),
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCreatorCourseBuilderQueryKey(productId) });
        queryClient.invalidateQueries({ queryKey: getGetCreatorCourseReadinessQueryKey(productId) });
        queryClient.invalidateQueries({ queryKey: getListCreatorProductsQueryKey() });
        toast({ title: "Saved", description: "Course details updated." });
      },
      onError: (error: Error) => {
        toast({
          title: "Could not save course",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 10MB.", variant: "destructive" });
      return;
    }

    // Clear input so same file can be uploaded again if needed
    e.target.value = '';

    try {
      setUploadProgress(0);
      const res = await requestUpload.mutateAsync({
        productId,
        data: {
          filename: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        }
      });

      const { uploadURL, objectPath } = res;

      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadURL);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setUploadProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.responseText);
          else reject(new Error(`Upload failed with status ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.send(file);
      });

      setUploadProgress(100);

      await finalizeUpload.mutateAsync({
        productId,
        data: { objectPath }
      });

      queryClient.invalidateQueries({ queryKey: getGetCreatorCourseBuilderQueryKey(productId) });
      queryClient.invalidateQueries({ queryKey: getGetCreatorCourseReadinessQueryKey(productId) });
      queryClient.invalidateQueries({ queryKey: getMarketplaceCoursesQueryKey() });
      queryClient.invalidateQueries({ queryKey: ['getMarketplaceCourse'] });

      toast({ title: "Thumbnail uploaded successfully" });

    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadProgress(null);
    }
  };

  const addOutcome = () => setOutcomes([...outcomes, ""]);
  const updateOutcome = (index: number, val: string) => {
    const newOutcomes = [...outcomes];
    newOutcomes[index] = val;
    setOutcomes(newOutcomes);
  };
  const removeOutcome = (index: number) => {
    setOutcomes(outcomes.filter((_, i) => i !== index));
  };

  const addFaq = () => setFaqs([...faqs, { question: "", answer: "" }]);
  const updateFaq = (index: number, field: "question" | "answer", val: string) => {
    const newFaqs = [...faqs];
    newFaqs[index] = { ...newFaqs[index], [field]: val };
    setFaqs(newFaqs);
  };
  const removeFaq = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-bold text-black">Course Details</h2>
          <p className="text-[#4D4D4D] text-[14px] mt-1">Define your course identity and what students will learn.</p>
        </div>
        <Button onClick={handleSave} disabled={updateBasics.isPending} className="h-11 px-6 bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[14px] shadow-[0_4px_14px_rgba(21,207,116,0.25)]">
          {updateBasics.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="space-y-5 rounded-xl border border-[#DCE8E1] bg-[#F8FCFA] p-5">
        <div>
          <p className="font-bold text-[16px] text-black">Pricing & public listing</p>
          <p className="mt-1 text-[13px] text-[#4D4D4D]">Choose how students access this course and where it appears publicly.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Category</Label>
            <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="h-11 w-full rounded-md border border-[#D8E2DD] bg-white px-3 text-sm">
              <option value="">Select category</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Public course URL</Label>
            <div className="flex min-w-0 overflow-hidden rounded-md border border-[#D8E2DD] bg-white">
              <span className="hidden items-center bg-[#EEF5F1] px-3 text-xs text-[#607269] sm:flex">/courses/</span>
              <Input value={publicSlug} onChange={(event) => setPublicSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-"))} className="min-w-0 border-0 focus-visible:ring-0" placeholder="course-name" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Course price (₹)</Label>
            <Input type="number" min="0" step="1" value={priceRupees} onChange={(event) => setPriceRupees(event.target.value)} />
            <p className="text-xs text-[#607269]">Enter 0 for a free course.</p>
          </div>
          <div className="space-y-2">
            <Label>Access plan</Label>
            <select value={accessPlan} onChange={(event) => setAccessPlan(event.target.value)} className="h-11 w-full rounded-md border border-[#D8E2DD] bg-white px-3 text-sm">
              <option value="lifetime">Lifetime access</option>
              <option value="monthly">Monthly access (30 days)</option>
              <option value="yearly">Yearly access</option>
              <option value="fixed_days">Custom access period</option>
            </select>
          </div>
          {accessPlan === "fixed_days" && (
            <div className="space-y-2">
              <Label>Access duration (days)</Label>
              <Input type="number" min="1" value={accessDays} onChange={(event) => setAccessDays(event.target.value)} />
            </div>
          )}
          <div className="space-y-2">
            <Label>Free trial (days)</Label>
            <Input type="number" min="0" max="90" value={trialDays} onChange={(event) => setTrialDays(event.target.value)} />
            <p className="text-xs text-[#607269]">Enter 0 to disable free trial.</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-[14px] font-bold text-[#394649]">Course Title</Label>
          <Input
            id="title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Advanced TypeScript Patterns"
            className="text-[16px] font-bold text-black h-12 border-[#E5E5E5] rounded-md"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="desc" className="text-[14px] font-bold text-[#394649]">Description</Label>
          <Textarea
            id="desc"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What is this course about?"
            className="min-h-[120px] resize-none text-[15px] border-[#E5E5E5] rounded-md text-black"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Label className="text-[14px] font-bold text-[#394649]">Course Thumbnail</Label>

            <div className="relative flex aspect-video w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border-2 border-dashed border-[#E5E5E5] bg-[#FAFAFA] p-4 text-center">
              {thumbnailUrl && !uploadProgress ? (
                <>
                  <img src={thumbnailUrl} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-20 blur-xl" />
                  <img src={thumbnailUrl} alt="Thumbnail preview" className="absolute inset-0 h-full w-full object-contain" />
                  <div className="relative z-10 bg-white/90 backdrop-blur-sm p-4 rounded-lg border border-[#E5E5E5] shadow-sm">
                    <p className="text-[13px] font-bold text-black mb-3">Thumbnail is set</p>
                    <div className="flex justify-center">
                      <Label htmlFor="file-upload" className="cursor-pointer bg-primary text-white hover:bg-[#10A364] h-9 px-5 inline-flex items-center justify-center rounded-md text-[13px] font-medium transition-colors shadow-sm">
                        Replace Image
                      </Label>
                    </div>
                  </div>
                </>
              ) : uploadProgress !== null ? (
                <div className="w-full max-w-[200px] space-y-2">
                  <div className="flex justify-between text-[13px] text-[#4D4D4D] font-bold">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-[#E3F9EF] flex items-center justify-center text-primary">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-black">Upload thumbnail</p>
                    <p className="text-[12px] text-[#9794AA] mt-1">JPG, PNG, WebP up to 10MB</p>
                  </div>
                  <Label htmlFor="file-upload" className="cursor-pointer bg-primary text-white hover:bg-[#10A364] h-9 px-5 inline-flex items-center justify-center rounded-md text-[13px] font-medium transition-colors mt-2 shadow-sm">
                    Select File
                  </Label>
                </>
              )}
              <Input
                id="file-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploadProgress !== null}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnail" className="text-[12px] text-[#9794AA]">Or provide an image URL</Label>
              <Input
                id="thumbnail"
                value={thumbnailUrl}
                onChange={e => setThumbnailUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="h-10 text-[14px] border-[#E5E5E5] rounded-md"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="level" className="text-[14px] font-bold text-[#394649]">Difficulty Level</Label>
            <select
              id="level"
              value={level}
              onChange={e => setLevel(e.target.value)}
              className="flex h-11 w-full rounded-md border border-[#E5E5E5] bg-white px-3 py-2 text-[15px] font-medium text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="all-levels">All Levels</option>
            </select>
          </div>
        </div>

        {/* Outcomes */}
        <div className="space-y-5 pt-6 border-t border-[#E5E5E5]">
          <div className="flex items-center justify-between">
            <Label className="text-[16px] font-bold text-black">What you'll learn (Outcomes)</Label>
            <Button variant="outline" size="sm" onClick={addOutcome} className="border-[#DADADA] text-[#394649] bg-white hover:bg-gray-50 h-9 px-4 rounded-md font-medium text-[13px]"><Plus className="w-4 h-4 mr-2" /> Add Outcome</Button>
          </div>
          {outcomes.length === 0 ? (
            <div className="text-[14px] text-[#4D4D4D] p-5 bg-[#FAFAFA] rounded-lg border border-[#E5E5E5] text-center">
              No outcomes added yet. Add some to show students what they will achieve.
            </div>
          ) : (
            <div className="space-y-3">
              {outcomes.map((outcome, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <div className="text-primary"><CheckCircle2 className="w-5 h-5" /></div>
                  <Input
                    value={outcome}
                    onChange={(e) => updateOutcome(index, e.target.value)}
                    placeholder="e.g. Master React fundamentals"
                    className="flex-1 h-10 border-[#E5E5E5] text-[14px]"
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeOutcome(index)} className="text-[#E53E3E] hover:text-[#E53E3E] hover:bg-red-50 h-10 w-10"><Trash className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FAQs */}
        <div className="space-y-5 pt-6 border-t border-[#E5E5E5]">
          <div className="flex items-center justify-between">
            <Label className="text-[16px] font-bold text-black">Frequently Asked Questions</Label>
            <Button variant="outline" size="sm" onClick={addFaq} className="border-[#DADADA] text-[#394649] bg-white hover:bg-gray-50 h-9 px-4 rounded-md font-medium text-[13px]"><Plus className="w-4 h-4 mr-2" /> Add FAQ</Button>
          </div>
          {faqs.length === 0 ? (
            <div className="text-[14px] text-[#4D4D4D] p-5 bg-[#FAFAFA] rounded-lg border border-[#E5E5E5] text-center">
              No FAQs added yet.
            </div>
          ) : (
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="p-5 bg-white border border-[#E5E5E5] rounded-lg shadow-sm space-y-4 relative group hover:shadow-md transition-shadow">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFaq(index)}
                    className="absolute top-3 right-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-[#E53E3E] hover:text-[#E53E3E] hover:bg-red-50 h-10 w-10"
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                  <div className="pr-8 space-y-4">
                    <div>
                      <Label className="text-[12px] font-bold text-[#9794AA] uppercase tracking-wider mb-2 block">Question</Label>
                      <Input
                        value={faq.question}
                        onChange={(e) => updateFaq(index, "question", e.target.value)}
                        placeholder="e.g. Do I need prior experience?"
                        className="h-10 border-[#E5E5E5] font-bold text-[14px]"
                      />
                    </div>
                    <div>
                      <Label className="text-[12px] font-bold text-[#9794AA] uppercase tracking-wider mb-2 block">Answer</Label>
                      <Textarea
                        value={faq.answer}
                        onChange={(e) => updateFaq(index, "answer", e.target.value)}
                        placeholder="e.g. No, this course starts from the absolute basics."
                        className="resize-none min-h-[80px] border-[#E5E5E5] text-[14px]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
          <h2 className="text-[24px] font-bold text-black">Curriculum</h2>
          <p className="text-[#4D4D4D] text-[14px] mt-1">Organize your lessons into modules.</p>
        </div>
        <Button onClick={handleAddModule} disabled={createModule.isPending} className="border border-[#DADADA] text-[#394649] bg-white hover:bg-gray-50 h-9 px-4 rounded-md font-medium text-[13px]">
          <Plus className="w-4 h-4 mr-2" />
          Add Module
        </Button>
      </div>

      <div className="space-y-4">
        {modules.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-[#E5E5E5] rounded-xl bg-[#FAFAFA]">
            <ListVideo className="w-10 h-10 text-[#9794AA] mx-auto mb-3" />
            <h3 className="font-bold text-[16px] text-black">No modules yet</h3>
            <p className="text-[14px] text-[#4D4D4D] mb-6">Start by adding a module to organize your lessons.</p>
            <Button variant="outline" onClick={handleAddModule} disabled={createModule.isPending} className="border border-[#DADADA] text-[#394649] bg-white hover:bg-gray-50 h-10 px-6 rounded-md font-medium text-[14px]">Add Module</Button>
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
  const [isLiveClassFormOpen, setIsLiveClassFormOpen] = useState(false);
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
    <div className="border border-[#E5E5E5] rounded-xl bg-[#FAFAFA] overflow-hidden">
      <div className="flex items-center justify-between p-3 bg-white border-b border-[#E5E5E5] group">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex flex-col">
            <button aria-label={`Move ${module.title} up`} onClick={() => onMove(index, 'up')} disabled={index === 0} className="p-0.5 text-[#9794AA] hover:text-black disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
            <button aria-label={`Move ${module.title} down`} onClick={() => onMove(index, 'down')} disabled={index === total - 1} className="p-0.5 text-[#9794AA] hover:text-black disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
          </div>
          <span className="text-[12px] font-bold text-[#9794AA] uppercase tracking-wider w-24">Module {index + 1}</span>
          {isEditing ? (
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={e => e.key === 'Enter' && saveTitle()}
              autoFocus
              className="h-9 max-w-sm border-[#E5E5E5] text-[14px] font-bold text-black"
            />
          ) : (
            <h3 className="font-bold text-[16px] text-black flex-1 cursor-pointer hover:text-primary transition-colors" onClick={() => setIsEditing(true)}>
              {module.title}
            </h3>
          )}
        </div>
        <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <Button aria-label={`Edit ${module.title}`} variant="ghost" size="icon" onClick={() => setIsEditing(!isEditing)} className="h-10 w-10 text-[#9794AA] hover:text-black">
            <Edit2 className="w-4 h-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-label={`More actions for ${module.title}`} variant="ghost" size="icon" className="h-10 w-10 text-[#9794AA] hover:text-black"><MoreVertical className="w-4 h-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleAddLesson} className="cursor-pointer font-medium text-[13px]"><Plus className="w-4 h-4 mr-2" /> Add Lesson</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsLiveClassFormOpen(true)} className="cursor-pointer font-medium text-[13px]"><Video className="w-4 h-4 mr-2" /> Schedule Live Class</DropdownMenuItem>
              <DropdownMenuItem
                className="text-[#E53E3E] focus:text-[#E53E3E] focus:bg-red-50 cursor-pointer font-medium text-[13px]"
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
          <LiveClassFormDialog productId={productId} defaultModuleId={module.id} open={isLiveClassFormOpen} onOpenChange={setIsLiveClassFormOpen}>
            <span className="hidden" />
          </LiveClassFormDialog>
        </div>
      </div>

      <div className="p-3 space-y-2">
        {(!module.lessons || module.lessons.length === 0) ? (
          <div className="text-center py-6">
            <p className="text-[14px] text-[#4D4D4D] mb-4">No lessons in this module.</p>
            <div className="flex flex-col justify-center gap-2 sm:flex-row sm:gap-3">
              <Button className="h-10 w-full border border-[#DADADA] bg-white px-4 text-[13px] font-medium text-[#394649] hover:bg-gray-50 sm:w-auto" onClick={handleAddLesson} disabled={createLesson.isPending}>
                <Plus className="w-4 h-4 mr-2" /> Add First Lesson
              </Button>
              <Button className="h-10 w-full border border-[#DADADA] bg-white px-4 text-[13px] font-medium text-[#394649] hover:bg-gray-50 sm:w-auto" onClick={() => setIsLiveClassFormOpen(true)}>
                <Video className="w-4 h-4 mr-2" /> Schedule Live Class
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {module.lessons.map((lesson: any, lIndex: number) => (
              <LessonItem
                key={lesson.id}
                lesson={lesson}
                index={lIndex}
                total={module.lessons.length}
                onMove={handleMoveLesson}
                productId={productId}
              />
            ))}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                onClick={handleAddLesson} 
                disabled={createLesson.isPending} 
                className="flex-1 border-dashed border-[#DADADA] text-[#394649] bg-[#FAFAFA] hover:bg-white h-10 rounded-md font-medium text-[13px]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Lesson
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsLiveClassFormOpen(true)} 
                className="flex-1 border-dashed border-[#DADADA] text-[#394649] bg-[#FAFAFA] hover:bg-white h-10 rounded-md font-medium text-[13px]"
              >
                <Video className="w-4 h-4 mr-2" />
                Schedule Live Class
              </Button>
            </div>
          </div>
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
  const [showVideo, setShowVideo] = useState(false);
  const [showResources, setShowResources] = useState(false);
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
      <div className="bg-white border border-primary/30 rounded-lg p-4 shadow-[0_4px_14px_rgba(21,207,116,0.1)] animate-in fade-in duration-200 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-[14px] text-black">Edit Lesson</h4>
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="text-[#9794AA] hover:text-black">Cancel</Button>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[13px] font-bold text-[#394649]">Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} autoFocus className="h-10 border-[#E5E5E5] text-[14px]" />
          </div>
          <div className="space-y-2">
            <Label className="text-[13px] font-bold text-[#394649]">Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="resize-none border-[#E5E5E5] text-[14px]" />
          </div>
          <div className="flex items-center space-x-3 pt-2">
            <Switch id={`preview-${lesson.id}`} checked={isPreview} onCheckedChange={setIsPreview} />
            <Label htmlFor={`preview-${lesson.id}`} className="text-[14px] font-medium text-black">Free preview</Label>
          </div>
          <Button className="w-full h-10 bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[14px]" size="sm" onClick={saveLesson} disabled={updateLesson.isPending}>Save Lesson</Button>
        </div>
      </div>
    );
  }

  const asset = lesson.assets?.find((a: any) => a.kind === "video");

  return (
    <div className="flex flex-col p-3 bg-white border border-[#E5E5E5] rounded-lg group hover:shadow-md transition-shadow">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex flex-col">
            <button aria-label={`Move ${lesson.title} up`} onClick={() => onMove(index, 'up')} disabled={index === 0} className="p-0.5 text-[#9794AA] hover:text-black disabled:opacity-30"><ChevronUp className="w-3 h-3" /></button>
            <button aria-label={`Move ${lesson.title} down`} onClick={() => onMove(index, 'down')} disabled={index === total - 1} className="p-0.5 text-[#9794AA] hover:text-black disabled:opacity-30"><ChevronDown className="w-3 h-3" /></button>
          </div>
          <div
            className="w-10 h-10 rounded flex items-center justify-center cursor-pointer hover:bg-[#E3F9EF] transition-colors"
            onClick={() => setShowVideo(!showVideo)}
            title="Toggle video settings"
          >
            {asset && asset.status === 'uploaded' ? (
              <Video className="w-4 h-4 text-primary" />
            ) : (
              <PlayCircle className="w-4 h-4 text-[#9794AA]" />
            )}
          </div>
          <div className="min-w-0">
            <h4 className="flex items-center gap-2 text-[14px] font-bold leading-tight text-black">
              <span className="truncate">{lesson.title}</span>
              {lesson.isPreview && <Badge className="bg-[#E3F9EF] text-primary text-[10px] px-1.5 py-0 h-4 border-none shadow-none font-bold uppercase tracking-wider hover:bg-[#E3F9EF]">Preview</Badge>}
            </h4>
            {lesson.description && <p className="text-[12px] text-[#4D4D4D] mt-1.5 line-clamp-1">{lesson.description}</p>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-1 border-t border-[#F0F0F0] pt-2 opacity-100 transition-opacity sm:border-0 sm:pt-0 sm:opacity-0 sm:group-hover:opacity-100">
          <Button aria-label={`Manage resources for ${lesson.title}`} variant="ghost" size="icon" onClick={() => setShowResources(!showResources)} className={`h-10 w-10 ${showResources ? 'text-primary bg-[#E3F9EF]' : 'text-[#9794AA] hover:text-black'}`}>
            <FileText className="w-4 h-4" />
          </Button>
          <Button aria-label={`Manage video for ${lesson.title}`} variant="ghost" size="icon" onClick={() => setShowVideo(!showVideo)} className={`h-10 w-10 ${showVideo ? 'text-primary bg-[#E3F9EF]' : 'text-[#9794AA] hover:text-black'}`}>
            <Video className="w-4 h-4" />
          </Button>
          <Button aria-label={`Edit ${lesson.title}`} variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="h-10 w-10 text-[#9794AA] hover:text-black">
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete ${lesson.title}`}
            className="h-10 w-10 text-[#E53E3E] hover:bg-red-50 hover:text-[#E53E3E]"
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
            <Trash className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {showVideo && (
        <div className="mt-4 pt-4 border-t border-[#E5E5E5] animate-in fade-in slide-in-from-top-2">
          <LessonVideoUpload lesson={lesson} productId={productId} />
        </div>
      )}

      {showResources && (
        <div className="mt-4 pt-4 border-t border-[#E5E5E5] animate-in fade-in slide-in-from-top-2">
          <LessonResourceUpload lesson={lesson} productId={productId} />
        </div>
      )}
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
        <h2 className="text-[24px] font-bold text-black">Course Readiness</h2>
        <p className="text-[#4D4D4D] text-[14px] mt-1">Review your course before making it live.</p>
      </div>

      <div className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl p-6 space-y-5">
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

      <div className="pt-6 border-t border-[#E5E5E5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-[18px] text-black">{isPublished ? 'Course is Live' : 'Publish Course'}</h3>
          <p className="text-[14px] text-[#4D4D4D] mt-1">
            {isPublished
              ? 'Your course is visible to students.'
              : 'Make this course available for free enrollment.'}
          </p>
        </div>
        <Button
          onClick={handlePublish}
          disabled={!readiness?.ready || isPublished || publish.isPending}
          className={`h-12 px-8 font-medium rounded-md text-[15px] shadow-[0_4px_14px_rgba(21,207,116,0.25)] ${isPublished ? "bg-[#10A364] text-white opacity-80" : "bg-primary hover:bg-[#10A364] text-white"}`}
        >
          {publish.isPending ? "Publishing..." : isPublished ? "Update Live Course" : "Publish Course"}
        </Button>
      </div>
    </div>
  );
}

function ReadinessCheck({ passed, title, desc }: { passed: boolean, title: string, desc: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${passed ? 'bg-[#E3F9EF] text-primary' : 'bg-gray-100 border border-[#E5E5E5] text-[#9794AA]'}`}>
        {passed ? <CheckCircle2 className="w-4 h-4" /> : <span className="w-1.5 h-1.5 rounded-full bg-[#9794AA]/50" />}
      </div>
      <div>
        <h4 className={`text-[14px] font-bold ${passed ? 'text-black' : 'text-[#9794AA]'}`}>{title}</h4>
        <p className="text-[13px] text-[#4D4D4D] mt-1">{desc}</p>
      </div>
    </div>
  );
}
