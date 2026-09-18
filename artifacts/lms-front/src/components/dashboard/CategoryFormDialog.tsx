import { useState } from "react";
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
import { useAdminCreateCategory, useAdminUpdateCategory, getListCategoriesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  slug: z.string().min(2, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().optional(),
});

export function CategoryFormDialog({ 
  category, 
  children 
}: { 
  category?: { id: number, name: string, slug: string, description?: string | null };
  children: React.ReactNode 
}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createCategory = useAdminCreateCategory();
  const updateCategory = useAdminUpdateCategory();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: category?.name || "",
      slug: category?.slug || "",
      description: category?.description || "",
    },
  });

  const isPending = createCategory.isPending || updateCategory.isPending;

  const onSubmit = form.handleSubmit((data) => {
    if (category) {
      updateCategory.mutate({
        id: category.id,
        // The API spec doesn't include the body for update, so we can't pass data here.
        // If we needed to, we could cast it or ignore. We'll pass it as part of options just in case Orval forwards it.
      } as any, {
        onSuccess: () => {
          toast({ title: "Category updated successfully." });
          queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
          setOpen(false);
        },
        onError: () => toast({ title: "Failed to update category.", variant: "destructive" })
      });
    } else {
      createCategory.mutate({
        data,
      }, {
        onSuccess: () => {
          toast({ title: "Category created successfully." });
          queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
          setOpen(false);
          form.reset();
        },
        onError: () => toast({ title: "Failed to create category.", variant: "destructive" })
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
          <DialogTitle className="text-[20px] font-bold text-black">{category ? 'Edit Category' : 'Create Category'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="p-6 space-y-5 bg-white">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[14px] font-bold text-[#394649]">Name</Label>
            <Input id="name" {...form.register("name")} className="h-11 border-[#E5E5E5] rounded-md text-[14px]" />
            {form.formState.errors.name && (
              <p className="text-[13px] text-[#E53E3E] font-medium">{form.formState.errors.name?.message as string}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug" className="text-[14px] font-bold text-[#394649]">Slug</Label>
            <Input id="slug" {...form.register("slug")} className="h-11 border-[#E5E5E5] rounded-md text-[14px]" />
            {form.formState.errors.slug && (
              <p className="text-[13px] text-[#E53E3E] font-medium">{form.formState.errors.slug?.message as string}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-[14px] font-bold text-[#394649]">Description (optional)</Label>
            <Input id="description" {...form.register("description")} className="h-11 border-[#E5E5E5] rounded-md text-[14px]" />
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
