import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// IndexNow API endpoints for multiple search engines
const INDEXNOW_ENDPOINTS = [
  "https://api.indexnow.org/indexnow",
  "https://www.bing.com/indexnow",
  "https://yandex.com/indexnow",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { urls, host } = await req.json();
    
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return new Response(
        JSON.stringify({ error: "URLs array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const siteHost = host || "globalviewtimes.com";
    
    // IndexNow key - using a deterministic key based on site
    // In production, you'd want to store this and serve the key file
    const indexNowKey = "globalviewtimes-indexnow-key-2024";
    
    console.log(`IndexNow: Submitting ${urls.length} URLs to search engines`);

    const results = [];
    
    // Submit to each IndexNow endpoint
    for (const endpoint of INDEXNOW_ENDPOINTS) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            host: siteHost,
            key: indexNowKey,
            keyLocation: `https://${siteHost}/${indexNowKey}.txt`,
            urlList: urls,
          }),
        });

        results.push({
          endpoint,
          status: response.status,
          success: response.status >= 200 && response.status < 300,
        });

        console.log(`IndexNow ${endpoint}: Status ${response.status}`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error(`IndexNow ${endpoint} error:`, err);
        results.push({
          endpoint,
          status: 500,
          success: false,
          error: errorMessage,
        });
      }
    }

    // Also ping Google and Bing sitemaps
    const sitemapUrl = `https://${siteHost}/sitemap.xml`;
    
    try {
      // Ping Google
      await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`);
      console.log("Google sitemap ping sent");
      
      // Ping Bing
      await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`);
      console.log("Bing sitemap ping sent");
    } catch (pingError) {
      console.error("Sitemap ping error:", pingError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Submitted ${urls.length} URLs to IndexNow`,
        results,
        urls,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("IndexNow error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to submit to IndexNow", details: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
