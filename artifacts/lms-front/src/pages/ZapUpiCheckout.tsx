import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, Clock3, Download, RefreshCw, ShieldCheck, XCircle, UserPlus, ArrowRight, FileText } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";

type PaymentOrder = {
  orderId: string;
  status: "pending" | "succeeded" | "failed" | "refunded";
  productId: number;
  productTitle: string;
  productType?: "course" | "digital";
  courseId?: number | null;
  accessExpiresAt?: string | null;
  files?: Array<{ id: number; filename: string; sizeBytes?: number | null }>;
};

function queryValue(name: string) {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(name) || "";
}

function formatBytes(bytes: number, decimals = 0) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function ZapUpiCheckout() {
  const orderId = queryValue("order_id");
  const token = queryValue("token");
  const providerResult = queryValue("status");
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(true);
  const attempts = useRef(0);
  const timer = useRef<number | null>(null);

  const checkPayment = useCallback(async () => {
    if (!orderId || !token) {
      setMessage("This payment return link is incomplete. Open the product page and start checkout again.");
      setChecking(false);
      return;
    }
    setChecking(true);
    try {
      const response = await fetch(`/api/payments/zapupi/orders/${encodeURIComponent(orderId)}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Payment status could not be verified");
      setOrder(body);
      setMessage("");
      attempts.current += 1;
      if (body.status === "pending" && attempts.current < 40) {
        timer.current = window.setTimeout(() => void checkPayment(), 2500);
      } else {
        setChecking(false);
      }
    } catch (error) {
      attempts.current += 1;
      const text = error instanceof Error ? error.message : "Payment status could not be verified";
      setMessage(text);
      if (attempts.current < 5) {
        timer.current = window.setTimeout(() => void checkPayment(), 3000);
      } else {
        setChecking(false);
      }
    }
  }, [orderId, token]);

  useEffect(() => {
    void checkPayment();
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [checkPayment]);

  const succeeded = order?.status === "succeeded";
  const failed = order?.status === "failed" || order?.status === "refunded";
  const invalidLink = !orderId || !token;
  const expiry = order?.accessExpiresAt
    ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.accessExpiresAt))
    : null;

  const renderStateContent = () => {
    if (succeeded && order) {
      return (
        <div className="animate-fade-in-up">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#E2F5EB] to-[#C9ECD9] shadow-[inset_0_2px_10px_rgba(255,255,255,0.6)]">
            <CheckCircle2 className="h-12 w-12 text-[#0EAF63]" strokeWidth={2.5} />
          </div>
          
          <h1 data-testid="status-title" className="mt-8 text-3xl font-extrabold tracking-tight text-[#10231B] sm:text-4xl">
            Payment verified
          </h1>
          <p data-testid="status-description" className="mx-auto mt-4 max-w-md text-base leading-relaxed text-[#607269]">
            Your secure transaction is complete. Access to <strong className="font-bold text-[#173D30]">{order.productTitle}</strong> is ready.
          </p>

          <div className="mx-auto mt-8 max-w-md text-left">
            <div className="rounded-2xl border border-[#D9E8E0] bg-gradient-to-b from-[#F8FCFA] to-[#F4F9F6] p-5 shadow-sm">
              <div className="flex gap-4">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E2F5EB] bg-white shadow-sm">
                   <UserPlus className="h-5 w-5 text-[#0F9F5A]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#173D30]">Access your purchases anytime</h3>
                  <p data-testid="text-account-info" className="mt-1.5 text-sm leading-relaxed text-[#557066]">
                    Create an account using the email address provided at checkout to safely revisit your files and courses later.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {order.files && order.files.length > 0 && (
            <div className="mt-10 border-t border-[#E7EEE9] pt-8">
              <h2 className="mb-5 text-sm font-bold uppercase tracking-widest text-[#557066]">Your Digital Files</h2>
              <div className="space-y-4 text-left">
                {order.files.map((file) => (
                  <a
                    key={file.id}
                    href={`/api/marketplace/digital-products/${order.productId}/files/${file.id}/guest-download`}
                    data-testid={`link-download-${file.id}`}
                    className="group flex items-center justify-between gap-4 rounded-2xl border border-[#DCE9E2] bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#0EAF63] hover:shadow-[0_12px_24px_-8px_rgba(14,175,99,0.2)] focus:outline-none focus:ring-2 focus:ring-[#0EAF63] focus:ring-offset-2"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F4F9F6] text-[#0EAF63] transition-colors group-hover:bg-[#0EAF63] group-hover:text-white">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="truncate text-base font-bold text-[#173D30] transition-colors group-hover:text-[#0EAF63]">{file.filename}</h4>
                        <p className="mt-0.5 text-sm font-medium text-[#718078]">
                          {file.sizeBytes ? formatBytes(file.sizeBytes) : 'Secure download'}
                        </p>
                      </div>
                    </div>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F4F9F6] text-[#0EAF63] transition-transform group-hover:scale-110 group-hover:bg-[#E2F5EB]">
                      <Download className="h-5 w-5" />
                    </div>
                  </a>
                ))}
              </div>
              <p className="mt-6 text-center text-xs font-medium text-[#718078]">
                {expiry ? `Access valid until ${expiry}.` : "Lifetime access granted."} Download session links expire after one hour.
              </p>
            </div>
          )}

          {order.productType === "course" && order.courseId && (
            <div className="mt-10 border-t border-[#E7EEE9] pt-8">
              <Link
                href={`/dashboard/student/courses/${order.courseId}`}
                className="group flex items-center justify-between gap-4 rounded-2xl bg-[#123D32] p-5 text-white transition-all duration-300 hover:-translate-y-1 hover:bg-[#0B3027] hover:shadow-[0_12px_24px_-8px_rgba(18,61,50,0.4)] focus:outline-none focus:ring-2 focus:ring-[#123D32] focus:ring-offset-2"
                data-testid="link-start-course"
              >
                 <div className="flex items-center gap-4">
                   <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                     <ArrowRight className="h-6 w-6" />
                   </div>
                   <div className="text-left">
                     <h4 className="text-base font-bold text-white">Start your course</h4>
                     <p className="mt-0.5 text-sm font-medium text-[#A6C0B5]">Enter the learning environment</p>
                   </div>
                 </div>
              </Link>
            </div>
          )}
          
          {(!order.productType || (order.productType === 'digital' && (!order.files || order.files.length === 0))) && order.productId && (
            <div className="mt-10">
              <Link 
                href={`/products/${order.productId}`} 
                className="inline-flex h-12 items-center justify-center rounded-xl bg-[#F4F9F6] px-8 text-sm font-bold text-[#0EAF63] transition-colors hover:bg-[#E2F5EB]"
                data-testid="link-return"
              >
                Return to product page
              </Link>
            </div>
          )}

          {order.productType !== "course" && order.productId && order.files && order.files.length > 0 && (
            <div className="mt-8 pt-4">
              <Link 
                href={`/products/${order.productId}`} 
                className="inline-flex h-10 items-center justify-center rounded-xl px-6 text-sm font-bold text-[#557066] transition-colors hover:bg-[#F4F9F6] hover:text-[#173D30]"
                data-testid="link-return"
              >
                Return to product page
              </Link>
            </div>
          )}
        </div>
      );
    }
    
    if (invalidLink) {
      return (
        <div className="animate-fade-in-up">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#FEE2E2] to-[#FECACA] shadow-[inset_0_2px_10px_rgba(255,255,255,0.6)]">
            <XCircle className="h-12 w-12 text-[#DC2626]" strokeWidth={2.5} />
          </div>
          <h1 data-testid="status-title" className="mt-8 text-3xl font-extrabold tracking-tight text-[#10231B] sm:text-4xl">
            Payment link unavailable
          </h1>
          <p data-testid="status-description" className="mx-auto mt-4 max-w-sm text-base leading-relaxed text-[#607269]">
            This checkout session is incomplete or expired. Please return to the product page and start a new secure checkout.
          </p>
        </div>
      );
    }

    if (failed) {
      return (
        <div className="animate-fade-in-up">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#FEE2E2] to-[#FECACA] shadow-[inset_0_2px_10px_rgba(255,255,255,0.6)]">
            <XCircle className="h-12 w-12 text-[#DC2626]" strokeWidth={2.5} />
          </div>
          <h1 data-testid="status-title" className="mt-8 text-3xl font-extrabold tracking-tight text-[#10231B] sm:text-4xl">
            Payment was not completed
          </h1>
          <p data-testid="status-description" className="mx-auto mt-4 max-w-sm text-base leading-relaxed text-[#607269]">
            No access was granted and no charges were made. You can safely try the payment again.
          </p>
          {order?.productId && (
            <div className="mt-10">
              <Link 
                href={`/products/${order.productId}`} 
                className="inline-flex h-14 items-center justify-center rounded-xl bg-[#123D32] px-8 text-base font-bold text-white transition-all hover:-translate-y-1 hover:bg-[#0B3027] hover:shadow-[0_12px_24px_-8px_rgba(18,61,50,0.4)]"
                data-testid="link-return"
              >
                Return to product page
              </Link>
            </div>
          )}
        </div>
      );
    }

    if (checking) {
      return (
        <div className="animate-fade-in-up">
          <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-[#E2F5EB]"></div>
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-[#0EAF63] border-t-transparent"></div>
            <ShieldCheck className="h-10 w-10 text-[#0EAF63]" />
          </div>
          <h1 data-testid="status-title" className="mt-8 text-3xl font-extrabold tracking-tight text-[#10231B] sm:text-4xl">
            Confirming your payment
          </h1>
          <p data-testid="status-description" className="mx-auto mt-4 max-w-sm text-base leading-relaxed text-[#607269]">
            We are checking ZapUPI securely. Keep this page open; access is granted only after server verification.
          </p>
        </div>
      );
    }

    return (
      <div className="animate-fade-in-up">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A] shadow-[inset_0_2px_10px_rgba(255,255,255,0.6)]">
          <Clock3 className="h-12 w-12 text-[#D97706]" strokeWidth={2.5} />
        </div>
        <h1 data-testid="status-title" className="mt-8 text-3xl font-extrabold tracking-tight text-[#10231B] sm:text-4xl">
          Payment is still processing
        </h1>
        <p data-testid="status-description" className="mx-auto mt-4 max-w-sm text-base leading-relaxed text-[#607269]">
          We are waiting for final confirmation from ZapUPI. Access is granted only after server verification.
        </p>
      </div>
    );
  };

  return (
    <PublicLayout>
      <main className="min-h-screen bg-gradient-to-b from-[#F3FBF7] via-white to-white px-4 pb-20 pt-28 sm:pt-36">
        <div className="mx-auto max-w-xl">
          <div className="overflow-hidden rounded-[32px] border border-[#DCE9E2] bg-white shadow-[0_32px_64px_-12px_rgba(17,71,48,0.08)]">
            <div className="border-b border-[#E7EEE9] bg-[#F8FCFA] px-6 py-5 sm:px-10">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 text-sm font-bold text-[#173D30]">
                  <ShieldCheck className="h-5 w-5 text-[#0F9F5A]" />
                  Secure payment verification
                </div>
                <span className="rounded-full border border-[#D5E5DD] bg-white px-3 py-1 text-xs font-bold tracking-wide text-[#557066]">
                  ZapUPI
                </span>
              </div>
            </div>

            <div className="px-6 py-10 text-center sm:px-12 sm:py-14">
              {renderStateContent()}

              {message && (
                <div data-testid="text-error-message" className="animate-fade-in-up mx-auto mt-8 max-w-md rounded-2xl border border-[#F0D3D3] bg-[#FFF7F7] p-5 text-left text-sm font-medium text-[#A63030] shadow-sm">
                  {message}
                </div>
              )}

              {!succeeded && !checking && !invalidLink && (
                <div className="animate-fade-in-up mt-10 delay-200">
                  <Button
                    onClick={() => {
                      attempts.current = 0;
                      void checkPayment();
                    }}
                    data-testid="button-retry"
                    variant="outline"
                    className="h-12 rounded-xl border-[#DCE9E2] bg-white px-6 text-sm font-bold text-[#173D30] hover:bg-[#F4F9F6]"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Check status again
                  </Button>
                </div>
              )}
            </div>
          </div>

          <p data-testid="text-order-reference" className="mt-8 text-center text-xs font-medium text-[#78867F]">
            Order {orderId || "unavailable"} {providerResult ? `· ZapUPI returned ${providerResult}` : ""}
          </p>
        </div>
      </main>
    </PublicLayout>
  );
}
