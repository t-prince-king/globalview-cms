import { Helmet } from "react-helmet";

interface ArticleStructuredDataProps {
  headline: string;
  description: string;
  image: string;
  author: string;
  datePublished: string;
  dateModified?: string;
  articleSection: string;
  keywords: string[];
  url: string;
  wordCount?: number;
}

export const ArticleStructuredData = ({
  headline,
  description,
  image,
  author,
  datePublished,
  dateModified,
  articleSection,
  keywords,
  url,
  wordCount,
}: ArticleStructuredDataProps) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    headline: headline.substring(0, 110), // Google recommends max 110 chars
    description: description.substring(0, 160),
    image: image ? [image] : [],
    author: {
      "@type": "Person",
      name: author,
    },
    publisher: {
      "@type": "Organization",
      name: "GlobalView Times",
      logo: {
        "@type": "ImageObject",
        url: `${typeof window !== 'undefined' ? window.location.origin : ''}/logo.jpeg`,
        width: 600,
        height: 60,
      },
    },
    datePublished: datePublished,
    dateModified: dateModified || datePublished,
    articleSection: articleSection,
    keywords: keywords.join(", "),
    ...(wordCount && { wordCount }),
    isAccessibleForFree: true,
    inLanguage: "en-US",
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

// Website structured data for homepage
export const WebsiteStructuredData = () => {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "GlobalView Times",
    alternateName: "GlobalView",
    url: origin,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${origin}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const organizationData = {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    name: "GlobalView Times",
    url: origin,
    logo: {
      "@type": "ImageObject",
      url: `${origin}/logo.jpeg`,
    },
    sameAs: [
      "https://twitter.com/GlobalViewTimes",
      "https://facebook.com/GlobalViewTimes",
    ],
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(organizationData)}
      </script>
    </Helmet>
  );
};

// Breadcrumb structured data
export const BreadcrumbStructuredData = ({ 
  items 
}: { 
  items: { name: string; url: string }[] 
}) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${origin}${item.url}`,
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};
