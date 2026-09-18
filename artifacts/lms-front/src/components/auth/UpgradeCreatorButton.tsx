import { useState } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { useUpgradeCreator, useGetSession, getGetSessionQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Sparkles } from "lucide-react";

export function UpgradeCreatorButton({ 
  className,
  variant = "default",
  size = "default",
  children
}: ButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const upgrade = useUpgradeCreator({
    mutation: {
      // Role upgrade is idempotent, so retrying transient deployment/database
      // failures is safe.
      retry: (failureCount, error) =>
        failureCount < 2 && (error.status === 429 || error.status >= 500),
      retryDelay: (attempt) => 1000 * (attempt + 1),
    },
  });
  const { data: session } = useGetSession();

  const handleUpgrade = () => {
    if (!session?.authenticated) {
      setLocation("/auth/login");
      return;
    }

    if (session?.user?.role === "creator" || session?.user?.role === "admin") {
      setLocation(`/dashboard/${session.user.role}`);
      return;
    }

    upgrade.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "Welcome, Creator!", description: "Your account has been upgraded." });
        queryClient.invalidateQueries({ queryKey: getGetSessionQueryKey() }).then(() => {
          setLocation("/dashboard/creator");
        });
      },
      onError: (error) => {
        if (error.status === 401) {
          queryClient.setQueryData(getGetSessionQueryKey(), { authenticated: false, user: null });
          setLocation("/auth/login");
          return;
        }
        toast({
          title: "Upgrade failed.",
          description: error.status >= 500
            ? "The server is temporarily unavailable. Please try again in a moment."
            : error.message,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Button 
      variant={variant}
      size={size}
      className={className}
      onClick={handleUpgrade}
      disabled={upgrade.isPending}
    >
      {upgrade.isPending ? "Upgrading..." : (children || <><Sparkles className="w-4 h-4 mr-2" /> Become a Creator</>)}
    </Button>
  );
}
