import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ArticleUpdate {
  id: string;
  article_id: string;
  content: string;
  images: string[];
  title: string | null;
  keywords: string[] | null;
  created_at: string;
  updated_at: string;
}

export const useArticleUpdates = (articleId: string) => {
  return useQuery({
    queryKey: ["article-updates", articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("article_updates")
        .select("*")
        .eq("article_id", articleId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as ArticleUpdate[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,
    enabled: !!articleId,
  });
};

// Get the most recent update date for an article
export const getLatestUpdateDate = (updates: ArticleUpdate[]): string | null => {
  if (!updates || updates.length === 0) return null;
  
  const sorted = [...updates].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return sorted[0].created_at;
};
