import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { useTranslations } from "@/lib/i18n";

export default function NotFound() {
  const t = useTranslations("errors.notFound");

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F9F9FA] px-4 font-sans">
      <div className="bg-white p-12 rounded-[20px] shadow-[0_15px_40px_rgba(0,0,0,0.04)] border border-[#E5E5E5] max-w-md w-full flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-[32px] font-bold tracking-tight mb-3 text-black">
          {t("title")}
        </h1>
        <p className="text-[16px] text-[#4D4D4D] mb-8 leading-relaxed">
          {t("desc")}
        </p>
        <Link href="/">
          <Button className="h-[50px] px-8 bg-primary hover:bg-[#10A364] text-white font-medium rounded-[8px] text-[16px] shadow-[0_10px_24px_rgba(21,207,116,0.35)] transition-all">
            {t("return")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
