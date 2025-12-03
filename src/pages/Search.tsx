import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ArticleCard } from "@/components/ArticleCard";
import { SEOHead } from "@/components/SEOHead";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 9;

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
      setCurrentPage(1); // Reset to first page on new search
    }
    setLoading(false);
  };

  // Pagination calculations
  const totalPages = Math.ceil(results.length / articlesPerPage);
  const startIndex = (currentPage - 1) * articlesPerPage;
  const endIndex = startIndex + articlesPerPage;
  const currentResults = results.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={query ? `Search: ${query} - GlobalView Times` : "Search Articles - GlobalView Times"}
        description="Search for articles across World, Politics, Technology, Business, Sports, Entertainment, and Lifestyle news on GlobalView Times."
        canonical={typeof window !== 'undefined' ? window.location.href : ''}
        noindex={true}
      />
      
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
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentResults.map((article) => (
                    <ArticleCard
                      key={article.id}
                      {...article}
                      imageUrl={article.image_url || undefined}
                    />
                  ))}
                </div>
                
                {totalPages > 1 && (
                  <Pagination className="mt-8">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      
                      {[...Array(totalPages)].map((_, i) => (
                        <PaginationItem key={i + 1}>
                          <PaginationLink
                            onClick={() => setCurrentPage(i + 1)}
                            isActive={currentPage === i + 1}
                            className="cursor-pointer"
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
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
