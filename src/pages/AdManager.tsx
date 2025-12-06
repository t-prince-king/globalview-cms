import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Home, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  Settings,
  Megaphone,
  Code,
  LayoutTemplate
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAllAds,
  useCreateAd,
  useUpdateAd,
  useDeleteAd,
  useAdSettings,
  useUpdateAdSettings,
  PLACEMENT_TYPES,
  type Ad,
} from "@/hooks/useAds";

export const AdManager = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    ad_code: "",
    placement_type: "article_bottom",
    status: false,
  });

  // Queries & mutations
  const { data: ads = [], isLoading: adsLoading } = useAllAds();
  const { data: adSettings } = useAdSettings();
  const createAd = useCreateAd();
  const updateAd = useUpdateAd();
  const deleteAd = useDeleteAd();
  const updateAdSettings = useUpdateAdSettings();

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth");
      }
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      const hasAccess = roles?.some((r) => r.role === "admin");

      if (!hasAccess) {
        toast.error("Only admins can access Ad Manager");
        navigate("/admin");
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error("Auth check error:", error);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        await updateAd.mutateAsync({ id: editingId, ...formData });
        toast.success("Ad updated successfully!");
      } else {
        await createAd.mutateAsync(formData);
        toast.success("Ad created successfully!");
      }
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Error saving ad");
    }
  };

  const handleEdit = (ad: Ad) => {
    setEditingId(ad.id);
    setFormData({
      title: ad.title,
      description: ad.description || "",
      ad_code: ad.ad_code,
      placement_type: ad.placement_type,
      status: ad.status,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ad?")) return;

    try {
      await deleteAd.mutateAsync(id);
      toast.success("Ad deleted");
    } catch (error: any) {
      toast.error(error.message || "Error deleting ad");
    }
  };

  const handleToggleStatus = async (ad: Ad) => {
    try {
      await updateAd.mutateAsync({ id: ad.id, status: !ad.status });
      toast.success(`Ad ${!ad.status ? "activated" : "deactivated"}`);
    } catch (error: any) {
      toast.error(error.message || "Error updating ad status");
    }
  };

  const handleGlobalToggle = async (enabled: boolean) => {
    try {
      await updateAdSettings.mutateAsync(enabled);
      toast.success(`Ads ${enabled ? "enabled" : "disabled"} globally`);
    } catch (error: any) {
      toast.error(error.message || "Error updating settings");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      ad_code: "",
      placement_type: "article_bottom",
      status: false,
    });
    setEditingId(null);
    setShowForm(false);
    setShowPreview(false);
  };

  const getPlacementLabel = (value: string) => {
    return PLACEMENT_TYPES.find(p => p.value === value)?.label || value;
  };

  if (loading || adsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Megaphone className="h-6 w-6 text-primary" />
              <h1 className="text-xl sm:text-2xl font-bold">Ad Manager</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/admin")}
                className="border-slate-700 hover:bg-slate-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Admin
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/")}
                className="border-slate-700 hover:bg-slate-800"
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="ads" className="space-y-6">
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="ads" className="data-[state=active]:bg-slate-800">
              <LayoutTemplate className="h-4 w-4 mr-2" />
              Ad Units
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-slate-800">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle>Monetization Settings</CardTitle>
                <CardDescription className="text-slate-400">
                  Control global ad display settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border border-slate-700 rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Enable Ads Globally</Label>
                    <p className="text-sm text-slate-400">
                      When disabled, no ads will be shown anywhere on the site
                    </p>
                  </div>
                  <Switch
                    checked={adSettings?.ads_enabled ?? false}
                    onCheckedChange={handleGlobalToggle}
                  />
                </div>

                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <h3 className="font-medium mb-2">Available Placements</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {PLACEMENT_TYPES.map((type) => (
                      <Badge 
                        key={type.value} 
                        variant="outline"
                        className="justify-center py-2"
                      >
                        {type.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ads Tab */}
          <TabsContent value="ads" className="space-y-6">
            {!showForm ? (
              <>
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {ads.length} Ad Unit{ads.length !== 1 ? "s" : ""}
                    </h2>
                    <p className="text-sm text-slate-400">
                      Manage your advertisement placements
                    </p>
                  </div>
                  <Button onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Ad
                  </Button>
                </div>

                {ads.length === 0 ? (
                  <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Megaphone className="h-12 w-12 text-slate-600 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No ads yet</h3>
                      <p className="text-slate-400 text-center mb-4">
                        Create your first ad unit to start monetizing
                      </p>
                      <Button onClick={() => setShowForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Ad
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {ads.map((ad) => (
                      <Card key={ad.id} className="bg-slate-900 border-slate-800">
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{ad.title}</h3>
                                <Badge variant={ad.status ? "default" : "secondary"}>
                                  {ad.status ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-slate-400">
                                <Badge variant="outline" className="text-xs">
                                  {getPlacementLabel(ad.placement_type)}
                                </Badge>
                                {ad.description && (
                                  <span className="truncate max-w-[200px]">
                                    {ad.description}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleStatus(ad)}
                              >
                                {ad.status ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(ad)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(ad.id)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {editingId ? "Edit Ad" : "Create New Ad"}
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="e.g., Header Banner Ad"
                          required
                          className="bg-slate-800 border-slate-700"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="placement">Placement *</Label>
                        <Select
                          value={formData.placement_type}
                          onValueChange={(value) => setFormData({ ...formData, placement_type: value })}
                        >
                          <SelectTrigger className="bg-slate-800 border-slate-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PLACEMENT_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Internal note about this ad"
                        className="bg-slate-800 border-slate-700"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="ad_code">
                          <Code className="h-4 w-4 inline mr-2" />
                          Ad Code (HTML/JS) *
                        </Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPreview(!showPreview)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {showPreview ? "Hide" : "Show"} Preview
                        </Button>
                      </div>
                      <Textarea
                        id="ad_code"
                        value={formData.ad_code}
                        onChange={(e) => setFormData({ ...formData, ad_code: e.target.value })}
                        placeholder="Paste your AdSense, affiliate, or custom ad code here..."
                        rows={8}
                        required
                        className="bg-slate-800 border-slate-700 font-mono text-sm"
                      />
                      <p className="text-xs text-slate-400">
                        Supports full HTML, CSS, and JavaScript including AdSense scripts
                      </p>
                    </div>

                    {showPreview && formData.ad_code && (
                      <div className="space-y-2">
                        <Label>Live Preview</Label>
                        <div 
                          className="border border-slate-700 rounded-lg p-4 bg-slate-800 min-h-[100px]"
                          dangerouslySetInnerHTML={{ __html: formData.ad_code }}
                        />
                        <p className="text-xs text-amber-400">
                          ⚠️ Scripts will only execute on the live site
                        </p>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="status"
                        checked={formData.status}
                        onCheckedChange={(checked) => setFormData({ ...formData, status: checked })}
                      />
                      <Label htmlFor="status">Activate immediately</Label>
                    </div>

                    <div className="flex gap-4">
                      <Button type="submit" disabled={createAd.isPending || updateAd.isPending}>
                        {editingId ? "Update Ad" : "Create Ad"}
                      </Button>
                      <Button type="button" variant="outline" onClick={resetForm}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};
