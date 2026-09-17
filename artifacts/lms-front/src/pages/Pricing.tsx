import { PublicLayout } from "@/components/layout/PublicLayout";
import { Badge } from "@/components/ui/badge";
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
      <div className="bg-[#0A0A0A] min-h-screen text-white pt-24 pb-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <Badge variant="outline" className="border-zinc-800 text-zinc-400 rounded-full px-4 py-1">
              Pricing
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Simple, transparent pricing
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed">
              Choose the perfect plan for your learning journey. Upgrade or downgrade at any time.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div 
                key={plan.name}
                className={`relative rounded-3xl p-8 flex flex-col ${
                  plan.highlight 
                    ? "bg-gradient-to-b from-blue-900/20 to-blue-900/5 border border-blue-500/50 shadow-[0_0_40px_rgba(37,99,235,0.1)]" 
                    : "bg-zinc-900/40 border border-zinc-800/50"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-zinc-400 text-sm mb-6 min-h-[40px]">{plan.description}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black">{plan.price}</span>
                    <span className="text-zinc-500 text-sm">/{plan.period}</span>
                  </div>
                </div>
                
                <Link href={plan.name === "Basic" ? "/auth/sign-up" : "/auth/login"}>
                  <Button 
                    className={`w-full mb-8 rounded-xl h-12 ${
                      plan.highlight 
                        ? "bg-blue-600 hover:bg-blue-500 text-white font-bold" 
                        : "bg-zinc-800 hover:bg-zinc-700 text-white font-medium border border-zinc-700"
                    }`}
                    variant={plan.highlight ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
                
                <div className="flex-1 space-y-4">
                  <p className="text-sm font-semibold text-white">What's included</p>
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                        <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${plan.highlight ? "text-blue-400" : "text-zinc-500"}`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {plan.notIncluded.length > 0 && (
                    <>
                      <p className="text-sm font-semibold text-zinc-500 mt-6 mb-4">Not included</p>
                      <ul className="space-y-3">
                        {plan.notIncluded.map((feature, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-zinc-600">
                            <X className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{feature}</span>
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
      </div>
    </PublicLayout>
  );
}
