import { useEffect, useRef, memo } from "react";
import { useAdSettings } from "@/hooks/useAds";

interface InlineAdBlockProps {
  adCode: string;
  className?: string;
}

export const InlineAdBlock = memo(({ adCode, className = "" }: InlineAdBlockProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: adSettings, isLoading } = useAdSettings();

  useEffect(() => {
    if (!containerRef.current || !adCode || !adSettings?.ads_enabled) return;

    // Clear previous content
    containerRef.current.innerHTML = "";

    // Create a wrapper for the ad content
    const wrapper = document.createElement("div");
    wrapper.className = "inline-ad-content";

    // Safely inject HTML/JS content
    const range = document.createRange();
    range.selectNode(document.body);
    const documentFragment = range.createContextualFragment(adCode);
    wrapper.appendChild(documentFragment);

    containerRef.current.appendChild(wrapper);

    // Cleanup function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [adCode, adSettings?.ads_enabled]);

  // Don't render anything if ads are disabled or loading
  if (isLoading) return null;
  if (!adSettings?.ads_enabled) return null;
  if (!adCode) return null;

  return (
    <div 
      ref={containerRef} 
      className={`inline-ad-block my-6 ${className}`}
      aria-label="Advertisement"
    />
  );
});

InlineAdBlock.displayName = "InlineAdBlock";
