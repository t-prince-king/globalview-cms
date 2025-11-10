import { Link } from "react-router-dom";
import { Search, Moon, Sun, Menu, LogOut, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.jpeg";

const categories = [
  { name: "World", slug: "world" },
  { name: "Politics", slug: "politics" },
  { name: "Technology", slug: "technology" },
  { name: "Business", slug: "business" },
  { name: "Sports", slug: "sports" },
  { name: "Entertainment", slug: "entertainment" },
  { name: "Lifestyle", slug: "lifestyle" },
];

export const Navigation = () => {
  const [isDark, setIsDark] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to logout");
    } else {
      toast.success("Logged out successfully");
      navigate("/");
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-background border-b">
      <div className="container mx-auto px-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="GlobalView Times Logo" className="h-10 w-10 md:h-12 md:w-12 object-contain" />
              <div className="flex flex-col">
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-primary">
                  GlobalView Times
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground italic">
                  See the World, One Story at a Time
                </p>
              </div>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/admin")}
              className="hidden md:flex"
            >
              Admin Panel
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/search")}
            >
              <Search className="h-5 w-5" />
            </Button>
            {isLoggedIn && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/bookmarks")}
                title="My Bookmarks"
              >
                <Bookmark className="h-5 w-5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            {isLoggedIn && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="hidden md:flex gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Categories */}
        <div
          className={`${
            isMenuOpen ? "flex" : "hidden"
          } md:flex flex-col md:flex-row gap-1 md:gap-6 pb-4 md:pb-3`}
        >
          {categories.map((category) => (
            <Link
              key={category.slug}
              to={`/category/${category.slug}`}
              className="text-sm font-medium text-foreground hover:text-accent transition-colors py-2 md:py-0"
            >
              {category.name}
            </Link>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/admin")}
            className="md:hidden mt-2"
          >
            Admin Panel
          </Button>
          {isLoggedIn && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/bookmarks")}
                className="md:hidden gap-2"
              >
                <Bookmark className="h-4 w-4" />
                Bookmarks
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="md:hidden gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
