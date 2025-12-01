import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";

interface PageSettings {
  id: string;
  page_type: string;
  title: string;
  subtitle: string;
  content: string;
  image_url: string;
  button_text: string;
  button_link: string;
  show_ads: boolean;
  ad_content: string;
}

export const NotFoundManagement = () => {
  const [settings, setSettings] = useState<PageSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("page_settings")
        .select("*")
        .eq("page_type", "not_found")
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching settings:", error);
      }

      if (data) {
        setSettings(data as PageSettings);
      } else {
        // Create default settings if none exist
        const { data: newData, error: insertError } = await supabase
          .from("page_settings")
          .insert({
            page_type: "not_found",
            title: "404 - Page Not Found",
            subtitle: "Oops! The page you're looking for doesn't exist.",
            button_text: "Go to Homepage",
            button_link: "/",
          })
          .select()
          .single();

        if (insertError) {
          console.error("Error creating default settings:", insertError);
        } else if (newData) {
          setSettings(newData as PageSettings);
        }
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("page_settings")
        .update({
          title: settings.title,
          subtitle: settings.subtitle,
          content: settings.content,
          image_url: settings.image_url,
          button_text: settings.button_text,
          button_link: settings.button_link,
          show_ads: settings.show_ads,
          ad_content: settings.ad_content,
        })
        .eq("id", settings.id);

      if (error) throw error;
      toast.success("404 page settings saved!");
    } catch (error: any) {
      toast.error("Failed to save settings: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];
    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `404-page-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("article-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("article-images")
        .getPublicUrl(fileName);

      setSettings((prev) =>
        prev ? { ...prev, image_url: data.publicUrl } : null
      );
      toast.success("Image uploaded!");
    } catch (error: any) {
      toast.error("Failed to upload image: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setSettings((prev) => (prev ? { ...prev, image_url: "" } : null));
  };

  if (loading) {
    return <p className="text-slate-400">Loading 404 page settings...</p>;
  }

  if (!settings) {
    return <p className="text-slate-400">Unable to load settings.</p>;
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-slate-100">404 Page Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-slate-300">
            Page Title
          </Label>
          <Input
            id="title"
            value={settings.title}
            onChange={(e) =>
              setSettings({ ...settings, title: e.target.value })
            }
            className="bg-slate-800 border-slate-700 text-slate-100"
            placeholder="404 - Page Not Found"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subtitle" className="text-slate-300">
            Subtitle
          </Label>
          <Input
            id="subtitle"
            value={settings.subtitle || ""}
            onChange={(e) =>
              setSettings({ ...settings, subtitle: e.target.value })
            }
            className="bg-slate-800 border-slate-700 text-slate-100"
            placeholder="The page you're looking for doesn't exist."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content" className="text-slate-300">
            Additional Content (HTML supported)
          </Label>
          <Textarea
            id="content"
            value={settings.content || ""}
            onChange={(e) =>
              setSettings({ ...settings, content: e.target.value })
            }
            className="bg-slate-800 border-slate-700 text-slate-100"
            rows={4}
            placeholder="Add any additional content here..."
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Page Image</Label>
          {settings.image_url ? (
            <div className="relative inline-block">
              <img
                src={settings.image_url}
                alt="404 Page"
                className="max-w-xs h-auto rounded-lg"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={removeImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="relative border-2 border-dashed rounded-lg p-6 text-center border-slate-700 bg-slate-900/50">
              <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
              <p className="text-sm text-slate-400">
                {uploading ? "Uploading..." : "Upload an image for the 404 page"}
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="button_text" className="text-slate-300">
              Button Text
            </Label>
            <Input
              id="button_text"
              value={settings.button_text || ""}
              onChange={(e) =>
                setSettings({ ...settings, button_text: e.target.value })
              }
              className="bg-slate-800 border-slate-700 text-slate-100"
              placeholder="Return to Home"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="button_link" className="text-slate-300">
              Button Link
            </Label>
            <Input
              id="button_link"
              value={settings.button_link || ""}
              onChange={(e) =>
                setSettings({ ...settings, button_link: e.target.value })
              }
              className="bg-slate-800 border-slate-700 text-slate-100"
              placeholder="/"
            />
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Label className="text-slate-300">Enable Advertising</Label>
              <p className="text-sm text-slate-500">
                Show promotional content on the 404 page
              </p>
            </div>
            <Switch
              checked={settings.show_ads}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, show_ads: checked })
              }
            />
          </div>

          {settings.show_ads && (
            <div className="space-y-2">
              <Label htmlFor="ad_content" className="text-slate-300">
                Ad/Promotional Content (HTML supported)
              </Label>
              <Textarea
                id="ad_content"
                value={settings.ad_content || ""}
                onChange={(e) =>
                  setSettings({ ...settings, ad_content: e.target.value })
                }
                className="bg-slate-800 border-slate-700 text-slate-100"
                rows={4}
                placeholder="<p>Check out our latest articles!</p>"
              />
            </div>
          )}
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Saving..." : "Save 404 Page Settings"}
        </Button>
      </CardContent>
    </Card>
  );
};