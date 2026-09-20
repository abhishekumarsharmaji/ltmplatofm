import { Link } from "wouter";
import { 
  useGetStudentDigitalProduct
} from "@workspace/api-client-react";
import { ArrowLeft, Package, FileText, Download, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function StudentProductView({ productId }: { productId: number }) {
  const { data: product, isLoading, isError } = useGetStudentDigitalProduct(productId);
  
  if (isLoading) {
    return <div className="p-12 text-center text-[#9794AA]">Loading your product...</div>;
  }
  
  if (isError || !product) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-xl font-bold text-black mb-2">Product not found</h2>
        <Link href="/dashboard/student/products" className="text-primary hover:underline">Return to Library</Link>
      </div>
    );
  }

  const handleDownload = (fileId: number) => {
    window.location.href = `/api/student/digital-products/${productId}/files/${fileId}/download`;
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <div className="flex items-center gap-4 text-[#4D4D4D] text-[14px]">
        <Link href="/dashboard/student/products" className="hover:text-primary flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back to Products</Link>
      </div>

      <div className="rounded-xl border border-[#E5E5E5] bg-white p-4 shadow-sm sm:p-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/3 aspect-square bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg overflow-hidden flex items-center justify-center shrink-0 relative">
            {product.coverImageUrl ? (
              <>
                <img src={product.coverImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 blur-xl scale-110 pointer-events-none" aria-hidden="true" />
                <img src={product.coverImageUrl} alt={product.title} className="relative z-10 w-full h-full object-contain drop-shadow-sm" />
              </>
            ) : (
               <Package className="w-20 h-20 text-primary/30" />
            )}
          </div>
          
          <div className="flex-1 min-w-0 space-y-6">
            <div>
              <div className="text-[12px] font-bold text-primary uppercase tracking-wider mb-2">{product.subtype || "Digital Product"}</div>
              <h1 className="mb-3 break-words text-[26px] font-bold leading-tight tracking-tight text-black sm:text-[32px]">{product.title}</h1>
              <p className="text-[16px] text-[#4D4D4D] leading-relaxed">{product.description || "No description provided."}</p>
            </div>
            
            <div className="pt-6 border-t border-[#E5E5E5] flex flex-wrap gap-6 text-[14px] text-[#4D4D4D]">
               {product.creatorName && (
                 <div><span className="font-bold text-black block mb-1">Creator</span> {product.creatorName}</div>
               )}
               {product.acquiredAt && (
                 <div><span className="font-bold text-black block mb-1">Acquired</span> {new Date(product.acquiredAt).toLocaleDateString()}</div>
               )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-[24px] font-bold text-black">Included Files</h3>
        
        {product.files && product.files.length > 0 ? (
          <div className="grid gap-4">
            {product.files.map(file => (
              <div key={file.id} className="group flex min-w-0 flex-col gap-4 rounded-xl border border-[#E5E5E5] bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="w-12 h-12 bg-[#FAFAFA] rounded-lg border border-[#E5E5E5] flex items-center justify-center shrink-0 group-hover:bg-primary/5 transition-colors">
                    <FileText className="w-6 h-6 text-[#9794AA] group-hover:text-primary transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="break-all font-bold text-[15px] text-black">{file.filename}</h4>
                    <p className="text-[13px] text-[#4D4D4D]">{formatBytes(file.sizeBytes || 0)}</p>
                  </div>
                </div>
                <Button 
                  onClick={() => handleDownload(file.id)}
                  className="h-10 w-full rounded-md bg-primary px-5 text-[14px] font-medium text-white shadow-[0_4px_14px_rgba(21,207,116,0.25)] hover:bg-[#10A364] sm:w-auto"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white border border-[#E5E5E5] rounded-xl">
            <Clock className="w-10 h-10 text-[#9794AA] mx-auto mb-3" />
            <h4 className="font-bold text-[16px] text-black mb-1">No files available yet</h4>
            <p className="text-[14px] text-[#4D4D4D]">The creator hasn't uploaded the files for this product.</p>
          </div>
        )}
      </div>
    </div>
  );
}
