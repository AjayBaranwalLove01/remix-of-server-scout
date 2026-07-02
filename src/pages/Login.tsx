import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading, error, token } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    // If already logged in, redirect to home
    if (token) {
      navigate("/");
    }
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    
    try {
      await login(username, password);
      navigate("/");
    } catch (err) {
      // Error handled by store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="absolute inset-0 bg-gradient-radial from-accent/5 via-transparent to-transparent pointer-events-none" />
      
      <Card className="w-full max-w-md border-border bg-card/60 backdrop-blur-md shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-primary to-accent-soft" />
        
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center mx-auto mb-2 border border-accent/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Server Scout Login
          </CardTitle>
          <CardDescription className="text-muted-foreground text-xs">
            Authenticate using your corporate Active Directory credentials
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2 animate-shake">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                AD Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="e.g. ajay.baranwal"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                required
                className="bg-background/50 border-border focus-visible:ring-accent/30"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                className="bg-background/50 border-border focus-visible:ring-accent/30"
              />
            </div>
          </CardContent>
          
          <CardFooter className="pt-2 flex flex-col gap-4">
            <Button
              type="submit"
              disabled={loading || !username.trim() || !password}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm font-semibold h-10 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Log In"
              )}
            </Button>
            
            <p className="text-[10px] text-center text-muted-foreground leading-normal max-w-[280px]">
              Access is monitored. Unauthorized attempts will be logged and reported to systems administration.
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
