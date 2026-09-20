import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, Clock3, Download, LoaderCircle, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";

type PaymentOrder = {
  orderId: string;
  status: "pending" | "succeeded" | "failed" | "refunded";
  productId: number;
  productTitle: string;
  accessExpiresAt?: string | null;
  files?: Array<{ id: number; filename: string; sizeBytes?: number | null }>;
};

function queryValue(name: string) {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(name) || "";
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

  const pending = !order || order.status === "pending";
  const succeeded = order?.status === "succeeded";
  const failed = order?.status === "failed" || order?.status === "refunded";
  const invalidLink = !orderId || !token;
  const expiry = order?.accessExpiresAt
    ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.accessExpiresAt))
    : null;

  return (
    <PublicLayout>
      <main className="min-h-screen bg-gradient-to-b from-[#F3FBF7] via-white to-white px-4 pb-20 pt-28 sm:pt-36">
        <div className="mx-auto max-w-xl">
          <div className="overflow-hidden rounded-[28px] border border-[#DCE9E2] bg-white shadow-[0_24px_80px_rgba(17,71,48,0.12)]">
            <div className="border-b border-[#E7EEE9] bg-[#F8FCFA] px-6 py-5 sm:px-9">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm font-bold text-[#173D30]">
                  <ShieldCheck className="h-5 w-5 text-[#0F9F5A]" />
                  Secure payment verification
                </div>
                <span className="rounded-full border border-[#D5E5DD] bg-white px-3 py-1 text-xs font-semibold text-[#557066]">
                  ZapUPI
                </span>
              </div>
            </div>

            <div className="px-6 py-9 text-center sm:px-10 sm:py-12">
              {succeeded ? (
                <CheckCircle2 className="mx-auto h-16 w-16 text-[#0EAF63]" />
              ) : failed || invalidLink ? (
                <XCircle className="mx-auto h-16 w-16 text-[#D84242]" />
              ) : checking ? (
                <LoaderCircle className="mx-auto h-16 w-16 animate-spin text-[#0EAF63]" />
              ) : (
                <Clock3 className="mx-auto h-16 w-16 text-[#D58A16]" />
              )}

              <h1 className="mt-6 text-2xl font-bold tracking-tight text-[#10231B] sm:text-3xl">
                {succeeded
                  ? "Payment verified"
                  : invalidLink
                    ? "Payment link unavailable"
                    : failed
                    ? "Payment was not completed"
                    : checking
                      ? "Confirming your payment"
                      : "Payment is still processing"}
              </h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#607269] sm:text-base">
                {succeeded
                  ? `Your access to ${order.productTitle} is ready.`
                  : invalidLink
                    ? "Return to the product page and start a new secure checkout."
                    : failed
                    ? "No access was granted and you can safely try the payment again."
                    : "We are checking ZapUPI directly. Keep this page open; access is granted only after server verification."}
              </p>

              {message && (
                <div className="mt-6 rounded-xl border border-[#F0D3D3] bg-[#FFF7F7] p-4 text-left text-sm text-[#A63030]">
                  {message}
                </div>
              )}

              {succeeded && order.files && order.files.length > 0 && (
                <div className="mt-8 space-y-3 text-left">
                  {order.files.map((file) => (
                    <a
                      key={file.id}
                      href={`/api/marketplace/digital-products/${order.productId}/files/${file.id}/guest-download`}
                      className="flex min-h-14 items-center justify-between gap-4 rounded-xl border border-[#D9E8E0] bg-[#F8FCFA] px-4 py-3 font-semibold text-[#173D30] transition hover:border-[#9ED7B9] hover:bg-[#F0FAF5]"
                    >
                      <span className="min-w-0 truncate">{file.filename}</span>
                      <Download className="h-5 w-5 shrink-0 text-[#0EAF63]" />
                    </a>
                  ))}
                  <p className="pt-1 text-center text-xs text-[#718078]">
                    {expiry ? `Access valid until ${expiry}.` : "Lifetime access granted."} Download session links expire after one hour.
                  </p>
                </div>
              )}

              {!succeeded && !checking && !invalidLink && (
                <Button
                  onClick={() => {
                    attempts.current = 0;
                    void checkPayment();
                  }}
                  className="mt-7 h-12 rounded-xl bg-[#123D32] px-6 text-white hover:bg-[#0B3027]"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Check payment again
                </Button>
              )}

              {order?.productId && (
                <div className="mt-6">
                  <Link href={`/products/${order.productId}`} className="text-sm font-semibold text-[#087B46] hover:underline">
                    Return to product page
                  </Link>
                </div>
              )}
            </div>
          </div>

          <p className="mt-5 text-center text-xs leading-5 text-[#78867F]">
            Order {orderId || "unavailable"} {providerResult ? `· ZapUPI returned ${providerResult}` : ""}
          </p>
        </div>
      </main>
    </PublicLayout>
  );
}