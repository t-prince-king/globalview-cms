import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, Users } from "lucide-react";

interface Subscription {
  id: string;
  email: string;
  created_at: string;
  is_active: boolean;
}

interface SubscriptionSettings {
  id: string;
  is_paid: boolean;
  price: number;
}

export const SubscriptionManagement = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [settings, setSettings] = useState<SubscriptionSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
    fetchSettings();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("id, email, created_at, is_active, user_id")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Subscription fetch error:", error);
        throw error;
      }
      
      setSubscriptions(data || []);
    } catch (error: any) {
      console.error("Error fetching subscriptions:", error);
      toast.error(`Failed to load subscriptions: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("subscription_settings")
        .select("*")
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this subscriber?")) return;

    try {
      const { error } = await supabase
        .from("subscriptions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Subscriber removed");
      fetchSubscriptions();
    } catch (error) {
      console.error("Error deleting subscription:", error);
      toast.error("Failed to remove subscriber");
    }
  };

  const handleTogglePaid = async (isPaid: boolean) => {
    if (!settings) return;

    try {
      const { error } = await supabase
        .from("subscription_settings")
        .update({ is_paid: isPaid })
        .eq("id", settings.id);

      if (error) throw error;

      setSettings({ ...settings, is_paid: isPaid });
      toast.success(`Subscriptions are now ${isPaid ? "paid" : "free"}`);
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Failed to update settings");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading subscriptions...</div>;
  }

  const activeCount = subscriptions.filter((s) => s.is_active).length;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Subscription Management</h2>
          </div>
          <div className="text-sm text-muted-foreground">
            {activeCount} active subscriber{activeCount !== 1 ? "s" : ""}
          </div>
        </div>

        {settings && (
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg mb-6">
            <div className="flex items-center gap-2">
              <Switch
                id="paid-mode"
                checked={settings.is_paid}
                onCheckedChange={handleTogglePaid}
              />
              <Label htmlFor="paid-mode" className="cursor-pointer">
                {settings.is_paid ? "Paid Subscriptions (Block until payment)" : "Free Subscriptions"}
              </Label>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {subscriptions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No subscribers yet
            </p>
          ) : (
            subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-3 bg-background border border-border rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium">{sub.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Subscribed on {new Date(sub.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(sub.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
