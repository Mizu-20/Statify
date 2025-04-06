import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  useEffect(() => {
    // Check if there's an error in the URL
    const url = new URL(window.location.href);
    const error = url.searchParams.get("error");
    
    if (error) {
      toast({
        title: "Authentication Failed",
        description: "Unable to log in with Spotify. Please try again.",
        variant: "destructive"
      });
      
      // Remove the error from the URL
      url.searchParams.delete("error");
      window.history.replaceState({}, document.title, url.toString());
    }
    
    // Redirect to dashboard if already authenticated
    if (isAuthenticated && !isLoading) {
      setLocation("/");
    }
  }, [isAuthenticated, isLoading, setLocation, toast]);
  
  const handleLogin = async () => {
    try {
      const response = await apiRequest("GET", "/api/auth/login", undefined);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!data.url) {
        throw new Error("No authorization URL received");
      }
      window.location.href = data.url;
    } catch (error) {
      console.error("Login error:", error instanceof Error ? error.message : "Unknown error");
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Failed to initiate login. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <Card className="login-container p-10 rounded-xl shadow-2xl text-center max-w-md w-full border-none bg-gradient-to-br from-purple-900 to-green-900">
        <CardContent className="pt-6">
          <div className="mb-10">
            <h1 className="text-5xl font-bold mb-3 text-white">Statify</h1>
            <p className="text-lg text-white/90">Discover your Spotify listening habits</p>
          </div>
          
          {/* Spotify Hand-Drawn Sketchy Logo */}
          <div className="w-24 h-24 mx-auto mb-8">
            <svg className="w-full h-full" viewBox="0 0 168 168" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Circle outline with sketchy, uneven strokes */}
              <path d="M84 8C43.8 6.7 8.9 36.3 8.3 85.2C7.7 134.1 39.4 160.5 83.6 160.5C127.8 160.5 158.8 130.7 159.7 82.9C160.6 35.1 124.2 9.3 84 8Z" 
                stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="10 5" />
              
              {/* Hand-drawn sound waves with marker-like appearance */}
              <path d="M119 120c-3 4-8 5-12 3-18-11-43-14-70-7-3 1-5-1-6-4s1-5 4-6c31-7 58-3 79 9 3 2 8 3 5 5z" 
                stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              
              <path d="M131 96c-2 3-7 5-11 3-21-13-50-17-76-10-4 1-7-1-8-5s2-7 6-8c34-10 67-6 90 9 4 2 3 7 -1 11z" 
                stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              
              <path d="M135 72c-28-16-70-18-96-10-4 1-8-2-9-6s2-8 6-9c30-9 75-7 106 11 4 2 5 7 3 11s-7 5-10 3z" 
                stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          
          <Button 
            className="bg-[#1DB954] hover:bg-[#1DB954]/90 text-white font-bold py-4 px-8 rounded-full w-full transition-all flex items-center justify-center text-base"
            onClick={handleLogin}
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            Log in with Spotify
          </Button>
          
          <div className="mt-6">
            <Separator className="my-4">
              <span className="px-3 text-xs text-white/60">OR</span>
            </Separator>
            
            <Button 
              variant="outline"
              className="w-full border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
              onClick={() => login(true)}
              disabled={isLoading}
            >
              Try Demo Mode
            </Button>
            
            <p className="mt-2 text-xs text-amber-500/80">
              Demo mode uses mock data and limited functionality.
            </p>
          </div>
          
          <p className="mt-8 text-sm text-white/80">
            We'll use your Spotify account to analyze your listening habits and show you personalized stats.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
