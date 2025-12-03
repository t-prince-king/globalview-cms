import { useState, useEffect, useRef, memo } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  title?: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  onClick?: () => void;
  aspectRatio?: "16/9" | "4/3" | "1/1" | "auto";
}

const OptimizedImageComponent = ({
  src,
  alt,
  title,
  className,
  width,
  height,
  priority = false,
  onClick,
  aspectRatio = "auto",
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "100px", // Load images 100px before they enter viewport
        threshold: 0.1,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const aspectRatioClass = {
    "16/9": "aspect-video",
    "4/3": "aspect-[4/3]",
    "1/1": "aspect-square",
    "auto": "",
  }[aspectRatio];

  // Generate srcset for responsive images
  const generateSrcSet = (baseSrc: string) => {
    // For Supabase storage URLs, we can use transformation parameters
    if (baseSrc.includes('supabase.co/storage')) {
      return `${baseSrc}?width=400 400w, ${baseSrc}?width=800 800w, ${baseSrc}?width=1200 1200w`;
    }
    return undefined;
  };

  return (
    <div
      ref={imgRef}
      className={cn(
        "relative overflow-hidden bg-muted",
        aspectRatioClass,
        className
      )}
      style={{ 
        width: width ? `${width}px` : undefined, 
        height: height ? `${height}px` : undefined 
      }}
      onClick={onClick}
    >
      {isInView && !hasError && (
        <img
          src={src}
          srcSet={generateSrcSet(src)}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          alt={alt}
          title={title || alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          width={width}
          height={height}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
        />
      )}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-muted animate-shimmer" />
      )}
      {hasError && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <span className="text-muted-foreground text-sm">Image unavailable</span>
        </div>
      )}
    </div>
  );
};

export const OptimizedImage = memo(OptimizedImageComponent);