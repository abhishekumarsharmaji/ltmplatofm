import { useCallback, useEffect, useRef, useState, type SyntheticEvent } from "react";
import { Maximize2, Minimize2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type SecureVideoPlayerProps = {
  /** Authenticated, same-origin stream endpoint. Mount with a `key` per asset so a lesson switch remounts the player. */
  streamUrl: string;
  /** Viewer identity rendered as a moving watermark so a screen recording can be traced back to the account. */
  watermark?: string;
};

/**
 * The signed storage link behind `streamUrl` expires after a couple of minutes on purpose. Browsers keep
 * re-using that link for later range requests (seeking, resuming after a pause), so when it dies the
 * element raises a network error; we then swap in a fresh source and restore the playback position.
 */
const MAX_CONSECUTIVE_RECOVERIES = 3;
const RECOVERY_RESET_AFTER_MS = 30_000;
const WATERMARK_MOVE_INTERVAL_MS = 9_000;
const WATERMARK_SPOTS = [
  "left-4 top-4",
  "right-4 top-4",
  "bottom-16 right-4",
  "bottom-16 left-4",
  "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
];

function freshSource(streamUrl: string) {
  // Cache-buster so the browser never reuses a previously redirected (and now expired) storage link.
  return `${streamUrl}${streamUrl.includes("?") ? "&" : "?"}s=${Date.now().toString(36)}`;
}

export function SecureVideoPlayer({ streamUrl, watermark }: SecureVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const resumeRef = useRef<{ time: number; playing: boolean } | null>(null);
  const recoveriesRef = useRef(0);
  const lastRecoveryAtRef = useRef(0);
  const [src, setSrc] = useState(() => freshSource(streamUrl));
  const [failed, setFailed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [watermarkSpot, setWatermarkSpot] = useState(0);

  useEffect(() => {
    if (!watermark) return;
    const timer = window.setInterval(() => setWatermarkSpot((spot) => (spot + 1) % WATERMARK_SPOTS.length), WATERMARK_MOVE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [watermark]);

  useEffect(() => {
    const onFullscreenChange = () => {
      const container = containerRef.current;
      const active = document.fullscreenElement;
      if (container && active && active === videoRef.current) {
        // Native controls (double-click, or the built-in button in engines that ignore controlsList) put the
        // bare <video> in fullscreen, which would hide the watermark. Move fullscreen onto the wrapper instead.
        void document.exitFullscreen().then(() => container.requestFullscreen()).catch(() => undefined);
        return;
      }
      setIsFullscreen(!!container && active === container);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const reload = useCallback(() => {
    const video = videoRef.current;
    // If a previous recovery is still pending (its source failed before metadata loaded), the element now
    // reports time 0 / paused; keep the position and play state captured from the original failure instead.
    if (!resumeRef.current) {
      resumeRef.current = video ? { time: video.currentTime, playing: !video.paused && !video.ended } : null;
    }
    setFailed(false);
    setSrc(freshSource(streamUrl));
  }, [streamUrl]);

  const handleError = (event: SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    if (video.error?.code === MediaError.MEDIA_ERR_ABORTED) return;
    if (recoveriesRef.current >= MAX_CONSECUTIVE_RECOVERIES) {
      setFailed(true);
      return;
    }
    recoveriesRef.current += 1;
    lastRecoveryAtRef.current = Date.now();
    reload();
  };

  const handleLoadedMetadata = (event: SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    const resume = resumeRef.current;
    resumeRef.current = null;
    if (!resume) return;
    if (resume.time > 0 && Number.isFinite(video.duration)) {
      video.currentTime = Math.min(resume.time, Math.max(video.duration - 0.25, 0));
    }
    if (resume.playing) void video.play().catch(() => undefined);
  };

  const handleTimeUpdate = () => {
    // Sustained playback after a recovery means the link refresh worked; forget the strike count.
    if (recoveriesRef.current > 0 && Date.now() - lastRecoveryAtRef.current > RECOVERY_RESET_AFTER_MS) recoveriesRef.current = 0;
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (typeof container.requestFullscreen === "function") {
        // Fullscreen the wrapper (not the <video>) so the watermark stays on screen.
        await container.requestFullscreen();
        await (screen.orientation as ScreenOrientation & { lock?: (orientation: string) => Promise<void> }).lock?.("landscape").catch(() => undefined);
      } else {
        // iPhone Safari only supports native video fullscreen.
        (video as HTMLVideoElement & { webkitEnterFullscreen?: () => void }).webkitEnterFullscreen?.();
      }
    } catch {
      // Fullscreen can be refused (permissions policy, no user gesture); the inline player keeps working.
    }
  };

  return (
    <div
      ref={containerRef}
      className="group relative h-full w-full bg-black"
      onContextMenu={(event) => event.preventDefault()}
      data-testid="secure-video-player"
    >
      <video
        ref={videoRef}
        className="h-full w-full bg-black object-contain"
        src={src}
        controls
        controlsList="nodownload noremoteplayback nofullscreen"
        disablePictureInPicture
        disableRemotePlayback
        playsInline
        preload="metadata"
        onError={handleError}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
      >
        Your browser does not support video playback.
      </video>

      {watermark && (
        <div
          aria-hidden
          className={`pointer-events-none absolute select-none rounded bg-black/30 px-2 py-1 font-mono text-[11px] tracking-wide text-white/60 transition-all duration-700 ${WATERMARK_SPOTS[watermarkSpot]}`}
        >
          {watermark}
        </div>
      )}

      <button
        type="button"
        onClick={() => void toggleFullscreen()}
        aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        className="absolute right-3 top-3 rounded-md bg-black/50 p-2 text-white/80 opacity-0 transition-opacity hover:bg-black/70 hover:text-white focus-visible:opacity-100 group-hover:opacity-100 [@media(pointer:coarse)]:opacity-100"
      >
        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </button>

      {failed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/90 px-6 text-center text-white">
          <p className="font-semibold">Playback was interrupted</p>
          <p className="max-w-sm text-sm text-white/70">
            The video could not be loaded. Check your connection and make sure you are opening this lesson from inside your course.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              recoveriesRef.current = 0;
              reload();
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />Try again
          </Button>
        </div>
      )}
    </div>
  );
}
