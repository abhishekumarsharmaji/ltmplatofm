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
import { useAdminUpdateSetting, getAdminSettingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string().min(1, "Value is required"),
});

export function SettingFormDialog({ 
  settingKey,
  settingValue,
  children 
}: { 
  settingKey?: string;
  settingValue?: string;
  children: React.ReactNode 
}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateSetting = useAdminUpdateSetting();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      key: settingKey || "",
      value: settingValue || "",
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    updateSetting.mutate({
      key: data.key,
      data: { value: data.value },
    }, {
      onSuccess: () => {
        toast({ title: "Setting updated successfully." });
        queryClient.invalidateQueries({ queryKey: getAdminSettingsQueryKey() });
        setOpen(false);
      },
      onError: () => toast({ title: "Failed to update setting.", variant: "destructive" })
    });
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{settingKey ? 'Edit Setting' : 'Add/Update Setting'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="key">Key</Label>
            <Input id="key" {...form.register("key")} disabled={!!settingKey} />
            {form.formState.errors.key && (
              <p className="text-sm text-red-500">{form.formState.errors.key?.message as string}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="value">Value</Label>
            <Input id="value" {...form.register("value")} />
            {form.formState.errors.value && (
              <p className="text-sm text-red-500">{form.formState.errors.value?.message as string}</p>
            )}
          </div>
          <Button type="submit" disabled={updateSetting.isPending} className="w-full">
            {updateSetting.isPending ? "Saving..." : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
