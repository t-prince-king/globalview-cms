import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Optimized hooks for fetching articles with caching

export const useFeaturedArticles = (limit = 5) => {
  return useQuery({
    queryKey: ["articles", "featured", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("is_featured", true)
        .order("published_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useBreakingArticles = (limit = 3) => {
  return useQuery({
    queryKey: ["articles", "breaking", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("title, slug")
        .eq("is_breaking", true)
        .order("published_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for breaking news
  });
};

export const usePopularArticles = (limit = 5) => {
  return useQuery({
    queryKey: ["articles", "popular", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("views", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useEditorsPickArticles = (limit = 6) => {
  return useQuery({
    queryKey: ["articles", "editors_pick", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("is_editors_pick", true)
        .order("published_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useCategoryArticles = (category: string, limit = 10) => {
  return useQuery({
    queryKey: ["articles", "category", category, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("category", category as any)
        .order("published_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!category,
  });
};

export const useArticle = (slug: string) => {
  return useQuery({
    queryKey: ["article", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!slug,
  });
};

export const useRelatedArticles = (category: string, excludeId: string, limit = 3) => {
  return useQuery({
    queryKey: ["articles", "related", category, excludeId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("category", category as any)
        .neq("id", excludeId)
        .order("published_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!category && !!excludeId,
  });
};

export const useSearchArticles = (query: string) => {
  return useQuery({
    queryKey: ["articles", "search", query],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,content.ilike.%${query}%`)
        .order("published_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: query.length >= 2,
  });
};