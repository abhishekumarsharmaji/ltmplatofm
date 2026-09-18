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
  useCreateCreatorProduct, 
  useUpdateCreatorProduct,
  getListCreatorProductsQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  priceMinor: z.coerce.number().min(0),
});

export function ProductFormDialog({ 
  type, 
  product,
  children 
}: { 
  type: "course" | "digital"; 
  product?: { id: number; title: string; description: string; priceMinor: number };
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
      priceMinor: product?.priceMinor || 0,
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        title: product.title,
        description: product.description,
        priceMinor: product.priceMinor,
      });
    }
  }, [product, form, open]);

  const isPending = createProduct.isPending || updateProduct.isPending;

  const onSubmit = form.handleSubmit((data) => {
    if (product) {
      updateProduct.mutate({
        id: product.id,
        data: {
          ...data,
          type,
          currency: "usd",
        }
      }, {
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
        data: {
          ...data,
          type,
          currency: "usd",
        }
      }, {
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
            <Label htmlFor="description" className="text-[14px] font-bold text-[#394649]">Description (optional)</Label>
            <Input id="description" {...form.register("description")} className="h-11 border-[#E5E5E5] rounded-md text-[14px]" />
          </div>
          {type === "digital" ? (
            <div className="space-y-2">
              <Label htmlFor="priceMinor" className="text-[14px] font-bold text-[#394649]">Price (in cents)</Label>
              <Input id="priceMinor" type="number" {...form.register("priceMinor")} className="h-11 border-[#E5E5E5] rounded-md text-[14px]" />
            </div>
          ) : (
            <div className="rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] p-4 text-[13px] text-[#4D4D4D]">
              All courses are free. Students can enroll instantly without payment.
            </div>
          )}
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
