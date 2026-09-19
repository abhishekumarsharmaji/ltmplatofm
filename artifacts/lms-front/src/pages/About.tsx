import { Link } from "wouter";
import { BadgeCheck, Download, Mail, ShieldCheck } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";

export default function About() {
  return (
    <PublicLayout>
      <main className="min-h-screen bg-white pb-0 pt-28 sm:pt-36">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-block rounded-full bg-[#E7F7EF] px-4 py-1.5 text-[13px] font-bold uppercase tracking-wider text-[#087B46]">About CoreSkils</span>
            <h1 className="mt-6 text-5xl font-bold leading-[1.08] text-black sm:text-6xl">Practical digital products with transparent terms</h1>
            <p className="mx-auto mt-7 max-w-3xl text-lg leading-8 text-[#4D5D57]">
              CoreSkils is an India-based digital-products website operated by Abhishek Kumar from Vadodara, Gujarat. We create downloadable educational toolkits for independent professionals.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-5 md:grid-cols-3">
            {[
              [BadgeCheck, "Clear product information", "Every product states its contents, format, intended audience, price, licence, and delivery method."],
              [Download, "Electronic delivery", "Products are delivered digitally after verified payment confirmation. No physical shipment is involved."],
              [Mail, "Accessible support", "Customers can contact growora.org@gmail.com for product, access, payment, refund, or privacy questions."],
            ].map(([Icon, title, body]) => {
              const CardIcon = Icon as typeof BadgeCheck;
              return (
                <article key={title as string} className="rounded-2xl border border-[#DDE7E2] bg-[#F7FBF9] p-7">
                  <CardIcon className="h-7 w-7 text-[#0B9E59]" />
                  <h2 className="mt-5 text-xl font-bold text-black">{title as string}</h2>
                  <p className="mt-3 text-sm leading-6 text-[#52635C]">{body as string}</p>
                </article>
              );
            })}
          </div>

          <div className="mx-auto my-20 grid max-w-5xl gap-12 border-y border-[#DDE7E2] py-14 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold text-black">What we provide</h2>
              <p className="mt-4 leading-7 text-[#4D5D57]">
                CoreSkils provides practical guides, templates, worksheets, and checklists that customers can apply to their own learning or professional workflow. Product descriptions explain exactly what is included.
              </p>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-black">What we do not promise</h2>
              <p className="mt-4 leading-7 text-[#4D5D57]">
                Educational resources cannot guarantee clients, income, employment, qualifications, or business outcomes. Results depend on the customer’s circumstances, decisions, effort, and responsible use.
              </p>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-black">How purchases work</h2>
              <p className="mt-4 leading-7 text-[#4D5D57]">
                Customers can review the price, deliverables, sample, delivery terms, refund conditions, and support details before paying. Access will be granted only after server-side payment confirmation.
              </p>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-black">Payment safety</h2>
              <p className="mt-4 leading-7 text-[#4D5D57]">
                Payments will be handled by the authorised gateway displayed at checkout. CoreSkils does not request or store complete card details, CVV, OTPs, banking passwords, or UPI PINs.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-[#123D32] px-4 py-16 text-center text-white">
          <ShieldCheck className="mx-auto h-9 w-9 text-[#6CE7A6]" />
          <h2 className="mt-5 text-3xl font-bold">Review the product before purchase</h2>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-white/75">See the exact deliverables and download the free sample of our featured digital toolkit.</p>
          <Link href="/products/freelancing-client-acquisition-toolkit" className="mt-7 inline-flex h-12 items-center justify-center rounded-md bg-primary px-7 font-semibold text-white hover:bg-[#10A364]">View featured product</Link>
        </section>
      </main>
    </PublicLayout>
  );
}