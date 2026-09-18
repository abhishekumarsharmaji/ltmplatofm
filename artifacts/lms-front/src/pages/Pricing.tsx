import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { CheckCircle2, X } from "lucide-react";
import { Link } from "wouter";

export default function Pricing() {
  const plans = [
    {
      name: "Basic",
      price: "$0",
      period: "forever",
      description: "Get started with fundamental learning.",
      features: [
        "Access to 5 introductory courses",
        "Basic progress tracking",
        "Community forum access",
        "Standard support"
      ],
      notIncluded: [
        "Verified certificates",
        "AI Tutor access",
        "Offline downloads",
        "1-on-1 mentoring"
      ],
      cta: "Start for free",
      highlight: false
    },
    {
      name: "Pro",
      price: "$29",
      period: "per month",
      description: "Everything you need to master new skills.",
      features: [
        "Unlimited access to all 500+ courses",
        "Verified certificates of completion",
        "24/7 AI Tutor assistance",
        "Offline video downloads",
        "Advanced progress analytics",
        "Priority support"
      ],
      notIncluded: [
        "1-on-1 mentoring"
      ],
      cta: "Start 7-day free trial",
      highlight: true
    },
    {
      name: "Team",
      price: "$99",
      period: "per user/month",
      description: "Upskill your entire organization.",
      features: [
        "Everything in Pro",
        "Team analytics dashboard",
        "Custom learning paths",
        "1-on-1 mentoring sessions",
        "API access & integrations",
        "Dedicated account manager"
      ],
      notIncluded: [],
      cta: "Contact sales",
      highlight: false
    }
  ];

  return (
    <PublicLayout>
      <div className="bg-white min-h-screen pt-32 pb-0 lg:pt-40 flex flex-col">
        <div className="container mx-auto px-4 lg:px-8 flex-1 mb-24 lg:mb-36">
          <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24 space-y-6">
            <h1 className="text-[48px] sm:text-[60px] leading-[1.1] text-black">
              <span className="font-light block">Simple, transparent</span>
              <span className="font-bold block">pricing</span>
            </h1>
            <p className="text-[18px] text-[#4D4D4D] leading-relaxed max-w-2xl mx-auto">
              Choose the perfect plan for your learning journey. Upgrade or downgrade at any time.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-[1100px] mx-auto">
            {plans.map((plan) => (
              <div 
                key={plan.name}
                className={`relative rounded-lg p-8 flex flex-col bg-white border ${
                  plan.highlight 
                    ? "border-primary shadow-[0_15px_40px_rgba(21,207,116,0.1)]" 
                    : "border-[#E5E5E5] hover:shadow-lg hover:border-gray-300 transition-all"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-[#E3F9EF] text-primary border border-primary text-[13px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="mb-8">
                  <h3 className="text-[20px] font-bold text-black mb-3">{plan.name}</h3>
                  <p className="text-[14px] text-[#4D4D4D] mb-6 min-h-[40px] leading-relaxed">{plan.description}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[46px] font-bold text-black leading-none">{plan.price}</span>
                    <span className="text-[#9794AA] text-[14px]">/{plan.period}</span>
                  </div>
                </div>
                
                <Link href={plan.name === "Basic" ? "/auth/sign-up" : "/auth/login"}>
                  <Button 
                    className={`w-full mb-8 rounded-md h-[48px] text-[16px] ${
                      plan.highlight 
                        ? "bg-primary hover:bg-[#10A364] text-white font-medium shadow-[0_10px_24px_rgba(21,207,116,0.35)]" 
                        : "bg-white hover:bg-gray-50 text-[#394649] font-medium border border-[#DADADA]"
                    }`}
                    variant={plan.highlight ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
                
                <div className="flex-1 space-y-4">
                  <p className="text-[14px] font-bold text-black uppercase tracking-wider mb-4">What's included</p>
                  <ul className="space-y-4">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-[15px] text-[#394649]">
                        <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${plan.highlight ? "text-primary" : "text-gray-400"}`} />
                        <span className="leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {plan.notIncluded.length > 0 && (
                    <>
                      <p className="text-[14px] font-bold text-[#9794AA] uppercase tracking-wider mt-8 mb-4">Not included</p>
                      <ul className="space-y-4">
                        {plan.notIncluded.map((feature, i) => (
                          <li key={i} className="flex items-start gap-3 text-[15px] text-[#9794AA]">
                            <X className="w-5 h-5 shrink-0 mt-0.5" />
                            <span className="leading-snug">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* CTA BAND */}
        <section className="bg-[#224EA1] py-20 text-center px-4">
          <div className="max-w-3xl mx-auto flex flex-col items-center">
            <h2 className="text-[40px] md:text-[48px] font-normal text-white mb-6 leading-tight">
              Not sure which plan <br />is right for you?
            </h2>
            <p className="text-white/80 text-[18px] mb-10 max-w-xl">
              Our team can help you find the perfect fit for your learning goals and budget.
            </p>
            <Link href="/auth/sign-up">
              <Button className="h-[54px] px-10 bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[16px] shadow-[0_10px_24px_rgba(21,207,116,0.35)]">
                Contact Sales
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
