import { Link } from "wouter";
import { CheckCircle2, Download, FileText, Headphones, ShieldCheck } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";

export default function Home() {
  return (
    <PublicLayout>
      <main className="min-h-screen bg-white">
        <section className="relative overflow-hidden pb-20 pt-28 sm:pt-36 lg:pb-28">
          <div className="container mx-auto grid items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:px-8">
            <div>
              <p className="mb-5 text-sm font-bold uppercase tracking-[0.16em] text-[#0B8F50]">Practical digital resources</p>
              <h1 className="max-w-3xl text-5xl font-bold leading-[1.06] text-black sm:text-6xl">
                Ready-to-use digital toolkits for independent professionals.
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-[#4D5D57]">
                CoreSkils creates practical downloadable guides, templates, and checklists with transparent pricing, clear electronic delivery terms, and accessible customer support.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/products/freelancing-client-acquisition-toolkit" className="inline-flex h-14 items-center justify-center rounded-md bg-primary px-8 font-semibold text-white shadow-[0_10px_24px_rgba(21,207,116,.3)] hover:bg-[#10A364]">
                  View featured toolkit
                </Link>
                <Link href="/contact" className="inline-flex h-14 items-center justify-center rounded-md border border-[#C9D4CF] px-8 font-semibold text-[#27463A] hover:bg-[#F4F8F6]">
                  Contact support
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#52635C]">
                {["Digital delivery", "Clear product licence", "No income guarantees"].map((item) => (
                  <span key={item} className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#0B9E59]" />{item}</span>
                ))}
              </div>
            </div>
            <img src={`${import.meta.env.BASE_URL}products/freelancing-toolkit-cover.svg`} alt="Freelancing Client Acquisition Toolkit cover" className="mx-auto w-full max-w-md rounded-2xl shadow-[0_30px_80px_rgba(12,68,47,.25)]" fetchPriority="high" />
          </div>
        </section>

        <section className="border-y border-[#DDE7E2] bg-[#F4FAF7] py-20">
          <div className="container mx-auto grid items-center gap-12 px-4 sm:px-6 lg:grid-cols-[.8fr_1.2fr] lg:px-8">
            <img src={`${import.meta.env.BASE_URL}products/freelancing-toolkit-cover.svg`} alt="" className="mx-auto hidden w-full max-w-sm rounded-2xl shadow-[0_20px_55px_rgba(20,80,55,.2)] lg:block" loading="lazy" />
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#0B8F50]">Featured digital product</p>
              <h2 className="mt-3 text-4xl font-bold leading-tight text-black">Freelancing Client Acquisition Toolkit</h2>
              <p className="mt-5 max-w-2xl text-[17px] leading-8 text-[#4D5D57]">
                A practical collection of outreach scripts, discovery questions, proposal guidance, pricing worksheets, follow-up sequences, and an onboarding checklist for new freelancers.
              </p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {["Client outreach scripts", "Proposal framework", "Discovery question bank", "Project onboarding checklist"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm font-semibold text-[#31443D]"><CheckCircle2 className="h-5 w-5 text-[#0B9E59]" />{item}</li>
                ))}
              </ul>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <span className="text-3xl font-bold text-black">₹299 INR</span>
                <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-amber-800">Payment activation in progress</span>
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/products/freelancing-client-acquisition-toolkit" className="inline-flex h-12 items-center justify-center rounded-md bg-[#123D32] px-7 font-semibold text-white hover:bg-[#0B3027]">
                  View full product details
                </Link>
                <a href={`${import.meta.env.BASE_URL}products/freelancing-client-acquisition-toolkit-sample.pdf`} download className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-[#0B9E59] px-6 font-semibold text-[#087B46] hover:bg-white">
                  <Download className="h-4 w-4" /> Download free sample
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#0B8F50]">Transparent customer experience</p>
              <h2 className="mt-3 text-4xl font-bold">Clear information before payment</h2>
              <p className="mt-4 text-[#5A6963]">Every CoreSkils product explains what the customer receives, how delivery works, and which policies apply.</p>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {[
                [FileText, "Review exact deliverables", "Check the contents, format, intended audience, price, licence, and available sample before purchase."],
                [ShieldCheck, "Verified payment processing", "When checkout is active, access will be granted only after server-side confirmation from the authorised payment gateway."],
                [Headphones, "Delivery and support", "Digital access is provided electronically. Product, access, refund, and privacy questions are handled by email support."],
              ].map(([Icon, title, body]) => {
                const CardIcon = Icon as typeof FileText;
                return (
                  <article key={title as string} className="rounded-2xl border border-[#DDE7E2] bg-[#FAFCFB] p-7">
                    <CardIcon className="h-7 w-7 text-[#0B9E59]" />
                    <h3 className="mt-5 text-xl font-bold">{title as string}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#596963]">{body as string}</p>
                  </article>
                );
              })}
            </div>
            <div className="mt-9 flex flex-wrap justify-center gap-5 text-sm font-semibold text-[#087B46]">
              <Link href="/shipping-delivery">Digital delivery policy</Link>
              <Link href="/refund-policy">Refund policy</Link>
              <Link href="/terms">Terms and conditions</Link>
              <Link href="/contact">Customer support</Link>
            </div>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}