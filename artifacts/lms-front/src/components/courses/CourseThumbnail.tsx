import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";

type CourseThumbnailProps = {
  src?: string | null;
  title?: string | null;
  className?: string;
};

export function CourseThumbnail({ src, title, className = "" }: CourseThumbnailProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (src && !failed) {
    return (
      <div className={`relative h-full w-full overflow-hidden bg-[#FAFAFA] flex items-center justify-center ${className}`}>
        <img
          src={src}
          alt={title ? `${title} background` : "Background"}
          loading="lazy"
          decoding="async"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-20 blur-xl scale-110 pointer-events-none"
        />
        <img
          src={src}
          alt={title ? `${title} course thumbnail` : "Course thumbnail"}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="relative z-10 h-full w-full object-contain drop-shadow-md"
        />
      </div>
    );
  }

  return (
    <div className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#123D32] via-[#17614D] to-[#15A968] text-white ${className}`}>
      <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full border-[24px] border-white/10 pointer-events-none" />
      <div className="absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-[#5BE49B]/20 blur-sm pointer-events-none" />
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.16)_1px,transparent_1px)] [background-size:28px_28px] pointer-events-none" />
      <div className="relative z-10 flex max-w-[85%] flex-col items-center text-center">
        <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-white/25 bg-white/15 shadow-lg backdrop-blur-sm">
          <BookOpen className="h-5 w-5" />
        </span>
        <span className="line-clamp-2 text-base font-bold leading-snug sm:text-lg">
          {title?.trim() || "CoreSkils Course"}
        </span>
        <span className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
          Learn · Build · Grow
        </span>
      </div>
    </div>
  );
}