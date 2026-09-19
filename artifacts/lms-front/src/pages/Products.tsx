import { Link } from "wouter";
import { CheckCircle2, Download } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";

export default function Products() {
  return (
    <PublicLayout>
      <main className="min-h-screen bg-[#F7FAF8] pb-24 pt-28 sm:pt-36">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#0B8F50]">CoreSkils catalogue</p>
            <h1 className="mt-3 text-4xl font-bold text-black sm:text-5xl">Digital Products</h1>
            <p className="mt-5 text-lg leading-8 text-[#52635C]">
              Genuine downloadable resources with transparent pricing, clear deliverables, electronic delivery terms, and customer support.
            </p>
          </header>

          <section className="mx-auto mt-14 grid max-w-5xl overflow-hidden rounded-2xl border border-[#C9DED3] bg-white shadow-[0_20px_60px_rgba(20,80,55,.1)] md:grid-cols-[.82fr_1.18fr]">
            <img src={`${import.meta.env.BASE_URL}products/freelancing-toolkit-cover.svg`} alt="Freelancing Client Acquisition Toolkit" className="h-full w-full bg-[#0B3027] object-cover" />
            <div className="flex flex-col p-7 sm:p-10">
              <span className="w-fit rounded-full bg-[#E4F8EE] px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[#087B46]">Digital toolkit</span>
              <h2 className="mt-5 text-3xl font-bold leading-tight text-black">Freelancing Client Acquisition Toolkit</h2>
              <p className="mt-4 leading-7 text-[#52635C]">Practical outreach scripts, proposal guidance, discovery questions, follow-up sequences, pricing worksheets, and an onboarding checklist.</p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {["PDF guide and templates", "Single-user licence", "Electronic delivery", "Email support"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm font-semibold text-[#31443D]"><CheckCircle2 className="h-4 w-4 text-[#0B9E59]" />{item}</li>
                ))}
              </ul>
              <div className="mt-8 border-t border-[#E1E9E5] pt-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="block text-3xl font-bold text-black">₹299 INR</span>
                    <span className="mt-1 block text-xs font-bold uppercase tracking-wide text-amber-700">Payment activation in progress</span>
                  </div>
                  <Link href="/products/freelancing-client-acquisition-toolkit" className="inline-flex h-12 items-center justify-center rounded-md bg-[#123D32] px-6 font-semibold text-white hover:bg-[#0B3027]">
                    View product
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <div className="mx-auto mt-10 flex max-w-5xl flex-col items-center justify-between gap-5 rounded-xl border border-[#DDE7E2] bg-white p-6 text-center sm:flex-row sm:text-left">
            <div>
              <h2 className="font-bold text-black">Evaluate before purchase</h2>
              <p className="mt-1 text-sm text-[#596963]">Download the free sample to review the content style and practical approach.</p>
            </div>
            <a href={`${import.meta.env.BASE_URL}products/freelancing-client-acquisition-toolkit-sample.pdf`} download className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md border border-[#0B9E59] px-5 font-semibold text-[#087B46] hover:bg-[#F1FAF5]">
              <Download className="h-4 w-4" /> Download sample PDF
            </a>
          </div>
        </div>
      </main>
    </PublicLayout>
  );
}