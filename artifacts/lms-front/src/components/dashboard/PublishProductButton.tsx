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
      <Button variant="outline" disabled className="h-9 px-4 rounded-md font-medium text-[13px] border-[#DADADA] text-[#9794AA] bg-gray-50">
        Published
      </Button>
    );
  }

  return (
    <Button 
      onClick={handlePublish}
      disabled={publishProduct.isPending}
      className="h-9 px-4 bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[13px] shadow-[0_4px_14px_rgba(21,207,116,0.25)]"
    >
      {publishProduct.isPending ? "Publishing..." : "Publish"}
    </Button>
  );
}
