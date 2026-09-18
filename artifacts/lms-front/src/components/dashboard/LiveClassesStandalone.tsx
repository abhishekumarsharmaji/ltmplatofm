import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Video, BookOpen } from "lucide-react";

export function CreatorLiveClassesStandalone() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto pt-4">
      <div className="text-center py-24 bg-white border border-[#E5E5E5] rounded-xl shadow-sm">
        <div className="w-20 h-20 bg-[#E3F9EF] text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Video className="w-10 h-10" />
        </div>
        <h2 className="text-[28px] font-bold text-black tracking-tight mb-3">Live Classes are Managed per Course</h2>
        <p className="text-[#4D4D4D] text-[16px] max-w-md mx-auto mb-10 leading-relaxed">
          To schedule or manage live classes, please navigate to the specific Course Builder. 
          Live classes are tied to a course's curriculum and enrollment.
        </p>
        <Link href="/dashboard/creator/courses" className="h-[48px] px-8 bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[15px] shadow-[0_4px_14px_rgba(21,207,116,0.25)] inline-flex items-center justify-center">
            <BookOpen className="w-5 h-5 mr-2" />
            Go to Courses
        </Link>
      </div>
    </div>
  );
}

export function AdminLiveClassesStandalone() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto pt-4">
      <div className="text-center py-24 bg-white border border-[#E5E5E5] rounded-xl shadow-sm">
        <div className="w-20 h-20 bg-[#E3F9EF] text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Video className="w-10 h-10" />
        </div>
        <h2 className="text-[28px] font-bold text-black tracking-tight mb-3">Live Classes are Managed per Course</h2>
        <p className="text-[#4D4D4D] text-[16px] max-w-md mx-auto mb-10 leading-relaxed">
          To view or moderate live classes, please navigate to the Course Studio for a specific course.
        </p>
        <Link href="/dashboard/admin/courses" className="h-[48px] px-8 bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[15px] shadow-[0_4px_14px_rgba(21,207,116,0.25)] inline-flex items-center justify-center">
            <BookOpen className="w-5 h-5 mr-2" />
            Go to Courses
        </Link>
      </div>
    </div>
  );
}
