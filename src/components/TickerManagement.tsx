import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TickerItem {
  id: string;
  content: string;
  link_url: string | null;
  is_active: boolean;
  display_order: number;
}

interface TickerSettings {
  id: string;
  display_mode: 'breaking_news' | 'custom' | 'both';
}

export const TickerManagement = () => {
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);
  const [settings, setSettings] = useState<TickerSettings | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    content: "",
    link_url: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchTickerData();
  }, []);

  const fetchTickerData = async () => {
    // Fetch ticker items
    const { data: items } = await supabase
      .from("ticker_items")
      .select("*")
      .order("display_order", { ascending: true });

    if (items) {
      setTickerItems(items);
    }

    // Fetch settings
    const { data: settingsData } = await supabase
      .from("ticker_settings")
      .select("*")
      .single();

    if (settingsData) {
      setSettings(settingsData as TickerSettings);
    }
  };

  const handleDisplayModeChange = async (mode: string) => {
    if (!settings) return;

    const { error } = await supabase
      .from("ticker_settings")
      .update({ display_mode: mode })
      .eq("id", settings.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update display mode",
        variant: "destructive",
      });
    } else {
      setSettings({ ...settings, display_mode: mode as any });
      toast({
        title: "Success",
        description: "Display mode updated",
      });
    }
  };

  const handleCreateItem = async () => {
    if (!formData.content.trim()) {
      toast({
        title: "Error",
        description: "Content is required",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("ticker_items")
      .insert([{
        content: formData.content,
        link_url: formData.link_url || null,
        display_order: tickerItems.length,
      }]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create ticker item",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Ticker item created",
      });
      setFormData({ content: "", link_url: "" });
      setShowForm(false);
      fetchTickerData();
    }
  };

  const handleToggleActive = async (item: TickerItem) => {
    const { error } = await supabase
      .from("ticker_items")
      .update({ is_active: !item.is_active })
      .eq("id", item.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      });
    } else {
      fetchTickerData();
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ticker item?")) return;

    const { error } = await supabase
      .from("ticker_items")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Ticker item deleted",
      });
      fetchTickerData();
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100">Ticker Display Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="display-mode" className="text-slate-200">What to Display</Label>
            <Select
              value={settings?.display_mode || 'breaking_news'}
              onValueChange={handleDisplayModeChange}
            >
              <SelectTrigger id="display-mode" className="bg-slate-800 border-slate-700 text-slate-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="breaking_news">Breaking News Only</SelectItem>
                <SelectItem value="custom">Custom Content Only</SelectItem>
                <SelectItem value="both">Both (Breaking News + Custom)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-slate-400">
              Choose what appears in the ticker bar at the top of your site
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-slate-100">Custom Ticker Items</CardTitle>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            {showForm ? "Cancel" : "Add Item"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {showForm && (
            <div className="p-4 border border-slate-700 rounded-lg space-y-4 bg-slate-800">
              <div className="space-y-2">
                <Label htmlFor="content" className="text-slate-200">Content *</Label>
                <Input
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter ticker content..."
                  className="bg-slate-900 border-slate-700 text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="link" className="text-slate-200">Link URL (optional)</Label>
                <Input
                  id="link"
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  placeholder="https://..."
                  className="bg-slate-900 border-slate-700 text-slate-100"
                />
              </div>
              <Button onClick={handleCreateItem} className="w-full">
                Create Ticker Item
              </Button>
            </div>
          )}

          <div className="space-y-2">
            {tickerItems.length === 0 ? (
              <p className="text-slate-400 text-center py-8">
                No custom ticker items yet. Add one to get started!
              </p>
            ) : (
              tickerItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border border-slate-700 rounded-lg bg-slate-800"
                >
                  <div className="flex-1">
                    <p className={`text-sm ${item.is_active ? 'text-slate-100' : 'text-slate-500'}`}>
                      {item.content}
                    </p>
                    {item.link_url && (
                      <p className="text-xs text-slate-400 mt-1">
                        Link: {item.link_url}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(item)}
                      className="border-slate-700"
                    >
                      {item.is_active ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteItem(item.id)}
                      className="border-slate-700 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
