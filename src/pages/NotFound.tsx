import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

interface PageSettings {
  title: string;
  subtitle: string;
  content: string;
  image_url: string;
  button_text: string;
  button_link: string;
  show_ads: boolean;
  ad_content: string;
}

const NotFound = () => {
  const location = useLocation();
  const [settings, setSettings] = useState<PageSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("page_settings")
          .select("*")
          .eq("page_type", "not_found")
          .single();
        
        if (error) {
          console.error("Error fetching 404 settings:", error);
        }
        
        if (data) {
          setSettings(data as PageSettings);
        }
      } catch (err) {
        console.error("Failed to fetch 404 page settings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex flex-1 items-center justify-center py-20">
          <p className="text-muted-foreground">Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {settings?.image_url && (
            <div className="mb-8">
              <img 
                src={settings.image_url} 
                alt="404" 
                className="mx-auto max-w-full h-auto max-h-64 object-contain rounded-lg"
              />
            </div>
          )}
          
          <h1 className="text-6xl font-bold text-primary mb-4">
            {settings?.title || "404"}
          </h1>
          
          <p className="text-xl text-muted-foreground mb-6">
            {settings?.subtitle || "Oops! Page not found"}
          </p>
          
          {settings?.content && (
            <div 
              className="prose prose-lg max-w-none mb-8 text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: settings.content }}
            />
          )}
          
          <Link to={settings?.button_link || "/"}>
            <Button size="lg" className="mb-12">
              {settings?.button_text || "Return to Home"}
            </Button>
          </Link>
          
          {settings?.show_ads && settings?.ad_content && (
            <div className="mt-12 p-6 bg-muted rounded-lg">
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: settings.ad_content }}
              />
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default NotFound;