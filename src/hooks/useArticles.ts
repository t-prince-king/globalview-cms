import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

// Optimized hooks for fetching articles with aggressive caching

// Select only needed fields to reduce payload size
const ARTICLE_FIELDS = "id,title,slug,description,image_url,category,published_at,is_featured,is_editors_pick,views,author";
const ARTICLE_FULL_FIELDS = "*";

export const useFeaturedArticles = (limit = 5) => {
  return useQuery({
    queryKey: ["articles", "featured", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select(ARTICLE_FIELDS)
        .eq("is_featured", true)
        .order("published_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache 30 min
  });
};

export const useBreakingArticles = (limit = 3) => {
  return useQuery({
    queryKey: ["articles", "breaking", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("title,slug")
        .eq("is_breaking", true)
        .order("published_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for breaking news
    gcTime: 10 * 60 * 1000,
  });
};

export const usePopularArticles = (limit = 5) => {
  return useQuery({
    queryKey: ["articles", "popular", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select(ARTICLE_FIELDS)
        .order("views", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
  });
};

export const useEditorsPickArticles = (limit = 6) => {
  return useQuery({
    queryKey: ["articles", "editors_pick", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select(ARTICLE_FIELDS)
        .eq("is_editors_pick", true)
        .order("published_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

export const useCategoryArticles = (category: string, limit = 10) => {
  return useQuery({
    queryKey: ["articles", "category", category, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select(ARTICLE_FIELDS)
        .eq("category", category as any)
        .order("published_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled: !!category,
  });
};

export const useArticle = (slug: string) => {
  return useQuery({
    queryKey: ["article", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select(ARTICLE_FULL_FIELDS)
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled: !!slug,
  });
};

export const useRelatedArticles = (category: string, excludeId: string, limit = 3) => {
  return useQuery({
    queryKey: ["articles", "related", category, excludeId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select(ARTICLE_FIELDS)
        .eq("category", category as any)
        .neq("id", excludeId)
        .order("published_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled: !!category && !!excludeId,
  });
};

export const useSearchArticles = (query: string) => {
  return useQuery({
    queryKey: ["articles", "search", query],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select(ARTICLE_FIELDS)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order("published_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    enabled: query.length >= 2,
  });
};

// Hook to prefetch articles on hover/focus for instant navigation
export const usePrefetchArticle = () => {
  const queryClient = useQueryClient();

  return (slug: string) => {
    queryClient.prefetchQuery({
      queryKey: ["article", slug],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("articles")
          .select(ARTICLE_FULL_FIELDS)
          .eq("slug", slug)
          .maybeSingle();

        if (error) throw error;
        return data;
      },
      staleTime: 5 * 60 * 1000,
    });
  };
};

// Hook to prefetch home page data
export const usePrefetchHomeData = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Prefetch featured articles
    queryClient.prefetchQuery({
      queryKey: ["articles", "featured", 5],
      queryFn: async () => {
        const { data } = await supabase
          .from("articles")
          .select(ARTICLE_FIELDS)
          .eq("is_featured", true)
          .order("published_at", { ascending: false })
          .limit(5);
        return data;
      },
    });

    // Prefetch popular articles
    queryClient.prefetchQuery({
      queryKey: ["articles", "popular", 5],
      queryFn: async () => {
        const { data } = await supabase
          .from("articles")
          .select(ARTICLE_FIELDS)
          .order("views", { ascending: false })
          .limit(5);
        return data;
      },
    });
  }, [queryClient]);
};
