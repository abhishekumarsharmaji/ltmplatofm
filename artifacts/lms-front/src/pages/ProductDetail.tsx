import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { 
  useGetDigitalProduct, 
  useAcquireDigitalProduct, 
  useGetSession,
  useListStudentDigitalProducts,
  getGetDigitalProductQueryKey,
  getListStudentDigitalProductsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  AlertCircle, 
  Download, 
  FileText, 
  Package, 
  ShieldCheck,
  CheckCircle2,
  Users,
  Box,
  MessageSquareQuote,
  HelpCircle,
  Mail,
  FileBox
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function ProductDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const productKey = params.productId || "";
  const queryClient = useQueryClient();
  const { data: session } = useGetSession();
  const isAuthenticated = session?.authenticated;
  const { data: ownedProducts } = useListStudentDigitalProducts({
    query: { enabled: Boolean(isAuthenticated), queryKey: getListStudentDigitalProductsQueryKey() },
  });
  
  const { data: product, isLoading, isError } = useGetDigitalProduct(productKey, { 
    query: { enabled: !!productKey, queryKey: getGetDigitalProductQueryKey(productKey) } 
  });
  
  const acquireProduct = useAcquireDigitalProduct();
  const productId = product?.id || 0;
  const isOwned = ownedProducts?.some((item) => item.id === productId) ?? false;
  const salesPage = product?.salesPage;
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestPending, setGuestPending] = useState(false);
  const [guestError, setGuestError] = useState("");
  const [guestAccess, setGuestAccess] = useState<null | {
    expiresAt: string;
    files: Array<{ id: number; filename: string; sizeBytes?: number | null }>;
  }>(null);

  const handleAcquire = () => {
    acquireProduct.mutate({ productId } as any, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDigitalProductQueryKey(productKey) });
        queryClient.invalidateQueries({ queryKey: getListStudentDigitalProductsQueryKey() });
        setLocation(`/dashboard/student/products/${productId}`);
      }
    });
  };

  const handleGuestAccess = async () => {
    if (!product || (product.priceMinor > 0 && product.trialDays <= 0)) return;
    setGuestPending(true);
    setGuestError("");
    try {
      const response = await fetch(`/api/marketplace/digital-products/${encodeURIComponent(productKey)}/guest-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: guestEmail, phone: guestPhone }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Access could not be created");
      setGuestAccess(body);
    } catch (error) {
      setGuestError(error instanceof Error ? error.message : "Access could not be created");
    } finally {
      setGuestPending(false);
    }
  };

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-white pt-32 pb-20 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </PublicLayout>
    );
  }

  if (isError || !product) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-white pt-32 pb-20 flex flex-col items-center justify-center">
          <AlertCircle className="w-12 h-12 text-[#E53E3E] mb-4" />
          <h2 className="text-[24px] font-bold mb-2 text-black">Product not found</h2>
          <p className="text-[#394649]">The product you're looking for doesn't exist or has been removed.</p>
        </div>
      </PublicLayout>
    );
  }

  const isFree = product.priceMinor === 0;
  const ctaText = salesPage?.ctaLabel || "Get instant access";
  const priceLabel = isFree
    ? "Free"
    : new Intl.NumberFormat("en-IN", { style: "currency", currency: product.currency || "INR", maximumFractionDigits: 2 }).format(product.priceMinor / 100);
  const accessLabel = product.trialDays > 0
    ? `${product.trialDays}-day free trial`
    : product.accessPlan === "fixed_days"
      ? `${product.accessDays} days access`
      : product.accessPlan === "monthly"
        ? "Monthly access"
        : product.accessPlan === "yearly"
          ? "Yearly access"
          : "Lifetime access";
  const canStartGuestAccess = isFree || product.trialDays > 0;

  const renderCTA = () => {
    if (guestAccess) {
      return (
        <div className="space-y-3">
          <div className="rounded-lg border border-[#A9E6C8] bg-[#EFFBF5] p-4 text-sm text-[#176B45]">
            Access ready. Download links expire in one hour.
          </div>
          {guestAccess.files.map((file) => (
            <a
              key={file.id}
              href={`/api/marketplace/digital-products/${product.id}/files/${file.id}/guest-download`}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 font-bold text-white hover:bg-[#10A364]"
            >
              <Download className="h-4 w-4" /> Download {file.filename}
            </a>
          ))}
        </div>
      );
    }
    if (isOwned) {
      return (
        <Button 
          onClick={() => setLocation(`/dashboard/student/products/${product.id}`)}
          className="w-full h-14 bg-primary hover:bg-[#10A364] text-white font-medium rounded-lg text-[16px] shadow-[0_8px_24px_rgba(21,207,116,0.25)] transition-transform hover:-translate-y-0.5"
        >
          Go to My Library
        </Button>
      );
    }
    if (isAuthenticated && isFree) {
      return (
        <Button 
          onClick={handleAcquire}
          disabled={acquireProduct.isPending}
          className="w-full h-14 bg-primary hover:bg-[#10A364] text-white font-medium rounded-lg text-[16px] shadow-[0_8px_24px_rgba(21,207,116,0.25)] transition-transform hover:-translate-y-0.5"
        >
          {acquireProduct.isPending ? "Acquiring..." : ctaText}
        </Button>
      );
    }
    return (
      <div className="space-y-3">
        <Input type="email" value={guestEmail} onChange={(event) => setGuestEmail(event.target.value)} placeholder="Email address" autoComplete="email" />
        <Input type="tel" value={guestPhone} onChange={(event) => setGuestPhone(event.target.value)} placeholder="+91 mobile number" autoComplete="tel" />
        {guestError && <p className="text-sm text-red-600">{guestError}</p>}
        <Button
          onClick={() => void handleGuestAccess()}
          disabled={guestPending || !canStartGuestAccess}
          className="h-14 w-full rounded-lg bg-primary text-[16px] font-medium text-white hover:bg-[#10A364] disabled:cursor-not-allowed disabled:bg-[#BFC8C4]"
        >
          {canStartGuestAccess ? (guestPending ? "Preparing access..." : product.trialDays > 0 && !isFree ? "Start free trial" : ctaText) : "Payments unavailable"}
        </Button>
        <p className="text-center text-xs leading-5 text-[#737373]">
          No account required. By continuing, you agree to the Terms and Privacy Policy.
        </p>
      </div>
    );
  };

  return (
    <PublicLayout>
      <div className="bg-[#FAFAFA] min-h-screen text-black">
        {/* Hero Section */}
        <section className="bg-[#002333] pt-24 pb-16 lg:pt-40 lg:pb-32 text-white relative overflow-hidden">
          {/* Subtle noise/texture overlay for premium feel */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }}></div>
          
          <div className="container mx-auto px-4 md:px-8 relative z-10">
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-20 items-center">
              
              {/* On mobile, put image first (order-1), on desktop it's right (order-2) */}
              <div className="order-1 lg:order-2 lg:col-span-5 relative w-full max-w-lg mx-auto lg:max-w-none">
                <div className="aspect-[4/3] lg:aspect-square rounded-2xl overflow-hidden bg-[#222222] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.4)] flex items-center justify-center group">
                  {product.coverImageUrl ? (
                    <img src={product.coverImageUrl} alt={product.title} fetchPriority="high" decoding="async" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <Package className="w-24 h-24 sm:w-32 sm:h-32 text-white/10" />
                  )}
                </div>
              </div>

              <div className="order-2 lg:order-1 lg:col-span-7 space-y-6 lg:space-y-8 text-center lg:text-left">
                {product.subtype && (
                  <span className="inline-block bg-[#10A364]/20 text-[#00FF84] font-bold uppercase tracking-wider text-[12px] px-3 py-1 rounded">
                    {product.subtype}
                  </span>
                )}
                
                <h1 className="text-[32px] sm:text-[40px] lg:text-[56px] font-bold tracking-tight leading-[1.15] lg:leading-[1.1]">
                  {product.title}
                </h1>
                
                {salesPage?.tagline && (
                  <p className="text-[18px] sm:text-[20px] lg:text-[24px] text-[#A0B0C0] font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
                    {salesPage.tagline}
                  </p>
                )}
                
                {product.creatorName && (
                  <div className="flex items-center justify-center lg:justify-start gap-3 pt-2">
                    <div className="w-10 h-10 rounded-full bg-[#224EA1] flex items-center justify-center font-bold text-white shadow-inner text-[14px]">
                      {product.creatorName.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-[15px] font-medium">By {product.creatorName}</p>
                  </div>
                )}
                
                {salesPage?.benefits && salesPage.benefits.length > 0 && (
                  <ul className="space-y-3 pt-4 inline-block text-left w-full max-w-lg mx-auto lg:max-w-none">
                    {salesPage.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-3 text-[15px] sm:text-[16px] text-[#E4E4E4]">
                        <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#10A364] shrink-0" />
                        <span className="mt-0 lg:mt-0.5">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12 lg:py-24">
          <div className="container mx-auto px-4 md:px-8">
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
              
              {/* Sidebar / Floating Card - Order 1 on mobile for fast conversion, Order 2 on Desktop */}
              <div className="order-1 lg:order-2 lg:col-span-5">
                <div className="lg:sticky lg:top-32 space-y-6">
                  
                  {/* Acquisition Card */}
                  <div className="bg-white rounded-2xl border border-[#E5E5E5] shadow-[0_20px_40px_rgba(0,0,0,0.04)] overflow-hidden">
                    <div className="p-6 sm:p-8 sm:pb-6 border-b border-[#E5E5E5]">
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-[32px] sm:text-[40px] font-bold text-black leading-none">{priceLabel}</span>
                        <span className="bg-[#E3F9EF] text-[#10A364] px-3 py-1 rounded-full text-[12px] sm:text-[13px] font-bold">
                          {isFree ? "Instant digital access" : "Secure payment required"}
                        </span>
                      </div>
                      
                      <div className="pt-2">
                        <p className="mb-4 text-sm font-semibold text-[#394649]">{accessLabel}</p>
                        {renderCTA()}
                      </div>
                      <p className="text-center text-[#737373] text-[13px] mt-4 flex items-center justify-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" /> {isFree ? "No account required" : "Access only after verified payment"}
                      </p>
                    </div>

                    <div className="p-6 sm:p-8 bg-[#FAFAFA] space-y-6">
                      {/* What's Included */}
                      {(salesPage?.includedItems && salesPage.includedItems.length > 0) ? (
                        <div className="space-y-4">
                          <h4 className="font-bold text-black flex items-center gap-2 text-[14px] sm:text-[15px]">
                            <Box className="w-4 h-4 text-primary" /> What's Included
                          </h4>
                          <ul className="space-y-3">
                            {salesPage.includedItems.map((item, i) => (
                              <li key={i} className="flex items-start gap-2.5 text-[14px] text-[#394649]">
                                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {/* Who is it for */}
                      {(salesPage?.targetAudience && salesPage.targetAudience.length > 0) ? (
                        <div className="space-y-4 pt-6 border-t border-[#E5E5E5]">
                          <h4 className="font-bold text-black flex items-center gap-2 text-[14px] sm:text-[15px]">
                            <Users className="w-4 h-4 text-primary" /> Who is this for?
                          </h4>
                          <ul className="space-y-3">
                            {salesPage.targetAudience.map((audience, i) => (
                              <li key={i} className="flex items-start gap-2.5 text-[14px] text-[#394649]">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                <span>{audience}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Included Files (Actual File Meta) */}
                  {product.files && product.files.length > 0 && (
                    <div className="bg-white rounded-2xl border border-[#E5E5E5] shadow-sm p-6">
                      <h4 className="font-bold text-black mb-4 flex items-center gap-2 text-[15px]">
                        <FileBox className="w-4 h-4 text-primary" /> Included Files ({product.files.length})
                      </h4>
                      <div className="space-y-3">
                        {product.files.map(file => (
                          <div key={file.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#FAFAFA] border border-[#E5E5E5]">
                            <div className="w-10 h-10 bg-white rounded border border-[#E5E5E5] flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5 text-[#9794AA]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h5 className="font-bold text-[13px] text-black truncate">{file.filename}</h5>
                              <p className="text-[12px] text-[#737373]">{formatBytes(file.sizeBytes || 0)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Support Info */}
                  {(salesPage?.supportEmail || salesPage?.terms) && (
                    <div className="pt-4 space-y-3 px-2">
                      {salesPage.supportEmail && (
                        <p className="text-[13px] text-[#4D4D4D] flex flex-wrap items-center gap-2">
                          <Mail className="w-4 h-4 text-[#9794AA]" /> 
                          Questions? <a href={`mailto:${salesPage.supportEmail}`} className="text-primary hover:underline font-medium break-all">{salesPage.supportEmail}</a>
                        </p>
                      )}
                      {salesPage.terms && (
                        <p className="text-[12px] text-[#737373] leading-relaxed break-words whitespace-pre-wrap">
                          <strong>Terms:</strong> {salesPage.terms}
                        </p>
                      )}
                    </div>
                  )}

                </div>
              </div>

              {/* Main Content - Order 2 on mobile, Order 1 on desktop */}
              <div className="order-2 lg:order-1 lg:col-span-7 space-y-16 lg:space-y-20">
                {/* Description */}
                {product.description && (
                  <div className="prose prose-base sm:prose-lg max-w-none text-[#394649]">
                    <p className="text-[16px] sm:text-[18px] leading-relaxed whitespace-pre-wrap break-words">{product.description}</p>
                  </div>
                )}

                {/* Sales Page Sections */}
                {salesPage?.sections && salesPage.sections.length > 0 && (
                  <div className="space-y-12 lg:space-y-16">
                    {salesPage.sections.map((section, index) => (
                      <div key={index} className="space-y-4 sm:space-y-6">
                        <h2 className="text-[24px] sm:text-[28px] lg:text-[32px] font-bold text-black leading-tight break-words">{section.heading}</h2>
                        <div className="prose prose-base sm:prose-lg max-w-none text-[#394649]">
                          <p className="whitespace-pre-wrap break-words leading-relaxed text-[15px] sm:text-[16px]">{section.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Testimonials */}
                {salesPage?.testimonials && salesPage.testimonials.length > 0 && (
                  <div className="space-y-6 sm:space-y-8 pt-8 border-t border-[#E5E5E5]">
                    <h2 className="text-[24px] sm:text-[28px] font-bold text-black flex items-center gap-3">
                      <MessageSquareQuote className="w-6 h-6 sm:w-8 sm:h-8 text-primary shrink-0" />
                      What people are saying
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                      {salesPage.testimonials.map((t, index) => (
                        <div key={index} className="bg-white p-5 sm:p-6 rounded-xl border border-[#E5E5E5] shadow-sm flex flex-col justify-between">
                          <p className="text-[#394649] text-[14px] sm:text-[15px] leading-relaxed italic mb-6 break-words">"{t.quote}"</p>
                          <p className="font-bold text-black text-[13px] sm:text-[14px] break-words">— {t.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* FAQs */}
                {salesPage?.faqs && salesPage.faqs.length > 0 && (
                  <div className="space-y-6 sm:space-y-8 pt-8 border-t border-[#E5E5E5]">
                    <h2 className="text-[24px] sm:text-[28px] font-bold text-black flex items-center gap-3">
                      <HelpCircle className="w-6 h-6 sm:w-8 sm:h-8 text-primary shrink-0" />
                      Frequently Asked Questions
                    </h2>
                    <Accordion type="single" collapsible className="w-full bg-white rounded-xl border border-[#E5E5E5] shadow-sm">
                      {salesPage.faqs.map((faq, index) => (
                        <AccordionItem key={index} value={`item-${index}`} className="last:border-b-0">
                          <AccordionTrigger className="px-4 sm:px-6 py-4 text-left text-[15px] sm:text-[16px] font-bold text-black hover:text-primary hover:no-underline break-words">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="px-4 sm:px-6 pb-5 sm:pb-6 text-[#394649] text-[14px] sm:text-[15px] leading-relaxed break-words whitespace-pre-wrap">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                )}
              </div>

            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
