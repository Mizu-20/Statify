import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "../lib/queryClient";

interface User {
  id: number;
  spotifyId: string;
  uniqueId: string;
  displayName: string;
  email?: string;
  profileImage?: string;
  followers?: number;
  bio?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  isDemoUser: boolean;
  login: (asDemoUser?: boolean) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [isDemoUser, setIsDemoUser] = useState<boolean>(false);
  
  useEffect(() => {
    checkAuth();
  }, []);
  
  const checkAuth = async () => {
    try {
      setIsLoading(true);
      // No need for custom headers - session cookie will be sent automatically
      const response = await fetch("/api/auth/me");
      
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setIsAuthenticated(true);
          setUser(data.user);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  const login = async (asDemoUser: boolean = false) => {
    if (asDemoUser) {
      // Create a mock demo user
      const demoUser: User = {
        id: 0,
        spotifyId: 'demo-user',
        uniqueId: 'DEMO1234',
        displayName: 'Demo User',
        profileImage: 'https://i.imgur.com/8Km9tLL.png',
        followers: 123,
        bio: 'This is a demo account. All data is simulated.'
      };
      
      setUser(demoUser);
      setIsAuthenticated(true);
      setIsDemoUser(true);
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await apiRequest("GET", "/api/auth/login", undefined);
      const data = await response.json();
      window.location.href = data.url;
    } catch (error) {
      console.error("Login error:", error);
    }
  };
  
  const logout = async () => {
    // Reset the demo mode and user
    setIsDemoUser(false);
    setIsAuthenticated(false);
    setUser(null);
    
    try {
      // For regular users, call the logout endpoint to destroy the session
      if (!isDemoUser) {
        await fetch("/api/auth/logout");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  
  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, isDemoUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
