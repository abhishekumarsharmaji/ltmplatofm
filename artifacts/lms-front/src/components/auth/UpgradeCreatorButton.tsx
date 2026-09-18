import { Button, ButtonProps } from "@/components/ui/button";
import { useGetSession } from "@workspace/api-client-react";
import { useLocation } from "wouter";

export function UpgradeCreatorButton({ 
  className,
  variant = "default",
  size = "default",
  children
}: ButtonProps) {
  const [, setLocation] = useLocation();
  const { data: session } = useGetSession();

  const handleApply = () => {
    if (!session?.authenticated) {
      setLocation("/auth/login");
      return;
    }

    if (session?.user?.role === "creator" || session?.user?.role === "admin") {
      setLocation(`/dashboard/${session.user.role}`);
      return;
    }
    setLocation("/creator-application");
  };

  return (
    <Button 
      variant={variant}
      size={size}
      className={className}
      onClick={handleApply}
    >
      {children || "Apply to become a creator"}
    </Button>
  );
}
