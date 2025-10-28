import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const BreakingNewsTicker = () => {
  const [breakingNews, setBreakingNews] = useState<string[]>([]);

  useEffect(() => {
    const fetchBreakingNews = async () => {
      const { data } = await supabase
        .from("articles")
        .select("title")
        .eq("is_breaking", true)
        .order("published_at", { ascending: false })
        .limit(3);

      if (data) {
        setBreakingNews(data.map((item) => item.title));
      }
    };

    fetchBreakingNews();
  }, []);

  if (breakingNews.length === 0) return null;

  return (
    <div className="bg-gradient-accent text-accent-foreground py-2 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4">
          <span className="font-bold text-sm whitespace-nowrap">
            BREAKING NEWS
          </span>
          <div className="flex gap-8 animate-scroll">
            {breakingNews.map((news, index) => (
              <span key={index} className="text-sm whitespace-nowrap">
                {news}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
