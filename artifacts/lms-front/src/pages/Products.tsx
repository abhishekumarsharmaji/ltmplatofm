import { Link } from "wouter";
import { FileBox, Package } from "lucide-react";
import { useListDigitalProducts } from "@workspace/api-client-react";
import { PublicLayout } from "@/components/layout/PublicLayout";

function productPrice(priceMinor: number, currency: string) {
  if (priceMinor === 0) return "Free";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    maximumFractionDigits: 2,
  }).format(priceMinor / 100);
}

function accessLabel(product: { accessPlan: string; accessDays?: number | null; trialDays: number }) {
  if (product.trialDays > 0) return `${product.trialDays}-day free trial`;
  if (product.accessPlan === "fixed_days") return `${product.accessDays} days access`;
  if (product.accessPlan === "monthly") return "Monthly access";
  if (product.accessPlan === "yearly") return "Yearly access";
  return "Lifetime access";
}

export default function Products() {
  const { data: products, isLoading, isError } = useListDigitalProducts();

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

          {isLoading && (
            <div className="mx-auto mt-16 flex max-w-5xl items-center justify-center py-20">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#0B9E59] border-t-transparent" />
            </div>
          )}

          {isError && (
            <div className="mx-auto mt-16 max-w-3xl rounded-xl border border-red-200 bg-white p-8 text-center text-red-700">
              Products could not be loaded. Please refresh the page.
            </div>
          )}

          {!isLoading && !isError && products?.length === 0 && (
            <div className="mx-auto mt-16 max-w-3xl rounded-xl border border-[#DDE7E2] bg-white p-10 text-center">
              <FileBox className="mx-auto h-10 w-10 text-[#7B9188]" />
              <h2 className="mt-4 text-xl font-bold text-black">No products available yet</h2>
              <p className="mt-2 text-[#596963]">Published digital products will appear here automatically.</p>
            </div>
          )}

          {!isLoading && !isError && products && products.length > 0 && (
            <section className="mx-auto mt-14 grid max-w-6xl gap-7 md:grid-cols-2">
              {products.map((product) => (
                <article key={product.id} className="overflow-hidden rounded-2xl border border-[#C9DED3] bg-white shadow-[0_15px_45px_rgba(20,80,55,.08)]">
                  <div className="aspect-[16/9] overflow-hidden bg-[#0B3027]">
                    {product.coverImageUrl ? (
                      <img src={product.coverImageUrl} alt={product.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#0B3027] to-[#146047]">
                        <Package className="h-20 w-20 text-white/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex min-h-72 flex-col p-7">
                    <span className="w-fit rounded-full bg-[#E4F8EE] px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[#087B46]">
                      {product.subtype || "Digital product"}
                    </span>
                    <h2 className="mt-5 text-2xl font-bold leading-tight text-black">{product.title}</h2>
                    <p className="mt-3 line-clamp-3 leading-7 text-[#52635C]">{product.shortSummary || product.description}</p>
                    <div className="mt-auto flex flex-wrap items-end justify-between gap-4 border-t border-[#E1E9E5] pt-6">
                      <div>
                        <span className="block text-2xl font-bold text-black">{productPrice(product.priceMinor, product.currency)}</span>
                        <span className="mt-1 block text-xs font-semibold uppercase tracking-wide text-[#628076]">
                          {accessLabel(product)}
                        </span>
                      </div>
                      <Link
                        href={`/products/${product.publicSlug || product.id}`}
                        className="inline-flex h-11 items-center justify-center rounded-md bg-[#123D32] px-6 font-semibold text-white hover:bg-[#0B3027]"
                      >
                        View product
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          )}
        </div>
      </main>
    </PublicLayout>
  );
}