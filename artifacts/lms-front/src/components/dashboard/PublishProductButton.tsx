import { Button } from "@/components/ui/button";
import { usePublishCreatorProduct, getListCreatorProductsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function PublishProductButton({ 
  id,
  status
}: { 
  id: number;
  status: string;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const publishProduct = usePublishCreatorProduct();

  const handlePublish = () => {
    publishProduct.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Published successfully." });
        queryClient.invalidateQueries({ queryKey: getListCreatorProductsQueryKey() });
      },
      onError: () => {
        toast({ title: "Failed to publish.", variant: "destructive" });
      }
    });
  };

  if (status === 'published') {
    return (
      <Button size="sm" variant="outline" disabled>
        Published
      </Button>
    );
  }

  return (
    <Button 
      size="sm" 
      onClick={handlePublish}
      disabled={publishProduct.isPending}
    >
      {publishProduct.isPending ? "Publishing..." : "Publish"}
    </Button>
  );
}
