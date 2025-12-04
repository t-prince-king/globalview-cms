import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ArticleUpdate {
  id: string;
  article_id: string;
  content: string;
  images: string[];
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
