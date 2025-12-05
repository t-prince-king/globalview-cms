import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalArticles: number;
  totalUpdates: number;
  totalCategories: number;
  topArticles: Array<{ id: string; title: string; slug: string; views: number; category: string }>;
  trendingKeywords: Array<{ keyword: string; count: number }>;
  categoryBreakdown: Array<{ category: string; count: number }>;
  articlesNeedingUpdates: Array<{ id: string; title: string; slug: string; updated_at: string }>;
  articlesMissingMeta: Array<{ id: string; title: string; slug: string; issue: string }>;
  recentActivity: Array<{ type: string; title: string; date: string; id: string }>;
}

export const useCEODashboard = () => {
  return useQuery({
    queryKey: ["ceo-dashboard"],
    queryFn: async (): Promise<DashboardStats> => {
      // Fetch all articles
      const { data: articles, error: articlesError } = await supabase
        .from("articles")
        .select("id, title, slug, description, category, views, tags, updated_at, published_at, image_url")
        .order("published_at", { ascending: false });

      if (articlesError) throw articlesError;

      // Fetch all article updates
      const { data: updates, error: updatesError } = await supabase
        .from("article_updates")
        .select("id, article_id, keywords, created_at, title")
        .order("created_at", { ascending: false });

      if (updatesError) throw updatesError;

      // Calculate stats
      const totalArticles = articles?.length || 0;
      const totalUpdates = updates?.length || 0;
      
      // Get unique categories
      const categories = new Set(articles?.map(a => a.category) || []);
      const totalCategories = categories.size;

      // Top 10 most viewed articles
      const topArticles = (articles || [])
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 10)
        .map(a => ({
          id: a.id,
          title: a.title,
          slug: a.slug,
          views: a.views || 0,
          category: a.category
        }));

      // Trending keywords from articles and updates
      const keywordMap = new Map<string, number>();
      
      // From article tags
      (articles || []).forEach(article => {
        (article.tags || []).forEach((tag: string) => {
          const normalized = tag.toLowerCase().trim();
          keywordMap.set(normalized, (keywordMap.get(normalized) || 0) + 1);
        });
      });

      // From update keywords
      (updates || []).forEach(update => {
        (update.keywords || []).forEach((kw: string) => {
          const normalized = kw.toLowerCase().trim();
          keywordMap.set(normalized, (keywordMap.get(normalized) || 0) + 1);
        });
      });

      const trendingKeywords = Array.from(keywordMap.entries())
        .map(([keyword, count]) => ({ keyword, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);

      // Category breakdown
      const categoryMap = new Map<string, number>();
      (articles || []).forEach(article => {
        categoryMap.set(article.category, (categoryMap.get(article.category) || 0) + 1);
      });

      const categoryBreakdown = Array.from(categoryMap.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);

      // Articles needing updates (older than 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const articlesNeedingUpdates = (articles || [])
        .filter(a => new Date(a.updated_at || a.published_at) < sixMonthsAgo)
        .slice(0, 10)
        .map(a => ({
          id: a.id,
          title: a.title,
          slug: a.slug,
          updated_at: a.updated_at || a.published_at
        }));

      // Articles missing meta (description < 50 chars or no image)
      const articlesMissingMeta = (articles || [])
        .filter(a => {
          const hasShortDesc = !a.description || a.description.length < 50;
          const hasNoImage = !a.image_url;
          return hasShortDesc || hasNoImage;
        })
        .slice(0, 10)
        .map(a => ({
          id: a.id,
          title: a.title,
          slug: a.slug,
          issue: !a.description || a.description.length < 50 
            ? "Short meta description" 
            : "Missing featured image"
        }));

      // Recent activity (combines articles and updates)
      const recentArticles = (articles || []).slice(0, 5).map(a => ({
        type: "article" as const,
        title: a.title,
        date: a.published_at,
        id: a.id
      }));

      const recentUpdates = (updates || []).slice(0, 5).map(u => ({
        type: "update" as const,
        title: u.title || "Article Update",
        date: u.created_at,
        id: u.id
      }));

      const recentActivity = [...recentArticles, ...recentUpdates]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 8);

      return {
        totalArticles,
        totalUpdates,
        totalCategories,
        topArticles,
        trendingKeywords,
        categoryBreakdown,
        articlesNeedingUpdates,
        articlesMissingMeta,
        recentActivity
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000,
  });
};

// Hook to get IndexNow submission logs (stored in localStorage for now)
export const useIndexNowLogs = () => {
  return useQuery({
    queryKey: ["indexnow-logs"],
    queryFn: async () => {
      const logs = localStorage.getItem("indexnow-logs");
      return logs ? JSON.parse(logs) : [];
    },
    staleTime: 30 * 1000,
  });
};

// Helper to add IndexNow log
export const addIndexNowLog = (url: string, success: boolean, message?: string) => {
  const logs = JSON.parse(localStorage.getItem("indexnow-logs") || "[]");
  logs.unshift({
    url,
    success,
    message: message || (success ? "Submitted successfully" : "Submission failed"),
    timestamp: new Date().toISOString()
  });
  // Keep only last 50 logs
  localStorage.setItem("indexnow-logs", JSON.stringify(logs.slice(0, 50)));
};
