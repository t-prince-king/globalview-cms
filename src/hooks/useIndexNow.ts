import { supabase } from "@/integrations/supabase/client";
import { addIndexNowLog } from "./useCEODashboard";

/**
 * Hook for submitting URLs to IndexNow for fast search engine indexing
 */
export const useIndexNow = () => {
  const submitToIndexNow = async (articleSlug: string) => {
    try {
      const baseUrl = window.location.origin;
      const articleUrl = `${baseUrl}/article/${articleSlug}`;
      
      const { data, error } = await supabase.functions.invoke("index-now", {
        body: {
          urls: [articleUrl],
          host: window.location.hostname,
        },
      });

      if (error) {
        console.error("IndexNow submission error:", error);
        addIndexNowLog(articleUrl, false, error.message);
        return { success: false, error };
      }

      console.log("IndexNow submission result:", data);
      addIndexNowLog(articleUrl, true, "Submitted successfully");
      return { success: true, data };
    } catch (error: any) {
      console.error("IndexNow error:", error);
      addIndexNowLog(`/article/${articleSlug}`, false, error.message);
      return { success: false, error };
    }
  };

  const submitMultipleUrls = async (slugs: string[]) => {
    try {
      const baseUrl = window.location.origin;
      const urls = slugs.map(slug => `${baseUrl}/article/${slug}`);
      
      const { data, error } = await supabase.functions.invoke("index-now", {
        body: {
          urls,
          host: window.location.hostname,
        },
      });

      if (error) {
        console.error("IndexNow batch submission error:", error);
        addIndexNowLog(`Batch (${slugs.length} articles)`, false, error.message);
        return { success: false, error };
      }

      addIndexNowLog(`Batch (${slugs.length} articles)`, true, "Submitted successfully");
      return { success: true, data };
    } catch (error: any) {
      console.error("IndexNow batch error:", error);
      addIndexNowLog(`Batch (${slugs.length} articles)`, false, error.message);
      return { success: false, error };
    }
  };

  return {
    submitToIndexNow,
    submitMultipleUrls,
  };
};

/**
 * Utility function to call IndexNow directly (for use outside React components)
 */
export const notifyIndexNow = async (articleSlug: string): Promise<boolean> => {
  try {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const articleUrl = `${baseUrl}/article/${articleSlug}`;
    
    const { error } = await supabase.functions.invoke("index-now", {
      body: {
        urls: [articleUrl],
        host: typeof window !== "undefined" ? window.location.hostname : "globalviewtimes.com",
      },
    });

    const success = !error;
    addIndexNowLog(articleUrl, success, success ? "Submitted successfully" : error?.message || "Failed");
    return success;
  } catch (error: any) {
    addIndexNowLog(`/article/${articleSlug}`, false, error.message);
    return false;
  }
};
