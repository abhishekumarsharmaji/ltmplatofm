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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{product ? 'Edit' : 'Create'} {type === 'course' ? 'Course' : 'Digital Product'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...form.register("title")} />
            {form.formState.errors.title && (
              <p className="text-sm text-red-500">{form.formState.errors.title?.message as string}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input id="description" {...form.register("description")} />
          </div>
          {type === "digital" ? (
            <div className="space-y-2">
              <Label htmlFor="priceMinor">Price (in cents)</Label>
              <Input id="priceMinor" type="number" {...form.register("priceMinor")} />
            </div>
          ) : (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
              All courses are free. Students can enroll instantly without payment.
            </div>
          )}
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Saving..." : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
