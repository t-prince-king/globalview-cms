import { useEffect, useRef, memo } from "react";
import { useAdsByPlacement, useAdSettings } from "@/hooks/useAds";

interface AdSlotProps {
  placement: string;
  className?: string;
}

export const AdSlot = memo(({ placement, className = "" }: AdSlotProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: adSettings, isLoading: settingsLoading } = useAdSettings();
  const { data: ads, isLoading: adsLoading } = useAdsByPlacement(
    placement,
    adSettings?.ads_enabled ?? false
  );

  useEffect(() => {
    if (!containerRef.current || !ads?.length || !adSettings?.ads_enabled) return;

    // Clear previous content
    containerRef.current.innerHTML = "";

    // Get the first active ad for this placement
    const ad = ads[0];
    if (!ad) return;

    // Create a wrapper for the ad content
    const wrapper = document.createElement("div");
    wrapper.className = "ad-slot-content";

    // Safely inject HTML/JS content
    // Using a range to parse HTML allows scripts to execute
    const range = document.createRange();
    range.selectNode(document.body);
    const documentFragment = range.createContextualFragment(ad.ad_code);
    wrapper.appendChild(documentFragment);

    containerRef.current.appendChild(wrapper);

    // Cleanup function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [ads, adSettings?.ads_enabled]);

  // Don't render anything if ads are disabled or loading
  if (settingsLoading || adsLoading) return null;
  if (!adSettings?.ads_enabled) return null;
  if (!ads?.length) return null;

  return (
    <div 
      ref={containerRef} 
      className={`ad-slot ad-slot-${placement} ${className}`}
      data-placement={placement}
      aria-label="Advertisement"
    />
  );
});

AdSlot.displayName = "AdSlot";
