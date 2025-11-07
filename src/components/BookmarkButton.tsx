import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface BookmarkButtonProps {
  articleId: string;
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
}

export const BookmarkButton = ({ articleId, variant = "outline", size = "sm" }: BookmarkButtonProps) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, [articleId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);

    if (session?.user) {
      checkBookmark(session.user.id);
    }
  };

  const checkBookmark = async (userId: string) => {
    const { data } = await supabase
      .from("article_bookmarks")
      .select("id")
      .eq("article_id", articleId)
      .eq("user_id", userId)
      .maybeSingle();

    setIsBookmarked(!!data);
  };

  const handleBookmark = async () => {
    if (!user) {
      toast.error("Please sign in to bookmark articles");
      navigate("/auth");
      return;
    }

    try {
      if (isBookmarked) {
        await supabase
          .from("article_bookmarks")
          .delete()
          .eq("article_id", articleId)
          .eq("user_id", user.id);

        setIsBookmarked(false);
        toast.success("Bookmark removed");
      } else {
        await supabase
          .from("article_bookmarks")
          .insert({
            article_id: articleId,
            user_id: user.id,
          });

        setIsBookmarked(true);
        toast.success("Article bookmarked!");
      }
    } catch (error) {
      toast.error("Failed to update bookmark");
    }
  };

  return (
    <Button
      variant={isBookmarked ? "default" : variant}
      size={size}
      onClick={handleBookmark}
      className="gap-2"
    >
      <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} />
      {isBookmarked ? "Bookmarked" : "Bookmark"}
    </Button>
  );
};