import { CourseBuilder } from "@/pages/dashboard/creator/CourseBuilder";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function AdminCourseStudio({ productId }: { productId?: number }) {
  const params = useParams();
  const id = productId || (params.id ? Number(params.id) : undefined);

  if (!id) {
    return (
      <div className="p-12 text-center text-destructive">
        Course ID is missing.
      </div>
    );
  }

  return (
    <CourseBuilder 
      productId={id} 
      backRoute="/dashboard/admin/courses" 
      backLabel="Admin Course Studio"
      role="admin"
    />
  );
}
