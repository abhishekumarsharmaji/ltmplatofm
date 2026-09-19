import { useEffect } from "react";
import { Link } from "wouter";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { BadgeCheck, CheckCircle2, Download, FileText, Mail, ShieldCheck, Sparkles } from "lucide-react";

const PRODUCT_URL = "https://coreskils.com/products/freelancing-client-acquisition-toolkit";
const SAMPLE_URL = `${import.meta.env.BASE_URL}products/freelancing-client-acquisition-toolkit-sample.pdf`;

export default function FreelancingToolkit() {
  useEffect(() => {
    const previousTitle = document.title;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const previousDescription = description?.content;
    const previousCanonical = canonical?.href;
    document.title = "Freelancing Client Acquisition Toolkit | CoreSkils";
    if (description) {
      description.content = "A practical digital toolkit with outreach scripts, proposal templates, discovery questions and an onboarding checklist for Indian freelancers.";
    }
    if (canonical) canonical.href = PRODUCT_URL;
    return () => {
      document.title = previousTitle;
      if (description && previousDescription !== undefined) description.content = previousDescription;
      if (canonical && previousCanonical) canonical.href = previousCanonical;
    };
  }, []);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Freelancing Client Acquisition Toolkit",
    description: "A practical digital toolkit with client outreach scripts, proposal templates, discovery questions and onboarding checklists.",
    brand: { "@type": "Brand", name: "CoreSkils" },
    url: PRODUCT_URL,
    category: "Digital product",
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: "299",
      availability: "https://schema.org/PreOrder",
      url: PRODUCT_URL,
    },
  };

  return (
    <PublicLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <main className="min-h-screen bg-[#F7FAF8] text-black">
        <section className="relative overflow-hidden bg-[#0B3027] pb-16 pt-28 text-white sm:pb-24 sm:pt-36">
          <div className="absolute -right-24 top-24 h-72 w-72 rounded-full bg-[#16CF75]/15 blur-3xl" />
          <div className="container relative mx-auto grid items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.15fr_.85fr] lg:px-8">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#56E59B]/30 bg-[#16CF75]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#79F0B1]">
                <Sparkles className="h-4 w-4" /> Digital toolkit
              </span>
              <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl" data-testid="heading-freelancing-toolkit">
                Freelancing Client Acquisition Toolkit
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75">
                A practical set of scripts, templates and checklists designed to help new freelancers approach suitable clients, run better discovery calls and start projects professionally.
              </p>
              <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/80">
                {["Instant digital delivery", "PDF + editable templates", "Created for beginners"].map((item) => (
                  <span key={item} className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
                    <CheckCircle2 className="h-4 w-4 text-[#5EE9A0]" /> {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="mx-auto w-full max-w-md">
              <img
                src={`${import.meta.env.BASE_URL}products/freelancing-toolkit-cover.svg`}
                alt="Freelancing Client Acquisition Toolkit digital product cover"
                width="720"
                height="900"
                decoding="async"
                className="w-full rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,.4)]"
              />
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-20">
          <div className="container mx-auto grid gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_390px] lg:px-8">
            <div className="space-y-14">
              <section>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#0B8F50]">What you receive</p>
                <h2 className="mt-3 text-3xl font-bold sm:text-4xl">A complete starting system—not generic motivation</h2>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {[
                    ["Client outreach scripts", "Email and direct-message structures for warm and cold outreach, with guidance on responsible personalisation."],
                    ["Proposal framework", "A reusable proposal structure covering scope, milestones, timeline, revision limits and next steps."],
                    ["Discovery call questions", "A structured question bank to understand the client’s goal, constraints, decision process and success criteria."],
                    ["Onboarding checklist", "A pre-project checklist for documents, access, communication, approvals and payment milestones."],
                    ["Follow-up sequences", "Polite follow-up templates for unanswered outreach, proposal decisions and project confirmations."],
                    ["Pricing worksheet", "A simple worksheet for estimating time, operating costs, risk and project scope before quoting."],
                  ].map(([title, body]) => (
                    <article key={title} className="rounded-xl border border-[#DDE7E2] bg-white p-6 shadow-sm">
                      <BadgeCheck className="h-6 w-6 text-[#0B9E59]" />
                      <h3 className="mt-4 text-lg font-bold">{title}</h3>
                      <p className="mt-2 text-sm leading-6 text-[#55635E]">{body}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl bg-[#EAF8F0] p-7 sm:p-9">
                <h2 className="text-2xl font-bold sm:text-3xl">Who this toolkit is for</h2>
                <ul className="mt-6 space-y-4">
                  {[
                    "Students and professionals preparing to offer a freelance service",
                    "New freelancers who need a repeatable, professional outreach process",
                    "Designers, developers, writers, marketers and independent consultants",
                    "People who want practical templates without unrealistic income promises",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-[#31443D]">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#0B9E59]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold sm:text-3xl">Digital delivery and usage</h2>
                <div className="mt-5 space-y-4 text-base leading-7 text-[#4D5D57]">
                  <p>After successful payment confirmation, the toolkit will be delivered electronically to the customer’s CoreSkils account and registered email. No physical shipment is involved.</p>
                  <p>The purchase provides one individual, non-transferable licence. Templates may be adapted for the buyer’s own freelance business, but the files may not be resold, shared publicly or redistributed.</p>
                  <p>This toolkit provides educational material and working templates. It does not guarantee clients, revenue, employment or business results.</p>
                </div>
              </section>
            </div>

            <aside>
              <div className="sticky top-28 overflow-hidden rounded-2xl border border-[#DDE7E2] bg-white shadow-[0_20px_60px_rgba(20,55,42,.12)]">
                <div className="p-7">
                  <p className="text-sm font-semibold text-[#66746E]">One-time price</p>
                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-5xl font-bold">₹299</span>
                    <span className="pb-1 text-sm text-[#66746E]">INR</span>
                  </div>
                  <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                    <strong>Payment activation in progress.</strong><br />
                    Razorpay checkout is not enabled yet. No payment will be collected from this page until secure payment verification is active.
                  </div>
                  <button disabled className="mt-5 h-14 w-full cursor-not-allowed rounded-lg bg-[#BFC8C4] px-5 font-bold text-white" data-testid="button-payment-coming-soon">
                    Payments coming soon
                  </button>
                  <a
                    href={SAMPLE_URL}
                    download
                    className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-[#0B9E59] px-5 font-bold text-[#087B46] transition-colors hover:bg-[#EDF9F3]"
                    data-testid="link-download-toolkit-sample"
                  >
                    <Download className="h-4 w-4" /> Download free sample
                  </a>
                </div>
                <div className="border-t border-[#E5E5E5] bg-[#FAFCFB] p-7">
                  <h3 className="flex items-center gap-2 font-bold"><FileText className="h-5 w-5 text-[#0B9E59]" /> Product details</h3>
                  <dl className="mt-5 space-y-4 text-sm">
                    <div className="flex justify-between gap-4"><dt className="text-[#66746E]">Format</dt><dd className="font-semibold">Digital PDF & templates</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-[#66746E]">Delivery</dt><dd className="text-right font-semibold">Online, after payment</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-[#66746E]">Licence</dt><dd className="font-semibold">Single user</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-[#66746E]">Support</dt><dd className="font-semibold">Email</dd></div>
                  </dl>
                  <div className="mt-6 flex items-start gap-2 text-xs leading-5 text-[#66746E]">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0B9E59]" />
                    Access/download refund conditions apply. Read the policy before purchase.
                  </div>
                  <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-[#087B46]">
                    <Link href="/refund-policy">Refund policy</Link>
                    <Link href="/terms">Terms</Link>
                    <Link href="/privacy">Privacy</Link>
                  </div>
                </div>
              </div>
              <p className="mt-5 flex items-center justify-center gap-2 text-sm text-[#66746E]">
                <Mail className="h-4 w-4" /> Support: growora.org@gmail.com
              </p>
            </aside>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}