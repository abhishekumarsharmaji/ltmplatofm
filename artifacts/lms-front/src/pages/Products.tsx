import { useState } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Search, Package, AlertCircle, Download } from "lucide-react";
import { useListDigitalProducts } from "@workspace/api-client-react";

export default function Products() {
  const [search, setSearch] = useState("");
  
  const productsQuery = useListDigitalProducts();
  const products = (productsQuery.data || []).filter(product => 
    !search || product.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PublicLayout>
      <div className="bg-white min-h-screen text-black pt-32 pb-24">
        <div className="container mx-auto px-4 md:px-8">
          
          <div className="max-w-3xl mb-12 text-center mx-auto">
            <h1 className="text-[40px] md:text-[46px] font-bold mb-4 text-black">
              Digital Products
            </h1>
            <p className="text-[#394649] text-[18px]">
              Download premium templates, ebooks, kits, and tools to accelerate your workflow. All completely free.
            </p>
          </div>

          <div className="flex flex-col items-center gap-8 mb-16">
            <div className="relative w-full max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9794AA] w-5 h-5" />
              <Input 
                placeholder="Search for products..." 
                className="pl-12 h-14 bg-white border-[#E5E5E5] text-[16px] text-black rounded-full shadow-sm focus-visible:ring-primary/50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {productsQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="rounded-lg border border-[#E5E5E5] bg-white h-[320px] animate-pulse">
                  <div className="h-[180px] bg-gray-200 rounded-t-lg" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 w-3/4 rounded" />
                    <div className="h-4 bg-gray-200 w-1/2 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : productsQuery.isError ? (
            <div className="text-center py-20 bg-red-50 rounded-lg border border-red-100 text-red-600">
              <AlertCircle className="w-8 h-8 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Error loading products</h3>
              <p>Please try again later.</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-[#9794AA]">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-[#9794AA]" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-black">No products found</h3>
              <p className="text-[#394649] max-w-md mx-auto">
                We couldn't find any products matching your current filters. Try adjusting your search terms.
              </p>
              <button 
                className="mt-6 px-6 py-2 border border-[#DADADA] text-[#394649] hover:bg-gray-50 rounded-md font-medium"
                onClick={() => setSearch("")}
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map(product => (
                <Link key={product.id} href={`/products/${product.id}`}>
                  <div className="group rounded-lg border border-[#E5E5E5] bg-white hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-shadow duration-300 flex flex-col h-full cursor-pointer overflow-hidden">
                    <div className="relative aspect-square overflow-hidden bg-[#FAFAFA] flex items-center justify-center">
                      {product.coverImageUrl ? (
                        <img src={product.coverImageUrl} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <Package className="w-16 h-16 text-primary/30 group-hover:scale-110 transition-transform duration-500" />
                      )}
                      <span className="absolute top-3 left-3 bg-white/80 backdrop-blur-md border border-[#E5E5E5] text-black font-bold uppercase text-[10px] tracking-wider px-2 py-1 rounded">
                        {product.subtype || product.type}
                      </span>
                    </div>
                    
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="text-[16px] font-bold text-black leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {product.title}
                      </h3>
                      {product.shortSummary && <p className="line-clamp-2 text-[13px] leading-relaxed text-[#4D4D4D]">{product.shortSummary}</p>}
                      
                      <div className="mt-auto pt-4 flex items-center justify-between border-t border-[#E5E5E5]">
                        <span className="font-bold text-[18px] text-black">Free</span>
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                          <Download className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          
        </div>
      </div>
    </PublicLayout>
  );
}
