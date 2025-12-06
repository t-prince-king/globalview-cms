import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";

// Lazy load all pages for code splitting
const Home = lazy(() => import("./pages/Home").then(m => ({ default: m.Home })));
const Category = lazy(() => import("./pages/Category").then(m => ({ default: m.Category })));
const Article = lazy(() => import("./pages/Article").then(m => ({ default: m.Article })));
const Search = lazy(() => import("./pages/Search").then(m => ({ default: m.Search })));
const About = lazy(() => import("./pages/About").then(m => ({ default: m.About })));
const Contact = lazy(() => import("./pages/Contact").then(m => ({ default: m.Contact })));
const Auth = lazy(() => import("./pages/Auth").then(m => ({ default: m.Auth })));
const Admin = lazy(() => import("./pages/Admin").then(m => ({ default: m.Admin })));
const CEODashboard = lazy(() => import("./pages/CEODashboard").then(m => ({ default: m.CEODashboard })));
const AdManager = lazy(() => import("./pages/AdManager").then(m => ({ default: m.AdManager })));
const Bookmarks = lazy(() => import("./pages/Bookmarks").then(m => ({ default: m.Bookmarks })));
const Profile = lazy(() => import("./pages/Profile").then(m => ({ default: m.Profile })));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading component for suspense fallback
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="animate-pulse flex flex-col items-center gap-4">
      <div className="h-12 w-12 rounded-full bg-primary/20" />
      <div className="h-4 w-32 bg-muted rounded" />
    </div>
  </div>
);

// Optimized QueryClient with aggressive caching for scalability
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 30 minutes
      gcTime: 30 * 60 * 1000,
      // Retry failed requests 2 times
      retry: 2,
      // Don't refetch on window focus for better performance
      refetchOnWindowFocus: false,
      // Use cached data while revalidating
      refetchOnMount: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/category/:category" element={<Category />} />
            <Route path="/article/:slug" element={<Article />} />
            <Route path="/search" element={<Search />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/dashboard" element={<CEODashboard />} />
            <Route path="/admin/ads" element={<AdManager />} />
            <Route path="/bookmarks" element={<Bookmarks />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
