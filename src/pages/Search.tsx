import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ArticleCard } from "@/components/ArticleCard";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon } from "lucide-react";

interface Article {
  id: string;
  title: string;
  slug: string;
  description: string;
  image_url: string | null;
  category: string;
  published_at: string;
}

export const Search = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    const { data } = await supabase
      .from("articles")
      .select("*")
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,content.ilike.%${query}%,tags.cs.{${query}}`)
      .order("published_at", { ascending: false });

    if (data) {
      setResults(data);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-serif font-bold mb-8">Search Articles</h1>

        <div className="flex gap-2 mb-8 max-w-2xl">
          <Input
            type="text"
            placeholder="Search for articles..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={loading}>
            <SearchIcon className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>

        {loading && <p className="text-muted-foreground">Searching...</p>}

        {!loading && searched && (
          <>
            <p className="text-muted-foreground mb-6">
              Found {results.length} result{results.length !== 1 ? "s" : ""}
            </p>

            {results.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((article) => (
                  <ArticleCard
                    key={article.id}
                    {...article}
                    imageUrl={article.image_url || undefined}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-xl text-muted-foreground">
                  No articles found for "{query}"
                </p>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};
