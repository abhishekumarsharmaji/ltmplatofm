import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, LayoutTemplate } from "lucide-react";
import { 
  useUpdateCreatorProduct, 
  getListCreatorProductsQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  tagline: z.string().optional(),
  ctaLabel: z.string().optional(),
  benefits: z.array(z.object({ value: z.string().min(1, "Cannot be empty") })).optional(),
  targetAudience: z.array(z.object({ value: z.string().min(1, "Cannot be empty") })).optional(),
  includedItems: z.array(z.object({ value: z.string().min(1, "Cannot be empty") })).optional(),
  sections: z.array(z.object({ 
    heading: z.string().min(1, "Heading is required"), 
    body: z.string().min(1, "Body is required") 
  })).optional(),
  testimonials: z.array(z.object({ 
    name: z.string().min(1, "Name is required"), 
    quote: z.string().min(1, "Quote is required") 
  })).optional(),
  faqs: z.array(z.object({ 
    question: z.string().min(1, "Question is required"), 
    answer: z.string().min(1, "Answer is required") 
  })).optional(),
  supportEmail: z.union([z.literal(""), z.string().email("Enter a valid email")]).optional(),
  terms: z.string().optional()
});

type FormData = z.infer<typeof schema>;

export function SalesPageEditor({ product }: { product: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateProduct = useUpdateCreatorProduct();

  const [isExpanded, setIsExpanded] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      tagline: product.salesPage?.tagline || "",
      ctaLabel: product.salesPage?.ctaLabel || "",
      benefits: product.salesPage?.benefits?.map((b: string) => ({ value: b })) || [],
      targetAudience: product.salesPage?.targetAudience?.map((t: string) => ({ value: t })) || [],
      includedItems: product.salesPage?.includedItems?.map((i: string) => ({ value: i })) || [],
      sections: product.salesPage?.sections || [],
      testimonials: product.salesPage?.testimonials || [],
      faqs: product.salesPage?.faqs || [],
      supportEmail: product.salesPage?.supportEmail || "",
      terms: product.salesPage?.terms || ""
    }
  });

  const { control, register, handleSubmit, formState: { errors } } = form;

  const benefitsArray = useFieldArray({ control, name: "benefits" });
  const audienceArray = useFieldArray({ control, name: "targetAudience" });
  const itemsArray = useFieldArray({ control, name: "includedItems" });
  const sectionsArray = useFieldArray({ control, name: "sections" });
  const testimonialsArray = useFieldArray({ control, name: "testimonials" });
  const faqsArray = useFieldArray({ control, name: "faqs" });

  const onSubmit = handleSubmit((data) => {
    const salesPage = {
      tagline: data.tagline,
      ctaLabel: data.ctaLabel,
      benefits: data.benefits?.map(b => b.value),
      targetAudience: data.targetAudience?.map(t => t.value),
      includedItems: data.includedItems?.map(i => i.value),
      sections: data.sections,
      testimonials: data.testimonials,
      faqs: data.faqs,
      supportEmail: data.supportEmail,
      terms: data.terms
    };

    updateProduct.mutate({
      id: product.id,
      data: {
        salesPage
      }
    } as any, {
      onSuccess: () => {
        toast({ title: "Sales page saved successfully." });
        queryClient.invalidateQueries({ queryKey: getListCreatorProductsQueryKey() });
        setIsExpanded(false);
      },
      onError: () => {
        toast({ title: "Failed to save sales page.", variant: "destructive" });
      }
    });
  });

  if (!isExpanded) {
    return (
      <div className="bg-white border border-[#E5E5E5] rounded-xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-[18px] font-bold text-black flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-primary" />
            Sales Page
          </h3>
          <p className="text-[13px] text-[#4D4D4D] mt-1">Design the public landing page for this product.</p>
        </div>
        <Button type="button" onClick={() => setIsExpanded(true)} variant="outline" className="border-[#DADADA] text-[#394649]">
          Edit Sales Page
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E5E5E5] rounded-xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-[#E5E5E5] bg-[#FAFAFA] flex justify-between items-center">
        <div>
          <h3 className="text-[18px] font-bold text-black flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-primary" />
            Sales Page Editor
          </h3>
          <p className="text-[13px] text-[#4D4D4D] mt-1">Make your product shine. Leave fields blank to hide them.</p>
        </div>
        <Button type="button" onClick={() => setIsExpanded(false)} variant="ghost" className="text-[#737373]">
          Cancel
        </Button>
      </div>

      <form onSubmit={onSubmit} className="p-6 space-y-10">
        
        {/* Core Settings */}
        <div className="space-y-6">
          <h4 className="text-[16px] font-bold text-black border-b border-[#E5E5E5] pb-2">Hero Section</h4>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[14px] font-bold text-[#394649]">Tagline</Label>
              <Input placeholder="A catchy subtitle for your product" {...register("tagline")} className="h-11 border-[#E5E5E5] rounded-md text-[14px]" />
            </div>
            <div className="space-y-2">
              <Label className="text-[14px] font-bold text-[#394649]">Button CTA Label</Label>
              <Input placeholder="e.g. Get Instant Access" {...register("ctaLabel")} className="h-11 border-[#E5E5E5] rounded-md text-[14px]" />
            </div>
          </div>
        </div>

        {/* Benefits & Audience */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-[#E5E5E5] pb-2">
              <h4 className="text-[16px] font-bold text-black">Key Benefits</h4>
              <Button type="button" onClick={() => benefitsArray.append({ value: "" })} variant="ghost" size="sm" className="h-8 text-primary hover:text-primary">
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
            {benefitsArray.fields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input placeholder="e.g. Save 10+ hours a week" {...register(`benefits.${index}.value` as const)} className="h-10 border-[#E5E5E5] rounded-md text-[14px]" />
                <Button type="button" onClick={() => benefitsArray.remove(index)} variant="ghost" size="icon" className="shrink-0 text-[#9794AA] hover:text-[#E53E3E]">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {benefitsArray.fields.length === 0 && <p className="text-[13px] text-[#737373] italic">No benefits added yet.</p>}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-[#E5E5E5] pb-2">
              <h4 className="text-[16px] font-bold text-black">Target Audience</h4>
              <Button type="button" onClick={() => audienceArray.append({ value: "" })} variant="ghost" size="sm" className="h-8 text-primary hover:text-primary">
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
            {audienceArray.fields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input placeholder="e.g. Freelance designers" {...register(`targetAudience.${index}.value` as const)} className="h-10 border-[#E5E5E5] rounded-md text-[14px]" />
                <Button type="button" onClick={() => audienceArray.remove(index)} variant="ghost" size="icon" className="shrink-0 text-[#9794AA] hover:text-[#E53E3E]">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {audienceArray.fields.length === 0 && <p className="text-[13px] text-[#737373] italic">No audiences added yet.</p>}
          </div>
        </div>

        {/* Included Items */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#E5E5E5] pb-2">
            <h4 className="text-[16px] font-bold text-black">What's Included</h4>
            <Button type="button" onClick={() => itemsArray.append({ value: "" })} variant="ghost" size="sm" className="h-8 text-primary hover:text-primary">
              <Plus className="w-4 h-4 mr-1" /> Add Item
            </Button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {itemsArray.fields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input placeholder="e.g. 50+ Page PDF Guide" {...register(`includedItems.${index}.value` as const)} className="h-10 border-[#E5E5E5] rounded-md text-[14px]" />
                <Button type="button" onClick={() => itemsArray.remove(index)} variant="ghost" size="icon" className="shrink-0 text-[#9794AA] hover:text-[#E53E3E]">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          {itemsArray.fields.length === 0 && <p className="text-[13px] text-[#737373] italic">No included items added yet.</p>}
        </div>

        {/* Sections */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#E5E5E5] pb-2">
            <h4 className="text-[16px] font-bold text-black">Content Sections</h4>
            <Button type="button" onClick={() => sectionsArray.append({ heading: "", body: "" })} variant="ghost" size="sm" className="h-8 text-primary hover:text-primary">
              <Plus className="w-4 h-4 mr-1" /> Add Section
            </Button>
          </div>
          {sectionsArray.fields.map((field, index) => (
            <div key={field.id} className="p-4 border border-[#E5E5E5] bg-[#FAFAFA] rounded-lg relative space-y-3">
              <Button type="button" onClick={() => sectionsArray.remove(index)} variant="ghost" size="icon" className="absolute top-2 right-2 text-[#9794AA] hover:text-[#E53E3E]">
                <Trash2 className="w-4 h-4" />
              </Button>
              <div className="space-y-2 pr-8">
                <Label className="text-[13px] font-bold">Heading</Label>
                <Input placeholder="e.g. Why I created this" {...register(`sections.${index}.heading` as const)} className="border-[#E5E5E5] rounded-md text-[14px]" />
                {errors.sections?.[index]?.heading && <p className="text-[12px] text-[#E53E3E]">{errors.sections[index]?.heading?.message}</p>}
              </div>
              <div className="space-y-2 pr-8">
                <Label className="text-[13px] font-bold">Body Content</Label>
                <Textarea placeholder="Write the detailed section content here..." {...register(`sections.${index}.body` as const)} className="min-h-[100px] border-[#E5E5E5] rounded-md text-[14px]" />
                {errors.sections?.[index]?.body && <p className="text-[12px] text-[#E53E3E]">{errors.sections[index]?.body?.message}</p>}
              </div>
            </div>
          ))}
          {sectionsArray.fields.length === 0 && <p className="text-[13px] text-[#737373] italic">No sections added yet.</p>}
        </div>

        {/* Testimonials */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#E5E5E5] pb-2">
            <h4 className="text-[16px] font-bold text-black">Testimonials</h4>
            <Button type="button" onClick={() => testimonialsArray.append({ name: "", quote: "" })} variant="ghost" size="sm" className="h-8 text-primary hover:text-primary">
              <Plus className="w-4 h-4 mr-1" /> Add Testimonial
            </Button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {testimonialsArray.fields.map((field, index) => (
              <div key={field.id} className="p-4 border border-[#E5E5E5] bg-[#FAFAFA] rounded-lg relative space-y-3">
                <Button type="button" onClick={() => testimonialsArray.remove(index)} variant="ghost" size="icon" className="absolute top-2 right-2 text-[#9794AA] hover:text-[#E53E3E]">
                  <Trash2 className="w-4 h-4" />
                </Button>
                <div className="space-y-2 pr-8">
                  <Label className="text-[13px] font-bold">Name</Label>
                  <Input placeholder="e.g. Jane Doe" {...register(`testimonials.${index}.name` as const)} className="border-[#E5E5E5] rounded-md text-[14px]" />
                </div>
                <div className="space-y-2 pr-8">
                  <Label className="text-[13px] font-bold">Quote</Label>
                  <Textarea placeholder="What did they say?" {...register(`testimonials.${index}.quote` as const)} className="min-h-[80px] border-[#E5E5E5] rounded-md text-[14px]" />
                </div>
              </div>
            ))}
          </div>
          {testimonialsArray.fields.length === 0 && <p className="text-[13px] text-[#737373] italic">No testimonials added yet.</p>}
        </div>

        {/* FAQs */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#E5E5E5] pb-2">
            <h4 className="text-[16px] font-bold text-black">FAQs</h4>
            <Button type="button" onClick={() => faqsArray.append({ question: "", answer: "" })} variant="ghost" size="sm" className="h-8 text-primary hover:text-primary">
              <Plus className="w-4 h-4 mr-1" /> Add FAQ
            </Button>
          </div>
          {faqsArray.fields.map((field, index) => (
            <div key={field.id} className="p-4 border border-[#E5E5E5] bg-[#FAFAFA] rounded-lg relative space-y-3">
              <Button type="button" onClick={() => faqsArray.remove(index)} variant="ghost" size="icon" className="absolute top-2 right-2 text-[#9794AA] hover:text-[#E53E3E]">
                <Trash2 className="w-4 h-4" />
              </Button>
              <div className="space-y-2 pr-8">
                <Label className="text-[13px] font-bold">Question</Label>
                <Input placeholder="e.g. Is this a one-time purchase?" {...register(`faqs.${index}.question` as const)} className="border-[#E5E5E5] rounded-md text-[14px]" />
              </div>
              <div className="space-y-2 pr-8">
                <Label className="text-[13px] font-bold">Answer</Label>
                <Textarea placeholder="Detailed answer..." {...register(`faqs.${index}.answer` as const)} className="min-h-[80px] border-[#E5E5E5] rounded-md text-[14px]" />
              </div>
            </div>
          ))}
          {faqsArray.fields.length === 0 && <p className="text-[13px] text-[#737373] italic">No FAQs added yet.</p>}
        </div>

        {/* Support & Terms */}
        <div className="space-y-6">
          <h4 className="text-[16px] font-bold text-black border-b border-[#E5E5E5] pb-2">Footer Details</h4>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[14px] font-bold text-[#394649]">Support Email</Label>
              <Input type="email" placeholder="support@example.com" {...register("supportEmail")} className="h-11 border-[#E5E5E5] rounded-md text-[14px]" />
              {errors.supportEmail && <p className="text-[12px] text-[#E53E3E]">{errors.supportEmail.message}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-[14px] font-bold text-[#394649]">Terms / License</Label>
              <Input placeholder="e.g. For personal use only" {...register("terms")} className="h-11 border-[#E5E5E5] rounded-md text-[14px]" />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-[#E5E5E5] flex justify-end gap-3">
          <Button type="button" onClick={() => setIsExpanded(false)} variant="ghost" className="text-[#737373]">
            Cancel
          </Button>
          <Button type="submit" disabled={updateProduct.isPending} className="bg-primary hover:bg-[#10A364] text-white px-8 shadow-[0_4px_14px_rgba(21,207,116,0.25)]">
            {updateProduct.isPending ? "Saving..." : "Save Sales Page"}
          </Button>
        </div>
      </form>
    </div>
  );
}
