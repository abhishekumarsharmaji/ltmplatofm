import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useRemoveLessonAsset,
  getGetCreatorCourseBuilderQueryKey,
  getGetCreatorCourseReadinessQueryKey
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, Upload, Trash2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function LessonResourceUpload({ lesson, productId }: { lesson: any, productId: number }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const removeAsset = useRemoveLessonAsset();
  
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 100MB limit for resources
    const MAX_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError("File exceeds 100MB limit.");
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      const apiJson = async <T,>(url: string, init: RequestInit): Promise<T> => {
        const response = await fetch(url, {
          ...init,
          credentials: "include",
          headers: { "Content-Type": "application/json", ...init.headers },
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || `Request failed with status ${response.status}`);
        }
        return response.json() as Promise<T>;
      };
      
      const kind = file.type.includes("pdf") || file.type.includes("document") || file.type.includes("msword") || file.type.includes("powerpoint") || file.type.includes("excel") || file.type.includes("text") ? "document" : "other";

      const res = await apiJson<{ asset: any; uploadId: string; partSize: number }>(
        `/api/creator/lessons/${lesson.id}/assets/request-upload`,
        {
          method: "POST",
          body: JSON.stringify({
            filename: file.name,
            mimeType: file.type || "application/octet-stream",
            sizeBytes: file.size,
            kind
          }),
        },
      );
      const { asset, uploadId, partSize } = res;
      const partCount = Math.ceil(file.size / partSize);
      const loadedByPart = new Map<number, number>();
      const parts: Array<{ partNumber: number; eTag: string }> = [];
      let nextPart = 1;
      const uploadPart = async (partNumber: number) => {
        const { uploadURL } = await apiJson<{ uploadURL: string }>(
          `/api/creator/lessons/${lesson.id}/assets/${asset.id}/part-url`,
          { method: "POST", body: JSON.stringify({ uploadId, partNumber }) },
        );
        const start = (partNumber - 1) * partSize;
        const chunk = file.slice(start, Math.min(start + partSize, file.size));
        const eTag = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", uploadURL, true);
          xhr.upload.onprogress = (event) => {
            loadedByPart.set(partNumber, event.loaded);
            const uploaded = Array.from(loadedByPart.values()).reduce((sum, value) => sum + value, 0);
            setProgress(Math.min(94, Math.round((uploaded / file.size) * 94)));
          };
          xhr.onload = () => {
            const tag = xhr.getResponseHeader("ETag");
            if (xhr.status >= 200 && xhr.status < 300 && tag) resolve(tag);
            else reject(new Error(`Part ${partNumber} upload failed with status ${xhr.status}`));
          };
          xhr.onerror = () => reject(new Error(`Network error uploading part ${partNumber}`));
          xhr.send(chunk);
        });
        parts.push({ partNumber, eTag });
      };
      
      try {
        const workers = Array.from({ length: Math.min(3, partCount) }, async () => {
          while (nextPart <= partCount) {
            const partNumber = nextPart++;
            await uploadPart(partNumber);
          }
        });
        await Promise.all(workers);
        setProgress(95);
        await apiJson(
          `/api/creator/lessons/${lesson.id}/assets/${asset.id}/finalize`,
          {
            method: "POST",
            body: JSON.stringify({
              uploadId,
              parts: parts.sort((a, b) => a.partNumber - b.partNumber),
            }),
          },
        );
      } catch (uploadError) {
        await fetch(`/api/creator/lessons/${lesson.id}/assets/${asset.id}/abort`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uploadId }),
        }).catch(() => undefined);
        throw uploadError;
      }

      setProgress(100);
      toast({ title: "Resource uploaded successfully" });
      
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      queryClient.invalidateQueries({ queryKey: getGetCreatorCourseBuilderQueryKey(productId) });
      queryClient.invalidateQueries({ queryKey: getGetCreatorCourseReadinessQueryKey(productId) });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to upload resource");
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const assets = lesson.assets?.filter((a: any) => a.kind !== "video") || [];
  
  const handleRemove = (assetId: number) => {
    if (!confirm("Remove this resource?")) return;
    removeAsset.mutate({ assetId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCreatorCourseBuilderQueryKey(productId) });
        toast({ title: "Resource removed" });
      },
      onError: (err: Error) => {
        setError(err.message);
        toast({ title: "Could not remove resource", description: err.message, variant: "destructive" });
      },
    });
  };

  return (
    <div className="mt-4 p-4 border-2 border-dashed border-[#E5E5E5] rounded-lg bg-[#FAFAFA]">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h5 className="text-[14px] font-bold text-black flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Lesson Resources
        </h5>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="h-10 w-full border border-[#DADADA] bg-white px-3 text-[13px] font-medium text-[#394649] hover:bg-gray-50 sm:w-auto"
          disabled={uploading}
        >
          <Upload className="w-3 h-3 mr-2" />
          Upload File
        </Button>
      </div>

      {error && (
        <div className="mb-3 p-3 bg-red-50 text-[#E53E3E] text-[13px] font-medium rounded-md flex items-center gap-2 border border-red-100">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {uploading && (
        <div className="mb-4 space-y-2 bg-white p-3 rounded-md border border-[#E5E5E5]">
          <div className="flex justify-between text-[13px] text-[#4D4D4D] font-bold">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {assets.length > 0 ? (
        <div className="space-y-2">
          {assets.map((asset: any) => (
            <div key={asset.id} className="flex flex-col gap-3 rounded-md border border-[#E5E5E5] bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-col sm:pr-4">
                <span className="text-[14px] font-bold text-black truncate">{asset.filename}</span>
                <span className="text-[12px] text-[#9794AA] mt-0.5">
                  {(asset.sizeBytes / (1024 * 1024)).toFixed(2)} MB • {asset.status === 'uploaded' ? 'Ready' : asset.status}
                </span>
              </div>
              <div className="flex shrink-0 items-center justify-end gap-2">
                {asset.status === 'uploaded' && (
                  <a 
                    href={asset.downloadUrl || `/api/creator/assets/${asset.id}/download`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center px-3 text-[13px] font-medium text-primary hover:text-[#10A364] hover:underline"
                  >
                    Download
                  </a>
                )}
                <Button
                  aria-label={`Remove ${asset.filename}`}
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-md text-[#E53E3E] hover:bg-red-50 hover:text-[#E53E3E]"
                  onClick={() => handleRemove(asset.id)}
                  disabled={removeAsset.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : !uploading && (
        <div className="text-center py-6">
          <p className="text-[14px] text-[#4D4D4D] mb-1">
            No resources added yet.
          </p>
          <p className="text-[12px] text-[#9794AA]">
            Supports PDF, PPT, DOC, XLS, ZIP, TXT, JSON (Max 100MB)
          </p>
        </div>
      )}

      <input 
        type="file" 
        accept=".pdf,.ppt,.pptx,.doc,.docx,.odt,.rtf,.xls,.xlsx,.csv,.ods,.zip,.7z,.rar,.txt,.json" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileSelect}
      />
    </div>
  );
}