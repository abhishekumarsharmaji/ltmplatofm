import { useState, useRef } from "react";
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

export function LessonVideoUpload({ lesson, productId }: { lesson: any, productId: number }) {
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
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to upload video");
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

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
    <div className="mt-4 p-4 border border-dashed border-border rounded-lg bg-muted/10">
      <div className="flex items-center justify-between mb-3">
        <h5 className="text-sm font-semibold flex items-center gap-2">
          <PlayCircle className="w-4 h-4 text-primary" />
          Lesson Video
        </h5>
        {asset && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            {asset.status === "uploaded" ? "Ready" : asset.status}
          </span>
        )}
      </div>

      {error && (
        <div className="mb-3 p-2 bg-destructive/10 text-destructive text-sm rounded flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {uploading ? (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      ) : asset && asset.status === "uploaded" ? (
        <div className="flex items-center justify-between bg-card border border-border p-3 rounded-md">
          <div className="flex flex-col truncate pr-4">
            <span className="text-sm font-medium truncate">{asset.filename}</span>
            <span className="text-xs text-muted-foreground">
              {(asset.sizeBytes / (1024 * 1024)).toFixed(2)} MB
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a 
              href={`/api/creator/assets/${asset.id}/download`}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline font-medium"
            >
              Play / Download
            </a>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Replace
            </Button>
            <Button
              aria-label={`Remove ${asset.filename}`}
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={handleRemove}
              disabled={removeAsset.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <Upload className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-4">
            Upload a video for this lesson (Max 10GB)
          </p>
          <Button onClick={() => fileInputRef.current?.click()}>
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
