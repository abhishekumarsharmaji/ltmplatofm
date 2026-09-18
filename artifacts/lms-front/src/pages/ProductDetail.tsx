import { useParams, Link } from "wouter";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useGetProduct } from "@workspace/api-client-react";
import { CheckCircle2, AlertCircle, Download, FileText, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProductDetail() {
  const params = useParams();
  const productId = params.productId ? parseInt(params.productId) : 0;
  
  const { data: product, isLoading, isError } = useGetProduct(productId, { 
    query: { enabled: !!productId, queryKey: ['getProduct', productId] } 
  });

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-white pt-32 pb-20 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </PublicLayout>
    );
  }

  if (isError || !product) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-white pt-32 pb-20 flex flex-col items-center justify-center">
          <AlertCircle className="w-12 h-12 text-red-600 mb-4" />
          <h2 className="text-[24px] font-bold mb-2 text-black">Product not found</h2>
          <p className="text-[#394649]">The product you're looking for doesn't exist or has been removed.</p>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="bg-white min-h-screen text-black">
        <section className="pt-32 pb-24">
          <div className="container mx-auto px-4 md:px-8">
            <div className="grid lg:grid-cols-12 gap-16">
              
              {/* Product Visual */}
              <div className="lg:col-span-7">
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-[#E5E5E5] flex items-center justify-center shadow-sm">
                  <FileText className="w-32 h-32 text-primary/20" />
                  <span className="absolute top-6 left-6 bg-white/80 backdrop-blur-md border border-[#E5E5E5] text-black font-bold uppercase tracking-wider text-[12px] px-3 py-1 rounded">
                    {product.type}
                  </span>
                </div>
              </div>
              
              {/* Product Info (Sticky) */}
              <div className="lg:col-span-5">
                <div className="sticky top-32 space-y-8 flex flex-col justify-center">
                  <div>
                    <h1 className="text-[40px] lg:text-[46px] font-bold tracking-tight mb-4 text-black leading-[1.1]">
                      {product.title}
                    </h1>
                    <p className="text-[18px] text-[#394649] leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                  
                  <div className="p-8 bg-white border border-[#E5E5E5] rounded-lg space-y-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center justify-between">
                      <span className="text-[32px] font-bold text-black leading-none">
                        ${(product.priceMinor / 100).toFixed(2)} {product.currency.toUpperCase()}
                      </span>
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[13px] font-bold">
                        In Stock
                      </span>
                    </div>
                    
                    <ul className="space-y-4 pt-6 border-t border-[#E5E5E5]">
                      <li className="flex items-center gap-3 text-[14px] text-[#394649]">
                        <Download className="w-5 h-5 text-primary" />
                        <span>Instant digital download</span>
                      </li>
                      <li className="flex items-center gap-3 text-[14px] text-[#394649]">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                        <span>Lifetime updates included</span>
                      </li>
                      <li className="flex items-center gap-3 text-[14px] text-[#394649]">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                        <span>Commercial use license</span>
                      </li>
                    </ul>
                    
                    <div className="pt-4">
                      <Link href="/checkout">
                        <Button className="w-full h-[54px] bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[16px] shadow-[0_10px_24px_rgba(21,207,116,0.35)]" data-testid="button-purchase">
                          <ShoppingCart className="w-5 h-5 mr-2" />
                          Purchase Now
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}