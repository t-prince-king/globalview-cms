import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCEODashboard, useIndexNowLogs, addIndexNowLog } from "@/hooks/useCEODashboard";
import { notifyIndexNow } from "@/hooks/useIndexNow";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  BarChart3,
  FileText,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Tags,
  Folder,
  Plus,
  Send,
  Home,
  ArrowLeft,
  Activity,
  Search,
  Image,
  Zap,
  Calendar,
  ExternalLink
} from "lucide-react";

export const CEODashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [triggeringIndexNow, setTriggeringIndexNow] = useState(false);

  const { data: dashboardData, isLoading: dashboardLoading, refetch } = useCEODashboard();
  const { data: indexNowLogs = [] } = useIndexNowLogs();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();

      if (roleData?.role === "admin" || roleData?.role === "editor") {
        setIsAdmin(true);
      } else {
        toast.error("Access denied. Admin or editor role required.");
        navigate("/");
      }
    } catch (error) {
      console.error("Auth error:", error);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerIndexNow = async () => {
    setTriggeringIndexNow(true);
    try {
      const { data: articles } = await supabase
        .from("articles")
        .select("slug")
        .order("published_at", { ascending: false })
        .limit(10);

      if (articles && articles.length > 0) {
        const slugs = articles.map(a => a.slug);
        const response = await supabase.functions.invoke("index-now", {
          body: {
            urls: slugs.map(s => `https://globalviewtimes.com/article/${s}`),
            host: "globalviewtimes.com"
          }
        });

        if (response.error) throw response.error;
        
        addIndexNowLog("Batch submission (10 articles)", true, "Submitted to IndexNow");
        toast.success("IndexNow triggered for recent articles!");
      }
    } catch (error: any) {
      addIndexNowLog("Batch submission", false, error.message);
      toast.error("Failed to trigger IndexNow");
    } finally {
      setTriggeringIndexNow(false);
    }
  };

  const handleSubmitSitemap = async () => {
    try {
      // Ping Google and Bing sitemaps
      const sitemapUrl = "https://wwfoepbvkcsrlsstniix.supabase.co/functions/v1/sitemap";
      window.open(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`, "_blank");
      toast.success("Sitemap ping sent to Google!");
    } catch (error) {
      toast.error("Failed to submit sitemap");
    }
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Button>
              <div>
                <h1 className="text-2xl font-bold">CEO Dashboard</h1>
                <p className="text-sm text-slate-400">Analytics & Performance Overview</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
                <Home className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Quick Actions Bar */}
        <Card className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => navigate("/admin")} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                New Article
              </Button>
              <Button size="sm" variant="outline" onClick={handleSubmitSitemap}>
                <Send className="h-4 w-4 mr-2" />
                Submit Sitemap
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleTriggerIndexNow}
                disabled={triggeringIndexNow}
              >
                <Search className="h-4 w-4 mr-2" />
                {triggeringIndexNow ? "Triggering..." : "Trigger IndexNow"}
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href="https://wwfoepbvkcsrlsstniix.supabase.co/functions/v1/sitemap" target="_blank" rel="noopener">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Sitemap
                </a>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href="https://wwfoepbvkcsrlsstniix.supabase.co/functions/v1/rss" target="_blank" rel="noopener">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View RSS
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Articles"
            value={dashboardData?.totalArticles || 0}
            icon={<FileText className="h-5 w-5" />}
            color="blue"
            loading={dashboardLoading}
          />
          <StatCard
            title="Article Updates"
            value={dashboardData?.totalUpdates || 0}
            icon={<RefreshCw className="h-5 w-5" />}
            color="green"
            loading={dashboardLoading}
          />
          <StatCard
            title="Categories"
            value={dashboardData?.totalCategories || 0}
            icon={<Folder className="h-5 w-5" />}
            color="purple"
            loading={dashboardLoading}
          />
          <StatCard
            title="Needs Attention"
            value={(dashboardData?.articlesNeedingUpdates?.length || 0) + (dashboardData?.articlesMissingMeta?.length || 0)}
            icon={<AlertTriangle className="h-5 w-5" />}
            color="yellow"
            loading={dashboardLoading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Articles */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
                Top 10 Most Viewed Articles
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (
                <div className="space-y-2">
                  {dashboardData?.topArticles.map((article, index) => (
                    <div
                      key={article.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <span className={`text-sm font-bold w-6 ${index < 3 ? "text-yellow-400" : "text-slate-500"}`}>
                        #{index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <Link 
                          to={`/article/${article.slug}`}
                          className="text-sm font-medium hover:text-blue-400 truncate block"
                        >
                          {article.title}
                        </Link>
                        <span className="text-xs text-slate-500">{article.category}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Eye className="h-3 w-3" />
                        <span className="text-sm">{article.views.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trending Keywords */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tags className="h-5 w-5 text-purple-400" />
                Trending Keywords
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardLoading ? (
                <div className="flex flex-wrap gap-2">
                  {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-6 w-20" />)}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {dashboardData?.trendingKeywords.map((kw, index) => (
                    <Badge
                      key={kw.keyword}
                      variant={index < 3 ? "default" : "secondary"}
                      className={index < 3 ? "bg-purple-600" : ""}
                    >
                      {kw.keyword} ({kw.count})
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Category Breakdown */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-400" />
                Category Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboardData?.categoryBreakdown.map((cat) => {
                    const percentage = dashboardData.totalArticles 
                      ? Math.round((cat.count / dashboardData.totalArticles) * 100) 
                      : 0;
                    return (
                      <div key={cat.category} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{cat.category}</span>
                          <span className="text-slate-400">{cat.count} ({percentage}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Articles Needing Updates */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-400" />
                Needs Update (6+ months old)
              </CardTitle>
              <CardDescription>Articles that haven't been updated recently</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardLoading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : dashboardData?.articlesNeedingUpdates.length === 0 ? (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>All articles are up to date!</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {dashboardData?.articlesNeedingUpdates.map((article) => (
                    <div
                      key={article.id}
                      className="flex items-center justify-between p-2 rounded bg-yellow-900/20 border border-yellow-800/30"
                    >
                      <Link 
                        to={`/article/${article.slug}`}
                        className="text-sm hover:text-yellow-400 truncate flex-1"
                      >
                        {article.title}
                      </Link>
                      <span className="text-xs text-slate-500 ml-2">
                        {format(new Date(article.updated_at), "MMM yyyy")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* SEO Issues */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                SEO Issues
              </CardTitle>
              <CardDescription>Articles missing important SEO elements</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardLoading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : dashboardData?.articlesMissingMeta.length === 0 ? (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>All articles have proper SEO!</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {dashboardData?.articlesMissingMeta.map((article) => (
                    <div
                      key={article.id}
                      className="flex items-center justify-between p-2 rounded bg-red-900/20 border border-red-800/30"
                    >
                      <div className="flex-1 min-w-0">
                        <Link 
                          to={`/article/${article.slug}`}
                          className="text-sm hover:text-red-400 truncate block"
                        >
                          {article.title}
                        </Link>
                        <span className="text-xs text-red-400">{article.issue}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* IndexNow Logs & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* IndexNow Logs */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-blue-400" />
                IndexNow Submission Logs
              </CardTitle>
              <CardDescription>Recent search engine indexing requests</CardDescription>
            </CardHeader>
            <CardContent>
              {indexNowLogs.length === 0 ? (
                <p className="text-slate-500 text-sm">No IndexNow submissions yet</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {indexNowLogs.slice(0, 10).map((log: any, index: number) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 p-2 rounded text-sm ${
                        log.success ? "bg-green-900/20" : "bg-red-900/20"
                      }`}
                    >
                      {log.success ? (
                        <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                      )}
                      <span className="truncate flex-1">{log.url}</span>
                      <span className="text-xs text-slate-500 flex-shrink-0">
                        {format(new Date(log.timestamp), "MMM d, HH:mm")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-400" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest articles and updates</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {dashboardData?.recentActivity.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-2 rounded hover:bg-slate-800"
                    >
                      {item.type === "article" ? (
                        <FileText className="h-4 w-4 text-blue-400" />
                      ) : (
                        <RefreshCw className="h-4 w-4 text-green-400" />
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm truncate block">{item.title}</span>
                        <span className="text-xs text-slate-500">
                          {item.type === "article" ? "New Article" : "Update"} • {format(new Date(item.date), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Performance Indicators */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              SEO Health Score
            </CardTitle>
            <CardDescription>Overall content health based on SEO best practices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <HealthIndicator
                label="Meta Descriptions"
                value={dashboardData ? 
                  Math.round(((dashboardData.totalArticles - (dashboardData.articlesMissingMeta?.filter(a => a.issue.includes("meta")).length || 0)) / Math.max(dashboardData.totalArticles, 1)) * 100) 
                  : 0}
                loading={dashboardLoading}
              />
              <HealthIndicator
                label="Featured Images"
                value={dashboardData ? 
                  Math.round(((dashboardData.totalArticles - (dashboardData.articlesMissingMeta?.filter(a => a.issue.includes("image")).length || 0)) / Math.max(dashboardData.totalArticles, 1)) * 100) 
                  : 0}
                loading={dashboardLoading}
              />
              <HealthIndicator
                label="Content Freshness"
                value={dashboardData ? 
                  Math.round(((dashboardData.totalArticles - (dashboardData.articlesNeedingUpdates?.length || 0)) / Math.max(dashboardData.totalArticles, 1)) * 100) 
                  : 0}
                loading={dashboardLoading}
              />
              <HealthIndicator
                label="Keyword Coverage"
                value={dashboardData?.trendingKeywords.length ? Math.min(100, dashboardData.trendingKeywords.length * 7) : 0}
                loading={dashboardLoading}
              />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ 
  title, 
  value, 
  icon, 
  color, 
  loading 
}: { 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  color: "blue" | "green" | "purple" | "yellow"; 
  loading: boolean;
}) => {
  const colorClasses = {
    blue: "from-blue-900/50 to-blue-800/30 border-blue-700/50",
    green: "from-green-900/50 to-green-800/30 border-green-700/50",
    purple: "from-purple-900/50 to-purple-800/30 border-purple-700/50",
    yellow: "from-yellow-900/50 to-yellow-800/30 border-yellow-700/50",
  };

  const iconColorClasses = {
    blue: "text-blue-400",
    green: "text-green-400",
    purple: "text-purple-400",
    yellow: "text-yellow-400",
  };

  return (
    <Card className={`bg-gradient-to-br ${colorClasses[color]} border`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <p className="text-3xl font-bold">{value.toLocaleString()}</p>
            )}
          </div>
          <div className={iconColorClasses[color]}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
};

// Health Indicator Component
const HealthIndicator = ({ 
  label, 
  value, 
  loading 
}: { 
  label: string; 
  value: number; 
  loading: boolean;
}) => {
  const getColor = (val: number) => {
    if (val >= 80) return { bg: "bg-green-500", text: "text-green-400" };
    if (val >= 50) return { bg: "bg-yellow-500", text: "text-yellow-400" };
    return { bg: "bg-red-500", text: "text-red-400" };
  };

  const colors = getColor(value);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        {loading ? (
          <Skeleton className="h-4 w-10" />
        ) : (
          <span className={colors.text}>{value}%</span>
        )}
      </div>
      {loading ? (
        <Skeleton className="h-2 w-full" />
      ) : (
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className={`h-full ${colors.bg} transition-all duration-500`}
            style={{ width: `${value}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default CEODashboard;
