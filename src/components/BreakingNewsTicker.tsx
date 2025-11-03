import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface BreakingNewsItem {
  title: string;
  slug: string;
}

export const BreakingNewsTicker = () => {
  const [breakingNews, setBreakingNews] = useState<BreakingNewsItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBreakingNews = async () => {
      const { data } = await supabase
        .from("articles")
        .select("title, slug")
        .eq("is_breaking", true)
        .order("published_at", { ascending: false })
        .limit(3);

      if (data) {
        setBreakingNews(data);
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
              <span 
                key={index} 
                className="text-sm whitespace-nowrap cursor-pointer hover:underline"
                onClick={() => navigate(`/article/${news.slug}`)}
              >
                {news.title}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
