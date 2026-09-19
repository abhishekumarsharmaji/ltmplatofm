import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  useCreateCreatorProduct, 
  useFinalizeCourseThumbnailUpload,
  useRequestCourseThumbnailUpload,
  useUpdateCreatorProduct,
  getListCreatorProductsQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ImagePlus } from "lucide-react";

const schema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().min(1, "Add a description before publishing"),
  shortSummary: z.string().max(180, "Keep the summary under 180 characters").optional(),
  coverImageUrl: z.union([z.literal(""), z.string().url("Enter a valid image URL")]).optional(),
  subtype: z.string().optional(),
  publicSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only").min(3, "Use at least 3 characters").max(80).optional().or(z.literal("")),
});

export function ProductFormDialog({ 
  type, 
  product,
  children 
}: { 
  type: "course" | "digital"; 
  product?: { id: number; title: string; description: string; shortSummary?: string | null; coverImageUrl?: string | null; subtype?: string | null; publicSlug?: string | null };
  children: React.ReactNode 
}) {
  const [open, setOpen] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(product?.coverImageUrl || null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createProduct = useCreateCreatorProduct();
  const updateProduct = useUpdateCreatorProduct();
  const requestThumbnailUpload = useRequestCourseThumbnailUpload();
  const finalizeThumbnailUpload = useFinalizeCourseThumbnailUpload();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: product?.title || "",
      description: product?.description || "",
      shortSummary: product?.shortSummary || "",
      coverImageUrl: product?.coverImageUrl?.startsWith("http") ? product.coverImageUrl : "",
      subtype: product?.subtype || "",
      publicSlug: product?.publicSlug || "",
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        title: product.title,
        description: product.description,
        shortSummary: product.shortSummary || "",
        coverImageUrl: product.coverImageUrl?.startsWith("http") ? product.coverImageUrl : "",
        subtype: product.subtype || "",
        publicSlug: product.publicSlug || "",
      });
    }
    setCoverFile(null);
    setCoverPreview(product?.coverImageUrl || null);
  }, [product, form, open]);

  useEffect(() => () => {
    if (coverPreview?.startsWith("blob:")) URL.revokeObjectURL(coverPreview);
  }, [coverPreview]);

  const isPending = createProduct.isPending || updateProduct.isPending || requestThumbnailUpload.isPending || finalizeThumbnailUpload.isPending;

  const handleCoverSelection = (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) {
      toast({ title: "Choose a JPG, PNG or WebP image up to 10MB.", variant: "destructive" });
      return;
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const uploadCover = async (productId: number, file: File) => {
    const { uploadURL, objectPath } = await requestThumbnailUpload.mutateAsync({
      productId,
      data: { filename: file.name, mimeType: file.type, sizeBytes: file.size },
    });
    const upload = await fetch(uploadURL, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!upload.ok) throw new Error("Thumbnail upload failed");
    await finalizeThumbnailUpload.mutateAsync({ productId, data: { objectPath } });
  };

  const onSubmit = form.handleSubmit((data) => {
    const submitData = {
      ...data,
      priceMinor: 0,
      type,
      currency: "usd",
    };

    if (product) {
      updateProduct.mutate({
        id: product.id,
        data: submitData
      } as any, {
        onSuccess: async () => {
          if (coverFile) {
            try {
              await uploadCover(product.id, coverFile);
            } catch (error: any) {
              toast({ title: "Product updated, but thumbnail upload failed.", description: error?.message, variant: "destructive" });
              return;
            }
          }
          toast({ title: `${type === 'course' ? 'Course' : 'Product'} updated successfully.` });
          queryClient.invalidateQueries({ queryKey: getListCreatorProductsQueryKey() });
          setOpen(false);
        },
        onError: () => {
          toast({ title: "Failed to update.", variant: "destructive" });
        }
      });
    } else {
      createProduct.mutate({
        data: submitData
      } as any, {
        onSuccess: async (createdProduct) => {
          if (coverFile) {
            try {
              await uploadCover(createdProduct.id, coverFile);
            } catch (error: any) {
              toast({ title: "Product created, but thumbnail upload failed.", description: error?.message, variant: "destructive" });
            }
          }
          toast({ title: `${type === 'course' ? 'Course' : 'Product'} created successfully.` });
          queryClient.invalidateQueries({ queryKey: getListCreatorProductsQueryKey() });
          setOpen(false);
          form.reset();
          if (type === "digital") {
            setLocation(`/dashboard/creator/products/${createdProduct.id}/manage`);
          }
        },
        onError: () => {
          toast({ title: "Failed to create.", variant: "destructive" });
        }
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden border-[#E5E5E5] rounded-xl p-0 gap-0 sm:max-w-[450px]">
        <DialogHeader className="p-4 sm:p-6 pb-4 border-b border-[#E5E5E5] bg-[#FAFAFA]">
          <DialogTitle className="text-[20px] font-bold text-black">{product ? 'Edit' : 'Create'} {type === 'course' ? 'Course' : 'Digital Product'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="min-h-0 overflow-y-auto p-4 sm:p-6 space-y-5 bg-white">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-[14px] font-bold text-[#394649]">Title</Label>
            <Input id="title" {...form.register("title")} className="h-11 border-[#E5E5E5] rounded-md text-[14px]" />
            {form.formState.errors.title && (
              <p className="text-[13px] text-[#E53E3E] font-medium">{form.formState.errors.title?.message as string}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-[14px] font-bold text-[#394649]">Description</Label>
            <Input id="description" {...form.register("description")} className="h-11 border-[#E5E5E5] rounded-md text-[14px]" />
            {form.formState.errors.description && <p className="text-[13px] font-medium text-[#E53E3E]">{form.formState.errors.description.message as string}</p>}
          </div>
          {type === "digital" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="shortSummary" className="text-[14px] font-bold text-[#394649]">Short Summary</Label>
                <Input id="shortSummary" placeholder="A quick description for marketplace cards" {...form.register("shortSummary")} className="h-11 border-[#E5E5E5] rounded-md text-[14px]" />
                {form.formState.errors.shortSummary && <p className="text-[13px] font-medium text-[#E53E3E]">{form.formState.errors.shortSummary.message as string}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="publicSlug" className="text-[14px] font-bold text-[#394649]">Custom Share Link</Label>
                <div className="flex h-11 overflow-hidden rounded-md border border-[#E5E5E5]">
                  <span className="flex items-center bg-[#FAFAFA] px-2 sm:px-3 text-[12px] sm:text-[13px] text-[#737373] whitespace-nowrap">/products/</span>
                  <Input id="publicSlug" placeholder="my-digital-product" {...form.register("publicSlug")} className="h-11 flex-1 border-0 rounded-none text-[14px] focus-visible:ring-0 min-w-0" />
                </div>
                {form.formState.errors.publicSlug && <p className="text-[13px] font-medium text-[#E53E3E]">{form.formState.errors.publicSlug.message as string}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-[14px] font-bold text-[#394649]">Product Thumbnail</Label>
                <div className="relative flex min-h-[144px] items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-[#DADADA] bg-[#FAFAFA]">
                  {coverPreview ? (
                    <img src={coverPreview} alt="Product thumbnail preview" className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-center text-[#737373] p-4">
                      <ImagePlus className="h-8 w-8 text-primary" />
                      <span className="text-[13px]">JPG, PNG or WebP up to 10MB</span>
                    </div>
                  )}
                  <Label
                    htmlFor={`cover-upload-${product?.id ?? "new"}`}
                    className="relative z-10 cursor-pointer rounded-md bg-white/95 px-4 py-2 text-[13px] font-bold text-[#394649] shadow-sm hover:bg-white transition-colors"
                  >
                    {coverPreview ? "Replace Thumbnail" : "Upload Thumbnail"}
                  </Label>
                  <Input
                    id={`cover-upload-${product?.id ?? "new"}`}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(event) => {
                      handleCoverSelection(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="coverImageUrl" className="text-[12px] text-[#737373]">Or provide a Cover Image URL (optional)</Label>
                <Input id="coverImageUrl" placeholder="https://example.com/cover.jpg" {...form.register("coverImageUrl")} className="h-11 border-[#E5E5E5] rounded-md text-[14px]" />
                {form.formState.errors.coverImageUrl && <p className="text-[13px] font-medium text-[#E53E3E]">{form.formState.errors.coverImageUrl.message as string}</p>}
              </div>
            </>
          )}
          {type === "digital" && (
            <div className="space-y-2">
              <Label htmlFor="subtype" className="text-[14px] font-bold text-[#394649]">Product Type</Label>
              <Select value={form.watch("subtype")} onValueChange={(v) => form.setValue("subtype", v, { shouldDirty: true })}>
                <SelectTrigger className="h-11 border-[#E5E5E5] rounded-md text-[14px]">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ebook">E-Book</SelectItem>
                  <SelectItem value="guide">Guide / Notes</SelectItem>
                  <SelectItem value="workbook">Workbook / Worksheet</SelectItem>
                  <SelectItem value="checklist">Checklist</SelectItem>
                  <SelectItem value="planner">Planner</SelectItem>
                  <SelectItem value="template">Template</SelectItem>
                  <SelectItem value="spreadsheet">Spreadsheet / Calculator</SelectItem>
                  <SelectItem value="presentation">Presentation</SelectItem>
                  <SelectItem value="design_asset">Design Asset / UI Kit</SelectItem>
                  <SelectItem value="photo_preset">Photo Preset / LUT</SelectItem>
                  <SelectItem value="audio">Audio / Music Pack</SelectItem>
                  <SelectItem value="video">Video / Recorded Class</SelectItem>
                  <SelectItem value="code">Source Code / Script</SelectItem>
                  <SelectItem value="plugin">Plugin / Theme</SelectItem>
                  <SelectItem value="prompt_pack">AI Prompt Pack</SelectItem>
                  <SelectItem value="toolkit">Toolkit</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="bundle">Bundle</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] p-4 text-[13px] text-[#4D4D4D] leading-relaxed">
            Digital products are free to acquire in this version of CoreSkils.
          </div>
          <div className="sticky bottom-0 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 border-t border-[#E5E5E5] bg-white px-4 sm:px-6 py-4">
            <Button type="submit" disabled={isPending} className="w-full h-11 bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[14px] shadow-[0_4px_14px_rgba(21,207,116,0.25)]">
              {isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
