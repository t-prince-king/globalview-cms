import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ArticleCard } from "@/components/ArticleCard";
import { SEOHead } from "@/components/SEOHead";
import { BreadcrumbStructuredData } from "@/components/ArticleStructuredData";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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

export const Category = () => {
  const { category } = useParams<{ category: string }>();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 9;

  useEffect(() => {
    const fetchArticles = async () => {
      if (!category) return;

      setLoading(true);
      const { data } = await supabase
        .from("articles")
        .select("*")
        .eq("category", category as any)
        .order("published_at", { ascending: false });

      if (data) {
        setArticles(data);
      }
      setLoading(false);
    };

    fetchArticles();
  }, [category]);

  // Pagination calculations
  const totalPages = Math.ceil(articles.length / articlesPerPage);
  const startIndex = (currentPage - 1) * articlesPerPage;
  const endIndex = startIndex + articlesPerPage;
  const currentArticles = articles.slice(startIndex, endIndex);

  const categoryTitle = category ? category.charAt(0).toUpperCase() + category.slice(1) : "";
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: categoryTitle, url: `/category/${category}` },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${categoryTitle} News - GlobalView Times`}
        description={`Latest ${categoryTitle.toLowerCase()} news and updates. Read in-depth coverage and analysis from GlobalView Times.`}
        canonical={typeof window !== 'undefined' ? window.location.href : ''}
      />
      <BreadcrumbStructuredData items={breadcrumbs} />
      
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
            {breadcrumbs.map((crumb, index) => (
              <li key={crumb.url} className="flex items-center">
                {index > 0 && <span className="mx-2">/</span>}
                {index === breadcrumbs.length - 1 ? (
                  <span className="text-foreground">{crumb.name}</span>
                ) : (
                  <a href={crumb.url} className="hover:text-primary transition-colors">
                    {crumb.name}
                  </a>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <h1 className="text-4xl font-serif font-bold mb-8 capitalize">
          {category} News
        </h1>

        {loading ? (
          <p className="text-muted-foreground">Loading articles...</p>
        ) : articles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentArticles.map((article) => (
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
              No articles in this category yet.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
