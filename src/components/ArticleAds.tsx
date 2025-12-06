import { memo } from "react";
import { AdSlot } from "./AdSlot";

interface ArticleAdsProps {
  position: "top" | "middle" | "bottom";
}

export const ArticleAds = memo(({ position }: ArticleAdsProps) => {
  const placementMap = {
    top: "article_top",
    middle: "article_middle",
    bottom: "article_bottom",
  };

  return (
    <AdSlot 
      placement={placementMap[position]} 
      className="my-6"
    />
  );
});

ArticleAds.displayName = "ArticleAds";
