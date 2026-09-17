import { PublicLayout } from "@/components/layout/PublicLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Rocket } from "lucide-react";
import { Link } from "wouter";

export default function PlatformPricing() {
  const plans = [
    {
      name: "Starter",
      price: "$0",
      description: "Everything you need to launch your first school.",
      features: [
        "1 School / Subdomain",
        "Up to 100 active students",
        "3 published courses",
        "Stripe & manual payments",
        "Standard support",
        "5% transaction fee"
      ],
      cta: "Create your school",
      highlight: false
    },
    {
      name: "Creator",
      price: "$49",
      period: "/month",
      description: "For growing businesses and full-time educators.",
      features: [
        "1 School / Custom Domain",
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
      description: "For academies managing multiple schools and large teams.",
      features: [
        "Up to 5 Schools / Domains",
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
      <div className="bg-[#0A0A0A] min-h-screen text-white pt-24 pb-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <Badge variant="outline" className="border-zinc-800 text-zinc-400 rounded-full px-4 py-1">
              For Creators & Schools
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Start free, scale infinitely
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed">
              Launch your online academy today with our free tier. Only pay when you're ready to grow.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
            {plans.map((plan) => (
              <div 
                key={plan.name}
                className={`relative rounded-3xl p-8 flex flex-col ${
                  plan.highlight 
                    ? "bg-gradient-to-b from-purple-900/20 to-purple-900/5 border border-purple-500/50 shadow-[0_0_40px_rgba(168,85,247,0.1)]" 
                    : "bg-zinc-900/40 border border-zinc-800/50"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-zinc-400 text-sm mb-6 min-h-[40px]">{plan.description}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black">{plan.price}</span>
                    {plan.period && <span className="text-zinc-500 text-sm">{plan.period}</span>}
                  </div>
                </div>
                
                <div className="flex-1 space-y-4 mb-8">
                  <ul className="space-y-4">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                        <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${plan.highlight ? "text-purple-400" : "text-zinc-500"}`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link href={plan.name === "Starter" ? "/create-school" : "/create-school?plan=" + plan.name.toLowerCase()}>
                  <Button 
                    className={`w-full rounded-xl h-12 mt-auto ${
                      plan.highlight 
                        ? "bg-purple-600 hover:bg-purple-500 text-white font-bold" 
                        : "bg-zinc-800 hover:bg-zinc-700 text-white font-medium border border-zinc-700"
                    }`}
                    variant={plan.highlight ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
          
          <div className="bg-gradient-to-r from-blue-900/30 via-purple-900/30 to-blue-900/30 border border-zinc-800 rounded-3xl p-10 max-w-4xl mx-auto text-center flex flex-col items-center">
            <Rocket className="w-12 h-12 text-blue-400 mb-6" />
            <h2 className="text-2xl font-bold mb-4">Enterprise needs?</h2>
            <p className="text-zinc-400 mb-8 max-w-xl">
              Need custom SLA, dedicated hosting, or specific compliance requirements? We build custom solutions for large organizations.
            </p>
            <Button className="bg-white text-black hover:bg-zinc-200 font-bold rounded-xl h-12 px-8">
              Contact Enterprise Sales
            </Button>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
