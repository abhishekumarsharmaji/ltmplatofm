import { useState, useRef } from "react";
import { Link } from "wouter";
import { 
  useListCreatorProducts, 
  useListDigitalProductFiles,
  useGetDigitalProductReadiness,
  usePublishCreatorProduct,
  useUnpublishDigitalProduct,
  useDeleteDigitalProductFile,
  getListCreatorProductsQueryKey,
  getListDigitalProductFilesQueryKey,
  getGetDigitalProductReadinessQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileText, Upload, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { uploadDigitalFile } from "@/lib/digital-upload";
import { ProductFormDialog } from "../ProductFormDialog";

export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function CreatorProductManage({ productId }: { productId: number }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isUploading, setIsUploading] = useState(false);

  const { data: products } = useListCreatorProducts();
  const product = products?.find(p => p.id === productId);
  
  const { data: files, isLoading: filesLoading } = useListDigitalProductFiles(productId);
  const { data: readiness } = useGetDigitalProductReadiness(productId);
  
  const publishProduct = usePublishCreatorProduct();
  const unpublishProduct = useUnpublishDigitalProduct();
  const deleteFile = useDeleteDigitalProductFile();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    setIsUploading(true);
    const selectedFiles = Array.from(e.target.files);
    
    for (const file of selectedFiles) {
      if (file.size > 250 * 1024 * 1024) {
        toast({ title: `File ${file.name} is too large. Max 250MB.`, variant: "destructive" });
        continue;
      }
      
      const fileId = Math.random().toString(36).substring(7);
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
      
      try {
        await uploadDigitalFile({
          productId,
          file,
          onProgress: (prog) => {
            setUploadProgress(prev => ({ ...prev, [fileId]: prog }));
          }
        });
        toast({ title: `Uploaded ${file.name} successfully.` });
      } catch (err) {
        toast({ title: `Failed to upload ${file.name}.`, variant: "destructive" });
      } finally {
        setUploadProgress(prev => {
          const next = { ...prev };
          delete next[fileId];
          return next;
        });
      }
    }
    
    setIsUploading(false);
    queryClient.invalidateQueries({ queryKey: getListDigitalProductFilesQueryKey(productId) });
    queryClient.invalidateQueries({ queryKey: getGetDigitalProductReadinessQueryKey(productId) });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteFile = (fileId: number) => {
    deleteFile.mutate({ productId, fileId }, {
      onSuccess: () => {
        toast({ title: "File removed." });
        queryClient.invalidateQueries({ queryKey: getListDigitalProductFilesQueryKey(productId) });
        queryClient.invalidateQueries({ queryKey: getGetDigitalProductReadinessQueryKey(productId) });
      }
    });
  };

  const handlePublishToggle = () => {
    if (product?.status === "published") {
      unpublishProduct.mutate({ productId }, {
        onSuccess: () => {
          toast({ title: "Product unpublished." });
          queryClient.invalidateQueries({ queryKey: getListCreatorProductsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDigitalProductReadinessQueryKey(productId) });
        }
      });
    } else {
      publishProduct.mutate({ productId } as any, {
        onSuccess: () => {
          toast({ title: "Product published successfully." });
          queryClient.invalidateQueries({ queryKey: getListCreatorProductsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDigitalProductReadinessQueryKey(productId) });
        },
        onError: () => {
          toast({ title: "Could not publish. Please check readiness.", variant: "destructive" });
        }
      });
    }
  };

  if (!product) {
    return <div className="p-8 text-center text-[#9794AA]">Loading product...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <div className="flex items-center gap-4 text-[#4D4D4D] text-[14px]">
        <Link href="/dashboard/creator/products" className="hover:text-primary flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back to Products</Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
        <div>
          <h1 className="text-[32px] font-bold text-black tracking-tight">{product.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge className="bg-gray-100 text-[#4D4D4D] border-none uppercase text-[10px] font-bold">
              {product.subtype || product.type || "Product"}
            </Badge>
            <Badge className={product.status === 'published' ? 'bg-[#E3F9EF] text-primary border-none' : 'bg-gray-100 text-[#9794AA] border-none'}>
              {product.status}
            </Badge>
          </div>
        </div>
        <div className="flex gap-3">
          <ProductFormDialog type="digital" product={product as any}>
            <Button variant="outline" className="border-[#DADADA] text-[#394649]">Edit Metadata</Button>
          </ProductFormDialog>
          <Button 
            onClick={handlePublishToggle}
            disabled={(!readiness?.isReady && product.status !== "published") || publishProduct.isPending || unpublishProduct.isPending}
            className={product.status === "published" ? "bg-[#FFF0ED] text-[#E53E3E] hover:bg-[#FFE4DE]" : "bg-primary text-white hover:bg-[#10A364] shadow-[0_4px_14px_rgba(21,207,116,0.25)]"}
          >
            {product.status === "published" ? "Unpublish" : "Publish Product"}
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-[#E5E5E5] rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[18px] font-bold text-black">Files</h3>
              <input 
                type="file" 
                multiple 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileChange}
              />
              <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} variant="outline" size="sm" className="h-9 border-[#DADADA] text-[#394649]">
                <Upload className="w-4 h-4 mr-2" />
                Upload Files
              </Button>
            </div>

            <div className="space-y-3">
              {filesLoading ? (
                <div className="py-8 text-center text-[#9794AA]">Loading files...</div>
              ) : files?.length === 0 && Object.keys(uploadProgress).length === 0 ? (
                <div className="py-12 border-2 border-dashed border-[#E5E5E5] rounded-lg text-center bg-[#FAFAFA]">
                  <FileText className="w-10 h-10 text-[#9794AA] mx-auto mb-3" />
                  <p className="font-bold text-[15px] text-black">No files yet</p>
                  <p className="text-[13px] text-[#4D4D4D] mt-1">Upload the files that users will receive.</p>
                </div>
              ) : (
                <>
                  {files?.map(file => (
                    <div key={file.id} className="flex items-center justify-between p-3 border border-[#E5E5E5] rounded-lg bg-[#FAFAFA]">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 bg-white rounded flex items-center justify-center border border-[#E5E5E5] shrink-0">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[14px] font-bold text-black truncate">{file.filename}</p>
                          <p className="text-[12px] text-[#4D4D4D]">{formatBytes(file.sizeBytes || 0)}</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-[#9794AA] hover:text-[#E53E3E] hover:bg-transparent shrink-0 ml-4"
                        onClick={() => handleDeleteFile(file.id)}
                        disabled={deleteFile.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {Object.entries(uploadProgress).map(([id, prog]) => (
                    <div key={id} className="p-4 border border-[#E5E5E5] rounded-lg bg-white relative overflow-hidden">
                      <div className="absolute top-0 left-0 h-1 bg-primary transition-all duration-300" style={{ width: `${prog}%` }}></div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0"></div>
                        <div>
                          <p className="text-[14px] font-bold text-black">Uploading file...</p>
                          <p className="text-[12px] text-[#4D4D4D]">{prog}% complete</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-[#E5E5E5] rounded-xl p-6 shadow-sm">
            <h3 className="text-[18px] font-bold text-black mb-4">Readiness</h3>
            {readiness ? (
              <ul className="space-y-3">
                <li className="flex gap-3 text-[14px]">
                  {readiness.checks.title && readiness.checks.description ? <CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> : <AlertCircle className="w-5 h-5 text-warning shrink-0" />}
                  <span className={readiness.checks.title && readiness.checks.description ? "text-[#394649]" : "text-black font-medium"}>Title and description</span>
                </li>
                <li className="flex gap-3 text-[14px]">
                  {readiness.checks.files ? <CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> : <AlertCircle className="w-5 h-5 text-warning shrink-0" />}
                  <span className={readiness.checks.files ? "text-[#394649]" : "text-black font-medium"}>At least 1 file uploaded</span>
                </li>
              </ul>
            ) : (
              <div className="animate-pulse space-y-3">
                <div className="h-5 bg-gray-200 rounded w-full"></div>
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
              </div>
            )}
            
            {readiness?.ready && product.status !== "published" && (
              <div className="mt-6 p-4 bg-[#E3F9EF] rounded-lg text-primary text-[13px] font-medium flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                This product is ready to be published to the marketplace!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
