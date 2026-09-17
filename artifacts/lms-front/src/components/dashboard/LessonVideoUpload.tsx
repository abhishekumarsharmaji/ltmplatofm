import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useRequestLessonVideoUpload, 
  useFinalizeLessonVideoUpload,
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
  
  const requestUpload = useRequestLessonVideoUpload();
  const finalizeUpload = useFinalizeLessonVideoUpload();
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
    
    // Max 1GB
    const MAX_SIZE = 1024 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError("File exceeds 1GB limit.");
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      const res = await requestUpload.mutateAsync({
        lessonId: lesson.id,
        data: {
          filename: file.name,
          mimeType: file.type,
          sizeBytes: file.size
        }
      });

      const { uploadURL, asset } = res;

      // Reserve the first part of the indicator for URL preparation.
      setProgress(10);

      // Perform PUT upload using XMLHttpRequest to track progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadURL, true);
        xhr.setRequestHeader("Content-Type", file.type);
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 90) + 10; // Reserve 10% for init/finalize
            setProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(file);
      });

      setProgress(95);

      await finalizeUpload.mutateAsync({
        lessonId: lesson.id,
        assetId: asset.id
      });

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
            Upload a video for this lesson (Max 1GB)
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
