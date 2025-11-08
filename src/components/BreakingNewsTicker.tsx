import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface TickerItem {
  id: string;
  content: string;
  link_url: string | null;
  type: 'breaking' | 'custom';
  slug?: string;
}

export const BreakingNewsTicker = () => {
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTickerContent = async () => {
      // Fetch settings to determine what to display
      const { data: settings } = await supabase
        .from("ticker_settings")
        .select("*")
        .single();

      const mode = settings?.display_mode || 'breaking_news';
      const items: TickerItem[] = [];

      // Fetch breaking news if needed
      if (mode === 'breaking_news' || mode === 'both') {
        const { data: breakingNews } = await supabase
          .from("articles")
          .select("title, slug")
          .eq("is_breaking", true)
          .order("published_at", { ascending: false })
          .limit(3);

        if (breakingNews) {
          items.push(...breakingNews.map(article => ({
            id: article.slug,
            content: article.title,
            link_url: null,
            type: 'breaking' as const,
            slug: article.slug,
          })));
        }
      }

      // Fetch custom items if needed
      if (mode === 'custom' || mode === 'both') {
        const { data: customItems } = await supabase
          .from("ticker_items")
          .select("*")
          .eq("is_active", true)
          .order("display_order", { ascending: true });

        if (customItems) {
          items.push(...customItems.map(item => ({
            id: item.id,
            content: item.content,
            link_url: item.link_url,
            type: 'custom' as const,
          })));
        }
      }

      setTickerItems(items);
    };

    fetchTickerContent();
  }, []);

  if (tickerItems.length === 0) return null;

  const handleItemClick = (item: TickerItem) => {
    if (item.type === 'breaking' && item.slug) {
      navigate(`/article/${item.slug}`);
    } else if (item.type === 'custom' && item.link_url) {
      window.open(item.link_url, '_blank');
    }
  };

  return (
    <div className="bg-gradient-accent text-accent-foreground py-2 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4">
          <span className="font-bold text-sm whitespace-nowrap">
            TICKER
          </span>
          <div className="flex gap-8 animate-scroll">
            {tickerItems.map((item) => (
              <span 
                key={item.id} 
                className={`text-sm whitespace-nowrap ${
                  (item.type === 'breaking' && item.slug) || (item.type === 'custom' && item.link_url)
                    ? 'cursor-pointer hover:underline'
                    : ''
                }`}
                onClick={() => handleItemClick(item)}
              >
                {item.content}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
