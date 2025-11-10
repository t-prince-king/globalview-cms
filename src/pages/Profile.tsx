import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { User, Mail, Bookmark, Bell } from "lucide-react";

export const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast.error("Please sign in to view your profile");
      navigate("/auth");
      return;
    }

    setUser(session.user);

    // Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", session.user.id)
      .maybeSingle();

    if (profile) {
      setDisplayName(profile.display_name || "");
    }

    // Fetch subscription
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (sub) {
      setSubscription(sub);
    }

    setLoading(false);
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  const handleUnsubscribe = async () => {
    if (!subscription) return;

    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({ is_active: false })
        .eq("id", subscription.id);

      if (error) throw error;

      toast.success("Unsubscribed successfully");
      setSubscription({ ...subscription, is_active: false });
    } catch (error) {
      toast.error("Failed to unsubscribe");
    }
  };

  const handleResubscribe = async () => {
    if (!subscription) return;

    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({ is_active: true })
        .eq("id", subscription.id);

      if (error) throw error;

      toast.success("Resubscribed successfully");
      setSubscription({ ...subscription, is_active: true });
    } catch (error) {
      toast.error("Failed to resubscribe");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-serif font-bold mb-8">My Account</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Manage your display name and details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                />
              </div>
              
              <Button onClick={handleUpdateProfile} className="w-full">
                Update Profile
              </Button>
            </CardContent>
          </Card>

          {/* Subscription Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Subscription Status
              </CardTitle>
              <CardDescription>Manage your news notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscription ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant={subscription.is_active ? "default" : "secondary"}>
                      {subscription.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Email:</span>
                    <span className="text-sm text-muted-foreground">{subscription.email}</span>
                  </div>
                  
                  {subscription.is_active ? (
                    <Button onClick={handleUnsubscribe} variant="outline" className="w-full">
                      Unsubscribe
                    </Button>
                  ) : (
                    <Button onClick={handleResubscribe} className="w-full">
                      Resubscribe
                    </Button>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    You're not subscribed to our newsletter
                  </p>
                  <Button onClick={() => navigate("/")}>
                    Subscribe Now
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bookmarks Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bookmark className="h-5 w-5" />
                Saved Articles
              </CardTitle>
              <CardDescription>Access your bookmarked articles</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate("/bookmarks")} 
                variant="outline" 
                className="w-full"
              >
                View Bookmarks
              </Button>
            </CardContent>
          </Card>

          {/* Account Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Account Details
              </CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">Member since:</span>
                <p className="text-muted-foreground">
                  {new Date(user?.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};
