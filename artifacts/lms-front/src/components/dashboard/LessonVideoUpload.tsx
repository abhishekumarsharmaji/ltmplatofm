import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useRemoveLessonAsset,
  getGetCreatorCourseBuilderQueryKey,
  getGetCreatorCourseReadinessQueryKey
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, Trash2, PlayCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function LessonVideoUpload({ lesson, productId, initialFile, onUploadComplete }: { lesson: any, productId: number, initialFile?: File | null, onUploadComplete?: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const removeAsset = useRemoveLessonAsset();
  
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("video/")) {
      setError("Please select a valid video file.");
      return;
    }
    
    // R2 multipart uploads support course videos up to 10GB.
    const MAX_SIZE = 10 * 1024 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError("File exceeds 10GB limit.");
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
      const res = await apiJson<{ asset: any; uploadId: string; partSize: number }>(
        `/api/creator/lessons/${lesson.id}/assets/request-upload`,
        {
          method: "POST",
          body: JSON.stringify({
          filename: file.name,
          mimeType: file.type,
            sizeBytes: file.size,
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
      toast({ title: "Video uploaded successfully" });
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      queryClient.invalidateQueries({ queryKey: getGetCreatorCourseBuilderQueryKey(productId) });
      queryClient.invalidateQueries({ queryKey: getGetCreatorCourseReadinessQueryKey(productId) });
      onUploadComplete?.();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to upload video");
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadFile(file);
  };

  const uploadedInitialFileRef = useRef<File | null>(null);
  useEffect(() => {
    if (!initialFile || uploadedInitialFileRef.current === initialFile || uploading) return;
    uploadedInitialFileRef.current = initialFile;
    void uploadFile(initialFile);
  }, [initialFile, uploading]);

  const asset = lesson.assets?.find((a: any) => a.kind === "video");
  const handleRemove = () => {
    if (!asset || !confirm("Remove this lesson video?")) return;
    removeAsset.mutate({ assetId: asset.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCreatorCourseBuilderQueryKey(productId) });
        toast({ title: "Video removed" });
      },
      onError: (err: Error) => {
        setError(err.message);
        toast({ title: "Could not remove video", description: err.message, variant: "destructive" });
      },
    });
  };

  return (
    <div className="mt-4 p-4 border-2 border-dashed border-[#E5E5E5] rounded-lg bg-[#FAFAFA]">
      <div className="flex items-center justify-between mb-3">
        <h5 className="text-[14px] font-bold text-black flex items-center gap-2">
          <PlayCircle className="w-4 h-4 text-primary" />
          Lesson Video
        </h5>
        {asset && (
          <span className="text-[12px] text-[#4D4D4D] bg-white border border-[#E5E5E5] px-2 py-1 rounded">
            {asset.status === "uploaded" ? "Ready" : asset.status}
          </span>
        )}
      </div>

      {error && (
        <div className="mb-3 p-3 bg-red-50 text-[#E53E3E] text-[13px] font-medium rounded-md flex items-center gap-2 border border-red-100">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {uploading ? (
        <div className="space-y-2">
          <div className="flex justify-between text-[13px] text-[#4D4D4D] font-bold">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : asset && asset.status === "uploaded" ? (
        <div className="flex items-center justify-between bg-white border border-[#E5E5E5] p-3 rounded-md shadow-sm">
          <div className="flex flex-col truncate pr-4">
            <span className="text-[14px] font-bold text-black truncate">{asset.filename}</span>
            <span className="text-[12px] text-[#9794AA] mt-0.5">
              {(asset.sizeBytes / (1024 * 1024)).toFixed(2)} MB
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a 
              href={`/api/creator/assets/${asset.id}/download`}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[13px] text-primary hover:text-[#10A364] hover:underline font-medium px-2"
            >
              Play / Download
            </a>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="border border-[#DADADA] text-[#394649] bg-white hover:bg-gray-50 h-8 px-3 rounded-md font-medium text-[13px]"
            >
              Replace
            </Button>
            <Button
              aria-label={`Remove ${asset.filename}`}
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-[#E53E3E] hover:bg-red-50 hover:text-[#E53E3E] rounded-md"
              onClick={handleRemove}
              disabled={removeAsset.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <Upload className="w-8 h-8 text-[#9794AA] mx-auto mb-3" />
          <p className="text-[14px] text-[#4D4D4D] mb-4">
            Upload a video for this lesson (Max 10GB)
          </p>
          <Button onClick={() => fileInputRef.current?.click()} className="h-9 px-4 bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[13px] shadow-[0_4px_14px_rgba(21,207,116,0.25)]">
            Select Video File
          </Button>
        </div>
      )}
      <input 
        type="file" 
        accept="video/mp4,video/webm,video/quicktime,video/x-m4v" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileSelect}
      />
    </div>
  );
}
