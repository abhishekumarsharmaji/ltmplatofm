import { useParams, Link, useLocation } from "wouter";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { 
  useGetDigitalProduct, 
  useAcquireDigitalProduct, 
  useGetSession,
  useListStudentDigitalProducts,
  getGetDigitalProductQueryKey,
  getListStudentDigitalProductsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Download, FileText, Package, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function ProductDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const productId = params.productId ? parseInt(params.productId) : 0;
  const queryClient = useQueryClient();
  const { data: session } = useGetSession();
  const isAuthenticated = session?.authenticated;
  const { data: ownedProducts } = useListStudentDigitalProducts({
    query: { enabled: Boolean(isAuthenticated) },
  });
  
  const { data: product, isLoading, isError } = useGetDigitalProduct(productId, { 
    query: { enabled: !!productId, queryKey: getGetDigitalProductQueryKey(productId) } 
  });
  
  const acquireProduct = useAcquireDigitalProduct();
  const isOwned = ownedProducts?.some((item) => item.id === productId) ?? false;

  const handleAcquire = () => {
    acquireProduct.mutate({ productId } as any, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDigitalProductQueryKey(productId) });
        queryClient.invalidateQueries({ queryKey: getListStudentDigitalProductsQueryKey() });
        setLocation(`/dashboard/student/products/${productId}`);
      }
    });
  };

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
          <AlertCircle className="w-12 h-12 text-[#E53E3E] mb-4" />
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
              
              <div className="lg:col-span-7 space-y-12">
                <div className="relative aspect-square rounded-lg overflow-hidden bg-[#FAFAFA] border border-[#E5E5E5] flex items-center justify-center shadow-sm">
                  {product.coverImageUrl ? (
                    <img src={product.coverImageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Package className="w-32 h-32 text-primary/20" />
                  )}
                  <span className="absolute top-6 left-6 bg-white/80 backdrop-blur-md border border-[#E5E5E5] text-black font-bold uppercase tracking-wider text-[12px] px-3 py-1 rounded">
                    {product.subtype || product.type}
                  </span>
                </div>

                <div>
                  <h3 className="text-[24px] font-bold text-black mb-6">Included Files</h3>
                  {product.files && product.files.length > 0 ? (
                    <div className="grid gap-4">
                      {product.files.map(file => (
                        <div key={file.id} className="bg-white border border-[#E5E5E5] rounded-lg p-4 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-4 overflow-hidden">
                            <div className="w-12 h-12 bg-[#FAFAFA] rounded-lg border border-[#E5E5E5] flex items-center justify-center shrink-0">
                              <FileText className="w-6 h-6 text-[#9794AA]" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-[15px] text-black truncate">{file.filename}</h4>
                              <p className="text-[13px] text-[#4D4D4D]">{formatBytes(file.sizeBytes || 0)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 border border-[#E5E5E5] rounded-lg text-center bg-[#FAFAFA] text-[#4D4D4D]">
                      No files are attached to this product yet.
                    </div>
                  )}
                </div>
              </div>
              
              <div className="lg:col-span-5">
                <div className="sticky top-32 space-y-8 flex flex-col justify-center">
                  <div>
                    <h1 className="text-[40px] lg:text-[46px] font-bold tracking-tight mb-4 text-black leading-[1.1]">
                      {product.title}
                    </h1>
                    {product.creatorName && (
                      <p className="text-[14px] text-[#4D4D4D] font-bold uppercase tracking-wider mb-4">
                        By {product.creatorName}
                      </p>
                    )}
                    <p className="text-[18px] text-[#394649] leading-relaxed">
                      {product.description || "No description available."}
                    </p>
                  </div>
                  
                  <div className="p-8 bg-white border border-[#E5E5E5] rounded-lg space-y-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center justify-between">
                      <span className="text-[32px] font-bold text-black leading-none">Free</span>
                      <span className="bg-[#E3F9EF] text-primary px-3 py-1 rounded-full text-[13px] font-bold">
                        Digital Access
                      </span>
                    </div>
                    
                    <ul className="space-y-4 pt-6 border-t border-[#E5E5E5]">
                      <li className="flex items-center gap-3 text-[14px] text-[#394649]">
                        <Download className="w-5 h-5 text-primary" />
                        <span>Instant digital download</span>
                      </li>
                      <li className="flex items-center gap-3 text-[14px] text-[#394649]">
                        <FileText className="w-5 h-5 text-primary" />
                        <span>{product.files.length} included {product.files.length === 1 ? "file" : "files"}</span>
                      </li>
                      <li className="flex items-center gap-3 text-[14px] text-[#394649]">
                        <ShieldCheck className="w-5 h-5 text-primary" />
                        <span>Downloads available only from your account</span>
                      </li>
                    </ul>
                    
                    <div className="pt-4">
                      {isOwned ? (
                        <Button 
                          onClick={() => setLocation(`/dashboard/student/products/${product.id}`)}
                          className="w-full h-[54px] bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[16px] shadow-[0_10px_24px_rgba(21,207,116,0.35)]"
                        >
                          Go to My Library
                        </Button>
                      ) : isAuthenticated ? (
                        <Button 
                          onClick={handleAcquire}
                          disabled={acquireProduct.isPending}
                          className="w-full h-[54px] bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[16px] shadow-[0_10px_24px_rgba(21,207,116,0.35)]"
                        >
                          {acquireProduct.isPending ? "Acquiring..." : "Acquire for Free"}
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => setLocation("/auth/login")}
                          className="w-full h-[54px] bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[16px] shadow-[0_10px_24px_rgba(21,207,116,0.35)]"
                        >
                          Login to Acquire
                        </Button>
                      )}
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
