import { PublicLayout } from "@/components/layout/PublicLayout";
import { Link } from "wouter";

const BUSINESS = {
  platform: "CoreSkils",
  updated: "20 September 2026",
};

type Section = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

function CompliancePage({ title, intro, sections }: { title: string; intro: string; sections: Section[] }) {
  return (
    <PublicLayout>
      <main className="min-h-screen bg-[#FAFAFA] pb-20 pt-28 sm:pt-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white shadow-sm">
            <header className="border-b border-[#E5E5E5] bg-[#123D32] px-6 py-10 text-white sm:px-10 sm:py-14">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#8FF0BD]">CoreSkils policies</p>
              <h1 className="text-3xl font-bold sm:text-5xl" data-testid={`heading-${title.toLowerCase().replaceAll(" ", "-")}`}>{title}</h1>
              <p className="mt-5 max-w-3xl text-sm leading-7 text-white/80 sm:text-base">{intro}</p>
              <p className="mt-4 text-xs text-white/60">Last updated: {BUSINESS.updated}</p>
            </header>
            <div className="space-y-9 px-6 py-10 sm:px-10">
              {sections.map((section) => (
                <section key={section.title}>
                  <h2 className="mb-3 text-xl font-bold text-black sm:text-2xl">{section.title}</h2>
                  <div className="space-y-3 text-[15px] leading-7 text-[#4D4D4D] sm:text-base">
                    {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    {section.bullets && (
                      <ul className="list-disc space-y-2 pl-6">
                        {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                      </ul>
                    )}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </main>
    </PublicLayout>
  );
}

export function TermsPage() {
  return <CompliancePage title="Terms and Conditions" intro="These terms govern access to and use of the CoreSkils website, downloadable digital products, and related services." sections={[
    { title: "1. About CoreSkils", paragraphs: [`${BUSINESS.platform} creates and supplies downloadable educational toolkits, courses, and related services for individual customers.`] },
    { title: "2. Acceptance of terms", paragraphs: ["By creating an account, purchasing or accessing content, or otherwise using CoreSkils, you agree to these Terms, our Privacy Policy, Refund and Cancellation Policy, and other policies linked on the website. If you do not agree, do not use the services."] },
    { title: "3. Accounts and eligibility", bullets: ["You must provide accurate and current information.", "You are responsible for maintaining the confidentiality of your login and for activity under your account.", "You must notify us promptly if you suspect unauthorised access.", "Users under 18 may use the service only with consent and supervision of a parent or lawful guardian."] },
    { title: "4. Digital products", paragraphs: ["Descriptions, included materials, access conditions and prices displayed on the relevant product page form part of the offer. Products are supplied electronically."], bullets: ["Content is licensed for the purchaser’s personal, non-transferable use.", "You may not resell, share, scrape, reproduce or redistribute files without written permission.", "Educational products do not guarantee clients, employment, income, qualifications, or business outcomes."] },
    { title: "5. Pricing and payments", paragraphs: ["Prices and applicable currency are shown before payment. When paid products are enabled, payments are processed by an authorised third-party payment gateway. CoreSkils does not store complete card, UPI PIN or net-banking credentials. A payment is complete only after server-side confirmation from the payment provider."] },
    { title: "6. Cancellations and refunds", paragraphs: ["Refund eligibility is governed by the Refund and Cancellation Policy published on this website. Because files are digitally delivered, access or download may limit refund eligibility, except for duplicate charges, verified technical failure, or rights that cannot be excluded under applicable law."] },
    { title: "7. Acceptable use", bullets: ["Do not use the website for unlawful, fraudulent or abusive activity.", "Do not bypass access controls, payment checks, download restrictions or platform security.", "Do not upload malware or content that infringes privacy, intellectual property or other rights.", "Do not impersonate another person or misrepresent credentials, reviews or product outcomes."] },
    { title: "8. Intellectual property", paragraphs: ["The CoreSkils brand, website design, software, and digital-product content are protected by applicable intellectual-property laws. No ownership transfers to a customer through access or purchase."] },
    { title: "9. Suspension and termination", paragraphs: ["We may restrict or terminate access for material breach, fraud, payment abuse, security risk, unlawful conduct or infringement. Where reasonably possible, we will provide notice and an opportunity to address the issue."] },
    { title: "10. Disclaimers and liability", paragraphs: ["Services are provided with reasonable care but may occasionally be unavailable for maintenance, network failure or events beyond our control. To the maximum extent permitted by law, indirect or consequential loss is excluded. Nothing in these Terms limits rights or liability that cannot lawfully be limited."] },
    { title: "11. Governing law and disputes", paragraphs: ["These Terms are governed by the laws of India. The parties should first attempt to resolve concerns through written support. Unresolved disputes will be handled by courts having jurisdiction under applicable law."] },
    { title: "12. Changes", paragraphs: ["We may update these Terms to reflect service or legal changes. The updated date will be shown above. Material changes will apply prospectively, and continued use after they take effect constitutes acceptance."] },
  ]} />;
}

export function PrivacyPage() {
  return <CompliancePage title="Privacy Policy" intro="This policy explains what personal information CoreSkils collects, why it is used, when it is shared, and the choices available to you." sections={[
    { title: "1. Data controller and contact", paragraphs: ["CoreSkils is responsible for the personal information processed through this platform. Privacy requests can be submitted through the support options available on the platform."] },
    { title: "2. Information we collect", bullets: ["Account details such as name, email address and authentication information.", "Product order, access, download, and entitlement records.", "Payment references, status, amount and provider identifiers; complete payment credentials are handled by the payment gateway.", "Device, browser, IP address, security logs and service-usage information.", "Messages and support information you voluntarily provide."] },
    { title: "3. Why we use information", bullets: ["Provide accounts, product access, downloads and customer support.", "Process and verify payments, refunds and entitlements.", "Operate the digital-product website.", "Prevent fraud, abuse and unauthorised access.", "Comply with accounting, tax, legal and regulatory obligations.", "Improve reliability and performance using aggregated or limited technical data.", "Send essential service messages and, only where permitted, marketing communications."] },
    { title: "4. Legal grounds", paragraphs: ["Depending on the activity, processing is necessary to perform our contract with you, comply with law, protect legitimate interests such as security and service improvement, or act on your consent. You may withdraw consent where consent is the applicable basis."] },
    { title: "5. Sharing and processors", paragraphs: ["We share only what is reasonably necessary with service providers such as payment gateways, hosting, database, object-storage, email, analytics and live-class infrastructure. We may also disclose information when required by law, to protect users, or as part of a legitimate business reorganisation subject to appropriate safeguards. We do not sell personal information."] },
    { title: "6. Payment information", paragraphs: ["Payments are handled by the payment gateway shown at checkout, which processes payment information under its own privacy and security terms. CoreSkils receives transaction status and reference data required to confirm access and maintain records."] },
    { title: "7. Cookies and local storage", paragraphs: ["Essential cookies maintain secure login sessions and preferences. Limited browser storage may be used for interface settings. Where non-essential analytics or advertising cookies are introduced, any consent required by applicable law will be requested."] },
    { title: "8. Retention", paragraphs: ["Information is retained only as long as needed for the stated purposes, contractual obligations, dispute handling, fraud prevention, and tax or legal recordkeeping. Data may be securely deleted or anonymised when no longer required."] },
    { title: "9. Security", paragraphs: ["We use access controls, encrypted HTTPS transport, restricted credentials and service monitoring. No internet service can guarantee absolute security. Please use a strong password and report suspicious activity immediately."] },
    { title: "10. Your choices and rights", bullets: ["Request access to or correction of your personal information.", "Request deletion where retention is not legally or operationally required.", "Withdraw consent and opt out of optional marketing.", "Raise a privacy complaint or ask how your information is used."] },
    { title: "11. Children", paragraphs: ["CoreSkils is not intended to knowingly collect personal information from children without appropriate guardian involvement. Contact us if you believe a child has submitted information without valid consent."] },
    { title: "12. Updates", paragraphs: ["We may update this policy as our services or legal requirements change. The current version and updated date will remain publicly available here."] },
  ]} />;
}

export function RefundPage() {
  return <CompliancePage title="Refund and Cancellation Policy" intro="This policy applies to downloadable digital products purchased through CoreSkils once online payments are enabled." sections={[
    { title: "1. Digital-delivery rule", paragraphs: ["Products are supplied digitally. A purchase is generally not refundable after protected content has been accessed or a file has been downloaded. This rule prevents completed digital delivery from being reversed."] },
    { title: "2. When we will review a refund", bullets: ["The same transaction was charged more than once.", "Payment succeeded but access was not provided because of a verified CoreSkils technical failure.", "The purchased item was materially different from its published description and support could not correct the issue.", "A refund is required by applicable Indian consumer law."] },
    { title: "3. Request window", paragraphs: ["Send a request within 7 calendar days of the payment date and before accessing or downloading the content. Include the account email, order or payment reference, product name, reason and relevant evidence. Never send card numbers, UPI PINs or banking passwords."] },
    { title: "4. Non-refundable cases", bullets: ["Protected product materials have been accessed.", "A digital file has been downloaded or its delivery link used.", "The request is based on change of mind, lack of time, or the customer no longer needing the product.", "The user violated website rules, shared access or attempted to bypass security.", "The request lacks enough information to verify the transaction after reasonable follow-up."] },
    { title: "5. Cancellations", paragraphs: ["A completed one-time digital purchase cannot be cancelled after delivery. If recurring plans are introduced, cancellation will stop future renewals but will not automatically refund an already completed billing period unless required by law or stated at checkout."] },
    { title: "6. Processing time", paragraphs: ["Eligible refunds are initiated to the original payment method. We aim to decide complete requests within 5–7 business days. After initiation, the bank or payment provider may take an additional 5–10 business days to display the credit. Processing times are estimates and may vary by provider."] },
    { title: "7. Failed or pending payments", paragraphs: ["If money is debited but the order is not confirmed, wait for the bank or gateway reconciliation period. Such transactions are normally reversed automatically by the payment provider. Contact us with the payment reference if the issue remains unresolved."] },
  ]} />;
}

export function DeliveryPage() {
  return <CompliancePage title="Shipping and Delivery Policy" intro="CoreSkils supplies downloadable digital products electronically. No physical shipment is involved unless a product page expressly states otherwise." sections={[
    { title: "1. Delivery method", paragraphs: ["After a successful payment is verified, downloadable products are made available through the authenticated customer library or secure download flow. Access details may also be sent to the registered email address."] },
    { title: "2. Delivery time", paragraphs: ["Digital access is normally provided immediately after server-side payment confirmation. Bank, UPI or gateway delays can leave a transaction pending. In such cases, access is supplied after successful reconciliation."] },
    { title: "3. Delivery requirements", bullets: ["Use the same email/account during purchase and access.", "Maintain a supported browser and working internet connection.", "Do not share secure links, account credentials or downloaded files.", "Check spam or promotions folders for transactional email."] },
    { title: "4. Delivery problems", paragraphs: ["If confirmed payment does not produce access, submit a support request through the platform with your account email, product name, payment reference and a screenshot that does not expose sensitive financial credentials. We will verify the transaction and restore access or apply the Refund Policy."] },
    { title: "5. No physical delivery", paragraphs: ["No courier fee, tracking number or physical delivery timeline applies to digital-only items. Any future physical product will display its separate shipping charges and estimated delivery terms before checkout."] },
  ]} />;
}

export function ContactPage() {
  return (
    <PublicLayout>
      <main className="min-h-screen bg-[#FAFAFA] pb-20 pt-28 sm:pt-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl rounded-2xl border border-[#E5E5E5] bg-white p-7 shadow-sm sm:p-12">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0B8F50]">Customer support</p>
            <h1 className="mt-3 text-4xl font-bold text-black sm:text-5xl" data-testid="heading-contact">Contact CoreSkils</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#4D4D4D]">For account, product, payment, delivery, refund or privacy questions, submit a support request through your CoreSkils account.</p>
            <div className="mt-10">
              <div className="rounded-xl border border-[#E5E5E5] p-6">
                <h2 className="font-bold text-black">Platform support</h2>
                <p className="mt-3 text-sm leading-6 text-[#737373]">Sign in to your account and use the available support options. Typical response time is within 2 business days.</p>
              </div>
            </div>
            <div className="mt-8 rounded-xl bg-[#123D32] p-6 text-white">
              <h2 className="font-bold">Payment support safety</h2>
              <p className="mt-2 text-sm leading-6 text-white/75">Include your registered email and payment/order reference. Never email your OTP, UPI PIN, CVV, password or complete card/account number.</p>
            </div>
            <p className="mt-8 text-sm text-[#737373]">For refund eligibility, read our <Link href="/refund-policy" className="font-bold text-[#0B8F50] underline underline-offset-4" data-testid="link-contact-refund">Refund and Cancellation Policy</Link>.</p>
          </div>
        </div>
      </main>
    </PublicLayout>
  );
}