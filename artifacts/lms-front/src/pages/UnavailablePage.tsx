import { PublicLayout } from "@/components/layout/PublicLayout";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function UnavailablePage() {
  return (
    <PublicLayout>
      <div className="flex-1 bg-[#F9F9FA] flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="bg-white p-12 rounded-[20px] shadow-[0_15px_40px_rgba(0,0,0,0.04)] border border-[#E5E5E5] max-w-md w-full flex flex-col items-center">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10 text-orange-500" />
          </div>
          <h1 className="text-[32px] font-bold tracking-tight mb-3 text-black">
            Currently Unavailable
          </h1>
          <p className="text-[16px] text-[#4D4D4D] mb-8 leading-relaxed">
            This feature (including payments and checkout) is disabled during the current phase.
          </p>
          <Link href="/">
            <Button className="h-[50px] px-8 bg-primary hover:bg-[#10A364] text-white font-medium rounded-[8px] text-[16px] shadow-[0_10px_24px_rgba(21,207,116,0.35)] transition-all">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
