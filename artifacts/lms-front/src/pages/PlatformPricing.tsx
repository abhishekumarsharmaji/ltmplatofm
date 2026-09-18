import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Rocket } from "lucide-react";
import { Link } from "wouter";

export default function PlatformPricing() {
  const plans = [
    {
      name: "Starter",
      price: "$0",
      description: "Everything you need to launch your first course.",
      features: [
        "1 Creator account",
        "Up to 100 active students",
        "3 published courses",
        "Stripe & manual payments",
        "Standard support",
        "5% transaction fee"
      ],
      cta: "Start teaching",
      highlight: false
    },
    {
      name: "Creator",
      price: "$49",
      period: "/month",
      description: "For growing businesses and full-time educators.",
      features: [
        "Custom Domain",
        "Unlimited active students",
        "Unlimited courses",
        "AI Tutor integration",
        "Advanced analytics",
        "Priority support",
        "0% transaction fee"
      ],
      cta: "Start 14-day trial",
      highlight: true
    },
    {
      name: "Scale",
      price: "$199",
      period: "/month",
      description: "For academies managing multiple creators and large teams.",
      features: [
        "Up to 5 Domains",
        "Advanced role-based access",
        "API access & webhooks",
        "White-labeling options",
        "SSO (SAML/OIDC)",
        "Dedicated success manager",
        "0% transaction fee"
      ],
      cta: "Contact sales",
      highlight: false
    }
  ];

  return (
    <PublicLayout>
      <div className="bg-white min-h-screen pt-32 pb-0 lg:pt-40 flex flex-col">
        <div className="container mx-auto px-4 lg:px-8 flex-1 mb-24 lg:mb-36">
          <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24 space-y-6">
            <span className="inline-block bg-[#E4E4E4] text-[#394649] text-[13px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-2">
              For Creators & Instructors
            </span>
            <h1 className="text-[48px] sm:text-[60px] leading-[1.1] text-black">
              <span className="font-light block">Start free,</span>
              <span className="font-bold block">scale infinitely</span>
            </h1>
            <p className="text-[18px] text-[#4D4D4D] leading-relaxed max-w-2xl mx-auto">
              Launch your online academy today with our free tier. Only pay when you're ready to grow.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-[1100px] mx-auto mb-24">
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
                    {plan.period && <span className="text-[#9794AA] text-[14px]">{plan.period}</span>}
                  </div>
                </div>
                
                <div className="flex-1 space-y-4 mb-8">
                  <ul className="space-y-4">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-[15px] text-[#394649]">
                        <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${plan.highlight ? "text-primary" : "text-gray-400"}`} />
                        <span className="leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link href={plan.name === "Starter" ? "/auth/sign-up" : "/auth/sign-up?plan=" + plan.name.toLowerCase()}>
                  <Button 
                    className={`w-full rounded-md h-[48px] text-[16px] mt-auto ${
                      plan.highlight 
                        ? "bg-primary hover:bg-[#10A364] text-white font-medium shadow-[0_10px_24px_rgba(21,207,116,0.35)]" 
                        : "bg-white hover:bg-gray-50 text-[#394649] font-medium border border-[#DADADA]"
                    }`}
                    variant={plan.highlight ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* CTA BAND */}
        <section className="bg-[#222222] py-20 text-center px-4">
          <div className="max-w-3xl mx-auto flex flex-col items-center">
            <div className="w-16 h-16 bg-[#515151] rounded-full flex items-center justify-center mb-6">
              <Rocket className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-[40px] md:text-[48px] font-normal text-white mb-6 leading-tight">
              Enterprise needs?
            </h2>
            <p className="text-white/80 text-[18px] mb-10 max-w-xl">
              Need custom SLA, dedicated hosting, or specific compliance requirements? We build custom solutions for large organizations.
            </p>
            <Link href="/auth/sign-up">
              <Button className="h-[54px] px-10 bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[16px] shadow-[0_10px_24px_rgba(21,207,116,0.35)]">
                Contact Enterprise Sales
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
