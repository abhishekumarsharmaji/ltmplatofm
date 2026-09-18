import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { getGetSessionQueryKey, login } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "@/lib/i18n";

export default function Login() {
  const t = useTranslations("auth.login");
  const tAuth = useTranslations("auth");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const session = await login({
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
      });
      if (!session.user) throw new Error("No user returned");
      queryClient.setQueryData(getGetSessionQueryKey(), session);
      setLocation(`/dashboard/${session.user.role}`);
    } catch {
      setError(t("error") as string);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex text-[#394649] font-sans">
      {/* Left Column: Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32 relative">
        {/* Top Logo */}
        <div className="absolute top-10 left-8 sm:left-16 lg:left-24 xl:left-32">
          <Link href="/" className="flex items-center space-x-2 shrink-0">
            <img src="/brand/logo-mark.svg" alt="LMS Platform" className="w-8 h-8" />
            <span className="font-bold text-xl text-black tracking-tight">
              LMS Platform
            </span>
          </Link>
        </div>

        <div className="w-full max-w-md mt-16">
          <h1 className="text-[32px] sm:text-[40px] font-bold text-black tracking-tight mb-3">
            {t("title")}
          </h1>
          <p className="text-[15px] text-[#9794AA] mb-10">
            {t("subtitle")}
          </p>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[14px] font-medium text-[#4D4D4D]">{t("emailLabel")}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="h-12 border-[#E5E5E5] rounded-[8px] focus-visible:ring-1 focus-visible:ring-primary/50 text-[#394649]"
                placeholder={t("emailPlaceholder") as string}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[14px] font-medium text-[#4D4D4D]">{t("passwordLabel")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="h-12 border-[#E5E5E5] rounded-[8px] focus-visible:ring-1 focus-visible:ring-primary/50 text-[#394649] pr-10"
                  placeholder={t("passwordPlaceholder") as string}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9794AA] hover:text-[#4D4D4D] focus:outline-none"
                  aria-label={showPassword ? tAuth("hidePassword") as string : tAuth("showPassword") as string}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-500 font-medium" role="alert" data-testid="status-login-error">{error}</p>}

            <Button
              type="submit"
              data-testid="button-login-submit"
              className="w-full h-12 bg-primary hover:bg-[#10A364] text-white font-medium rounded-[8px] text-[16px] shadow-[0_10px_24px_rgba(21,207,116,0.35)] transition-all mt-4"
              disabled={isLoading}
            >
              {isLoading ? t("buttonLoading") : t("button")}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-[#9794AA]">
            {t("noAccount")}{' '}
            <Link href="/auth/sign-up" className="font-medium text-primary hover:text-[#10A364] transition-colors">
              {t("createOne")}
            </Link>
          </p>
        </div>
      </div>

      {/* Right Column: Photo */}
      <div className="hidden lg:block lg:flex-1 p-4 pl-0">
        <div className="w-full h-full relative rounded-l-[40px] rounded-r-[20px] overflow-hidden">
          <img 
            src="/images/login-classroom.webp" 
            alt="Classroom" 
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}
