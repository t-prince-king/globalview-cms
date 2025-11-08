import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, ThumbsDown, MessageSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ArticleEngagementProps {
  articleId: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    display_name: string | null;
  };
}

export const ArticleEngagement = ({ articleId }: ArticleEngagementProps) => {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userLike, setUserLike] = useState<boolean | null>(null);
  const [likesCount, setLikesCount] = useState(0);
  const [dislikesCount, setDislikesCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [articleId]);

  useEffect(() => {
    fetchEngagementData();
  }, [articleId, user]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);

    if (session?.user) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);
      
      setIsAdmin(roles?.some(r => r.role === "admin") ?? false);
    }
  };

  const fetchEngagementData = async () => {
    // Fetch likes/dislikes count
    const { data: likes } = await supabase
      .from("article_likes")
      .select("is_like")
      .eq("article_id", articleId);

    if (likes) {
      setLikesCount(likes.filter(l => l.is_like).length);
      setDislikesCount(likes.filter(l => !l.is_like).length);
    }

    // Fetch user's like status
    if (user) {
      const { data: userLikeData } = await supabase
        .from("article_likes")
        .select("is_like")
        .eq("article_id", articleId)
        .eq("user_id", user.id)
        .maybeSingle();

      setUserLike(userLikeData?.is_like ?? null);
    }

    // Fetch comments
    const { data: commentsData } = await supabase
      .from("article_comments")
      .select(`
        id,
        content,
        created_at,
        user_id,
        profiles!article_comments_user_id_fkey (display_name)
      `)
      .eq("article_id", articleId)
      .order("created_at", { ascending: false });

    if (commentsData) {
      setComments(commentsData as any);
    }
  };

  const handleLike = async (isLike: boolean) => {
    if (!user) {
      toast.error("Please sign in to like articles");
      return;
    }

    try {
      if (userLike === isLike) {
        // Remove like/dislike
        await supabase
          .from("article_likes")
          .delete()
          .eq("article_id", articleId)
          .eq("user_id", user.id);
        setUserLike(null);
      } else {
        // Add or update like/dislike
        await supabase
          .from("article_likes")
          .upsert({
            article_id: articleId,
            user_id: user.id,
            is_like: isLike,
          });
        setUserLike(isLike);
      }
      fetchEngagementData();
    } catch (error) {
      toast.error("Failed to update reaction");
    }
  };

  const handleComment = async () => {
    if (!user) {
      toast.error("Please sign in to comment");
      return;
    }

    if (!newComment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      const { data: commentData, error } = await supabase
        .from("article_comments")
        .insert({
          article_id: articleId,
          user_id: user.id,
          content: newComment.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      // Get article author email and user display name for notification
      const { data: articleData } = await supabase
        .from("articles")
        .select("author_email, title, slug")
        .eq("id", articleId)
        .single();

      const { data: userProfile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();

      // Send notification email to article author
      if (articleData?.author_email) {
        await supabase.functions.invoke("send-notification-email", {
          body: {
            to: articleData.author_email,
            subject: `New comment on "${articleData.title}"`,
            type: "comment",
            articleTitle: articleData.title,
            articleUrl: `${window.location.origin}/article/${articleData.slug}`,
            userName: userProfile?.display_name || "Anonymous",
            commentContent: newComment.trim(),
          },
        });
      }

      setNewComment("");
      toast.success("Comment posted!");
      fetchEngagementData();
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Failed to post comment");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await supabase
        .from("article_comments")
        .delete()
        .eq("id", commentId);

      toast.success("Comment deleted");
      fetchEngagementData();
    } catch (error) {
      toast.error("Failed to delete comment");
    }
  };

  return (
    <div className="border-t border-border pt-8 mt-8">
      {/* Likes/Dislikes */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant={userLike === true ? "default" : "outline"}
          size="sm"
          onClick={() => handleLike(true)}
          className="gap-2"
        >
          <ThumbsUp className="h-4 w-4" />
          <span>{likesCount}</span>
        </Button>
        <Button
          variant={userLike === false ? "default" : "outline"}
          size="sm"
          onClick={() => handleLike(false)}
          className="gap-2"
        >
          <ThumbsDown className="h-4 w-4" />
          <span>{dislikesCount}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowComments(!showComments)}
          className="gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          <span>{comments.length} Comments</span>
        </Button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="space-y-6">
          {/* Add Comment */}
          {user ? (
            <div className="space-y-2">
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[100px]"
              />
              <Button onClick={handleComment}>Post Comment</Button>
            </div>
          ) : (
            <p className="text-muted-foreground">
              Please sign in to leave a comment
            </p>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-muted/50 rounded-lg p-4 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">
                      {comment.profiles.display_name || "Anonymous"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(comment.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  {(user?.id === comment.user_id || isAdmin) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteComment(comment.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-sm">{comment.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};