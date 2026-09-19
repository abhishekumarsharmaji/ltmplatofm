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
  useUpdateCreatorProduct,
  getListCreatorProductsQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createProduct = useCreateCreatorProduct();
  const updateProduct = useUpdateCreatorProduct();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: product?.title || "",
      description: product?.description || "",
      shortSummary: product?.shortSummary || "",
      coverImageUrl: product?.coverImageUrl || "",
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
        coverImageUrl: product.coverImageUrl || "",
        subtype: product.subtype || "",
        publicSlug: product.publicSlug || "",
      });
    }
  }, [product, form, open]);

  const isPending = createProduct.isPending || updateProduct.isPending;

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
        onSuccess: () => {
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
        onSuccess: () => {
          toast({ title: `${type === 'course' ? 'Course' : 'Product'} created successfully.` });
          queryClient.invalidateQueries({ queryKey: getListCreatorProductsQueryKey() });
          setOpen(false);
          form.reset();
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
      <DialogContent className="border-[#E5E5E5] rounded-xl p-0 gap-0 overflow-hidden sm:max-w-[450px]">
        <DialogHeader className="p-6 pb-4 border-b border-[#E5E5E5] bg-[#FAFAFA]">
          <DialogTitle className="text-[20px] font-bold text-black">{product ? 'Edit' : 'Create'} {type === 'course' ? 'Course' : 'Digital Product'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="p-6 space-y-5 bg-white">
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
                  <span className="flex items-center bg-[#FAFAFA] px-3 text-[13px] text-[#737373]">/products/</span>
                  <Input id="publicSlug" placeholder="my-digital-product" {...form.register("publicSlug")} className="h-11 flex-1 border-0 rounded-none text-[14px] focus-visible:ring-0" />
                </div>
                {form.formState.errors.publicSlug && <p className="text-[13px] font-medium text-[#E53E3E]">{form.formState.errors.publicSlug.message as string}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="coverImageUrl" className="text-[14px] font-bold text-[#394649]">Cover Image URL (optional)</Label>
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
          <div className="rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] p-4 text-[13px] text-[#4D4D4D]">
            Digital products are free to acquire in this version of CoreSkils.
          </div>
          <div className="pt-2">
            <Button type="submit" disabled={isPending} className="w-full h-11 bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[14px] shadow-[0_4px_14px_rgba(21,207,116,0.25)]">
              {isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
