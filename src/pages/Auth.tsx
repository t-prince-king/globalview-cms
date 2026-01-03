import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Mail, RefreshCw } from "lucide-react";

export const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/admin");
      }
    });

    const init = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      // If user arrived from an email verification link, exchange the code for a session
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        url.searchParams.delete("code");
        window.history.replaceState({}, document.title, url.toString());

        if (error) {
          toast.error(error.message || "Verification link is invalid or expired.");
        } else {
          toast.success("Email verified! You can now access the admin dashboard.");
          navigate("/admin");
          return;
        }
      }

      // Otherwise, check if user is already logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (session) navigate("/admin");
    };

    init();

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) throw error;

      setSignupEmail(email);
      setShowVerificationMessage(true);
      setEmail("");
      setPassword("");
      setDisplayName("");
      toast.success("Account created! Please check your email to verify.");
    } catch (error: any) {
      toast.error(error.message || "Error creating account");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!signupEmail) {
      toast.error("Please enter your email address first");
      return;
    }

    setResendLoading(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: signupEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });

      if (error) throw error;

      toast.success("Verification email sent! Please check your inbox.");
    } catch (error: any) {
      toast.error(error.message || "Error sending verification email");
    } finally {
      setResendLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success("Logged in successfully!");
    } catch (error: any) {
      if (error.message?.includes("Email not confirmed")) {
        toast.error("Please verify your email before signing in.");
        setSignupEmail(email);
        setShowVerificationMessage(true);
      } else {
        toast.error(error.message || "Error signing in");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-12 max-w-md">
        {showVerificationMessage ? (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Check Your Email</CardTitle>
              <CardDescription className="text-base">
                We've sent a verification link to <strong>{signupEmail}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                Click the link in the email to verify your account and start using the platform.
              </p>
              
              <div className="flex flex-col gap-3">
                <Button
                  variant="outline"
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="w-full"
                >
                  {resendLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Resend Verification Email
                    </>
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowVerificationMessage(false);
                    setSignupEmail("");
                  }}
                  className="w-full"
                >
                  Back to Sign In
                </Button>
              </div>

              <div className="mt-4 rounded-lg bg-muted p-4">
                <p className="text-xs text-muted-foreground">
                  <strong>Didn't receive the email?</strong>
                  <br />• Check your spam or junk folder
                  <br />• Make sure you entered the correct email
                  <br />• Wait a few minutes and try resending
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <Card>
                <CardHeader>
                  <CardTitle>Sign In</CardTitle>
                  <CardDescription>
                    Enter your credentials to access the admin dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div>
                      <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>
                    Sign up to create an account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div>
                      <Input
                        type="text"
                        placeholder="Display Name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Input
                        type="password"
                        placeholder="Password (min 6 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Creating account..." : "Sign Up"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>

      <Footer />
    </div>
  );
};
