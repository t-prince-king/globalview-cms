import { Link } from "react-router-dom";
import { Search, Moon, Sun, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <nav className="sticky top-0 z-50 bg-background border-b">
      <div className="container mx-auto px-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between py-4">
          <Link to="/" className="flex flex-col">
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-primary">
              GlobalView Times
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground italic">
              See the World, One Story at a Time
            </p>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/search")}
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate("/auth")}
              className="hidden md:flex"
            >
              Admin Login
            </Button>
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
            variant="default"
            size="sm"
            onClick={() => navigate("/auth")}
            className="md:hidden mt-2"
          >
            Admin Login
          </Button>
        </div>
      </div>
    </nav>
  );
};
