import { PublicLayout } from "@/components/layout/PublicLayout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useMarketplaceCourses, useListCategories } from "@workspace/api-client-react";

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

export default function About() {
  const coursesQuery = useMarketplaceCourses({});
  const categoriesQuery = useListCategories();
  const courses = coursesQuery.data ?? [];
  const statsLoading = coursesQuery.isLoading || categoriesQuery.isLoading;

  // Only stats with a real, non-zero value are shown.
  const stats = [
    {
      value: courses.length,
      label: "Courses",
      caption: "Published courses you can start right now.",
    },
    {
      value: courses.reduce((sum, c) => sum + (c.lessons || 0), 0),
      label: "Lessons",
      caption: "Video lessons across every course.",
    },
    {
      value: (categoriesQuery.data ?? []).length,
      label: "Categories",
      caption: "Topics to explore, from business to design.",
    },
  ].filter((stat) => stat.value > 0);

  return (
    <PublicLayout>
      <div className="bg-white min-h-screen pt-32 pb-0 lg:pt-40 flex flex-col">
        <div className="container mx-auto px-4 lg:px-8 flex-1 mb-24 lg:mb-36">
          
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-6 mb-16">
              <span className="inline-block bg-[#E4E4E4] text-[#394649] text-[13px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                About Us
              </span>
              <h1 className="text-[48px] sm:text-[60px] leading-[1.1] text-black">
                <span className="font-light block">Practical learning and</span>
                <span className="font-bold block">useful digital products</span>
              </h1>
            </div>
            
            <div className="text-[18px] md:text-[20px] leading-relaxed text-[#4D4D4D] text-center max-w-3xl mx-auto">
              CoreSkils is an India-based online learning and digital-products platform operated by Abhishek Kumar from Vadodara, Gujarat. Customers can explore practical courses and clearly described downloadable toolkits in one accessible website.
            </div>
            
            <div className="my-16 grid gap-5 rounded-2xl border border-[#CFE2D8] bg-[#F2FAF6] p-7 shadow-sm md:grid-cols-3 md:p-10">
              {[
                ["Clear product information", "Each paid digital product states its price, contents, format, intended audience, delivery method and usage licence."],
                ["Electronic delivery", "Digital access is provided after verified payment confirmation. No physical shipment is involved unless explicitly stated."],
                ["Accessible support", "Customers can contact growora.org@gmail.com for product, access, payment, refund or privacy questions."],
              ].map(([title, body]) => (
                <div key={title}>
                  <h2 className="text-lg font-bold text-black">{title}</h2>
                  <p className="mt-3 text-sm leading-6 text-[#4D5D57]">{body}</p>
                </div>
              ))}
            </div>
            
            <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
              <div className="space-y-4">
                <h2 className="text-[32px] font-bold text-black">What we provide</h2>
                <p className="text-[16px] text-[#394649] leading-relaxed">
                  We provide practical educational resources, structured online courses, and digital toolkits that customers can use in their own learning or work. Product pages explain exactly what is included without promising guaranteed income, employment, or business results.
                </p>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-[32px] font-bold text-black">How purchases work</h2>
                <p className="text-[16px] text-[#394649] leading-relaxed">
                  Before purchase, customers can review pricing, deliverables, delivery terms, refund conditions and support details. When payments are enabled, access will be granted only after the payment provider confirms success. Complete card details, CVV, OTPs and UPI PINs are never collected by CoreSkils.
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 my-20" data-testid="about-stats">
              {stats.map((stat) => (
                <div key={stat.label} className="w-[calc(50%-12px)] lg:w-[220px] bg-[#515151] rounded-lg py-10 px-4 flex flex-col items-center justify-center shadow-sm text-center">
                  {statsLoading ? (
                    <div className="h-[46px] w-16 rounded bg-white/10 animate-pulse mb-2" aria-hidden="true" />
                  ) : (
                    <div className="text-[46px] font-bold text-primary mb-2 leading-none">{compact.format(stat.value)}</div>
                  )}
                  <div className="font-bold text-white text-[15px] mb-2 uppercase tracking-wider">{stat.label}</div>
                  <p className="text-[13px] text-gray-300 max-w-[200px] mt-1">{stat.caption}</p>
                </div>
              ))}
            </div>
            
          </div>
        </div>

        {/* CTA BAND */}
        <section className="bg-[#224EA1] py-20 text-center px-4">
          <div className="max-w-3xl mx-auto flex flex-col items-center">
            <h2 className="text-[40px] md:text-[48px] font-normal text-white mb-6 leading-tight">
              Explore CoreSkils digital resources
            </h2>
            <p className="text-white/80 text-[18px] mb-10 max-w-xl">
              Review our digital products, download available samples, or contact support before purchasing.
            </p>
            <Link href="/products">
              <Button className="h-[54px] px-10 bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[16px] shadow-[0_10px_24px_rgba(21,207,116,0.35)]">
                Browse digital products
              </Button>
            </Link>
          </div>
        </section>

      </div>
    </PublicLayout>
  );
}
