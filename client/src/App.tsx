import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Home from "@/pages/Dashboard"; // Import Dashboard as Home
import TopArtists from "@/pages/TopArtists";
import TopTracks from "@/pages/TopTracks";
import Genres from "@/pages/Genres";
import Friends from "@/pages/Friends";
import Profile from "@/pages/Profile";
import MoodFeed from "@/pages/MoodFeed";
import { useAuth } from "./context/AuthContext";
import { AuthProvider } from "./context/AuthContext";
import { TimeRangeProvider } from "./context/TimeRangeContext";
import LoadingSpinner from "./components/LoadingSpinner";
import { Suspense, useEffect } from "react";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, login } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  return isAuthenticated ? <>{children}</> : null;
}

function Router() {
  return (
    <Switch>
      <Route path="/login">
        <Login />
      </Route>
      <Route path="/">
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      </Route>
      <Route path="/artists">
        <ProtectedRoute>
          <TopArtists />
        </ProtectedRoute>
      </Route>
      <Route path="/tracks">
        <ProtectedRoute>
          <TopTracks />
        </ProtectedRoute>
      </Route>
      <Route path="/genres">
        <ProtectedRoute>
          <Genres />
        </ProtectedRoute>
      </Route>
      <Route path="/friends">
        <ProtectedRoute>
          <Friends />
        </ProtectedRoute>
      </Route>
      <Route path="/moods">
        <ProtectedRoute>
          <MoodFeed />
        </ProtectedRoute>
      </Route>
      <Route path="/profile/:uniqueId">
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <TimeRangeProvider>
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<LoadingSpinner message="Loading application..." />}>
            <Router />
          </Suspense>
          <Toaster />
        </QueryClientProvider>
      </TimeRangeProvider>
    </AuthProvider>
  );
}

export default App;
