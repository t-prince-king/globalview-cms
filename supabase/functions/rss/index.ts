import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Escape XML special characters
const escapeXml = (text: string): string => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get base URL from request or use default
    const url = new URL(req.url);
    const baseUrl = url.searchParams.get("baseUrl") || "https://globalviewtimes.com";
    const category = url.searchParams.get("category");

    // Build query
    let query = supabase
      .from("articles")
      .select("title, slug, description, author, published_at, category, image_url, tags")
      .order("published_at", { ascending: false })
      .limit(50);

    if (category) {
      query = query.eq("category", category);
    }

    const { data: articles, error } = await query;

    if (error) throw error;

    const now = new Date().toUTCString();
    const feedTitle = category 
      ? `GlobalView Times - ${category.charAt(0).toUpperCase() + category.slice(1)} News`
      : "GlobalView Times";
    const feedDescription = category
      ? `Latest ${category} news from GlobalView Times`
      : "Your premier source for global news coverage";

    let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:media="http://search.yahoo.com/mrss/"
     xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(feedTitle)}</title>
    <link>${baseUrl}</link>
    <description>${escapeXml(feedDescription)}</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <pubDate>${now}</pubDate>
    <ttl>60</ttl>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${baseUrl}/logo.jpeg</url>
      <title>${escapeXml(feedTitle)}</title>
      <link>${baseUrl}</link>
    </image>
`;

    for (const article of articles || []) {
      const pubDate = new Date(article.published_at).toUTCString();
      const articleUrl = `${baseUrl}/article/${article.slug}`;
      
      rss += `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${articleUrl}</link>
      <guid isPermaLink="true">${articleUrl}</guid>
      <description><![CDATA[${article.description}]]></description>
      <pubDate>${pubDate}</pubDate>
      <dc:creator>${escapeXml(article.author)}</dc:creator>
      <category>${escapeXml(article.category)}</category>
`;

      if (article.image_url) {
        rss += `      <media:content url="${escapeXml(article.image_url)}" medium="image"/>
      <enclosure url="${escapeXml(article.image_url)}" type="image/jpeg"/>
`;
      }

      if (article.tags && article.tags.length > 0) {
        for (const tag of article.tags) {
          rss += `      <category>${escapeXml(tag)}</category>
`;
        }
      }

      rss += `    </item>
`;
    }

    rss += `  </channel>
</rss>`;

    return new Response(rss, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=1800", // Cache for 30 minutes
      },
    });
  } catch (error) {
    console.error("RSS generation error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate RSS feed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
