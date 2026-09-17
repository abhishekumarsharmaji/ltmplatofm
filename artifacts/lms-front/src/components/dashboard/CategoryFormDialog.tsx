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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? 'Edit Category' : 'Create Category'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">{form.formState.errors.name?.message as string}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" {...form.register("slug")} />
            {form.formState.errors.slug && (
              <p className="text-sm text-red-500">{form.formState.errors.slug?.message as string}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input id="description" {...form.register("description")} />
          </div>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Saving..." : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
