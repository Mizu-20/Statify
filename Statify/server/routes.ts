import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";
import { z } from "zod";
import { TimeRange } from "@shared/schema";
import session from 'express-session';
import MemoryStore from 'memorystore';

// For typescript
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    spotifyId?: string;
    authenticated?: boolean;
  }
}

// Define OAuth endpoints
const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_BASE = "https://api.spotify.com/v1";
const SCOPES = [
  "user-read-private", 
  "user-read-email", 
  "user-top-read"
].join(" ");

const timeRangeSchema = z.enum(["short_term", "medium_term", "long_term"]);

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize HTTP server
  const httpServer = createServer(app);
  
  // Set up session middleware
  const SessionMemoryStore = MemoryStore(session);
  app.use(session({
    secret: process.env.SESSION_SECRET || 'spotify-stats-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    store: new SessionMemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    })
  }));
  
  // Route for initiating Spotify OAuth flow
  app.get("/api/auth/login", (req, res) => {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ message: "Spotify client ID not configured" });
    }

    // Get Replit-specific URL or fall back to host header
    const replitUrl = process.env.REPLIT_DOMAINS;
    let redirectUri;
    
    if (replitUrl) {
      // Use first Replit domain (it's a comma-separated list)
      const domain = replitUrl.split(',')[0].trim();
      redirectUri = `https://${domain}/api/auth/callback`;
    } else {
      // Fallback to header-based detection
      const host = req.headers.host || "localhost:5000";
      const protocol = host.includes("localhost") ? "http" : "https";
      redirectUri = `${protocol}://${host}/api/auth/callback`;
    }
    
    console.log("Using redirect URI:", redirectUri);
    
    // Build the authorization URL
    const authUrl = new URL(SPOTIFY_AUTH_URL);
    authUrl.searchParams.append("client_id", clientId);
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("redirect_uri", redirectUri);
    authUrl.searchParams.append("scope", SCOPES);
    authUrl.searchParams.append("show_dialog", "true");
    
    // Redirect user to Spotify authorization page
    res.json({ url: authUrl.toString() });
  });
  
  // Callback route for Spotify OAuth
  app.get("/api/auth/callback", async (req, res) => {
    try {
      const { code } = req.query;
      const clientId = process.env.SPOTIFY_CLIENT_ID;
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
      
      if (!code || !clientId || !clientSecret) {
        throw new Error("Missing code or credentials");
      }
      
      // Use the same redirect URI calculation as in the login route
      const replitUrl = process.env.REPLIT_DOMAINS;
      let redirectUri;
      
      if (replitUrl) {
        // Use first Replit domain (it's a comma-separated list)
        const domain = replitUrl.split(',')[0].trim();
        redirectUri = `https://${domain}/api/auth/callback`;
      } else {
        // Fallback to header-based detection
        const host = req.headers.host || "localhost:5000";
        const protocol = host.includes("localhost") ? "http" : "https";
        redirectUri = `${protocol}://${host}/api/auth/callback`;
      }
      
      console.log("Callback using redirect URI:", redirectUri);
      
      // Exchange code for token
      const tokenResponse = await axios.post(
        SPOTIFY_TOKEN_URL,
        new URLSearchParams({
          code: code.toString(),
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
          },
        }
      );
      
      const { access_token, refresh_token, expires_in } = tokenResponse.data;
      
      // Get user profile
      const profileResponse = await axios.get(`${SPOTIFY_API_BASE}/me`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      
      const profile = profileResponse.data;
      
      // Check if user exists
      let user = await storage.getUserBySpotifyId(profile.id);
      
      const tokenExpiry = Math.floor(Date.now() / 1000) + expires_in;
      
      if (user) {
        // Update user's token
        user = await storage.updateUserToken(
          user.id,
          access_token,
          refresh_token,
          tokenExpiry
        );
      } else {
        // Create new user
        user = await storage.createUser({
          spotifyId: profile.id,
          displayName: profile.display_name,
          email: profile.email,
          accessToken: access_token,
          refreshToken: refresh_token,
          tokenExpiry,
          profileImage: profile.images?.[0]?.url,
          followers: profile.followers?.total || 0,
        });
      }
      
      // Store the user's info in the session
      if (req.session && user) {
        // Use non-null assertions since we've already checked user exists
        req.session.userId = user!.id;
        req.session.spotifyId = user!.spotifyId;
        req.session.authenticated = true;
        
        console.log("Session created for user:", user!.spotifyId);
      }
      
      // Redirect to the frontend
      res.redirect("/");
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.redirect("/?error=auth_failure");
    }
  });
  
  // Logout endpoint
  app.get("/api/auth/logout", (req, res) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Logout error:", err);
          return res.status(500).json({ message: "Error during logout" });
        }
        
        res.json({ success: true, message: "Logged out successfully" });
      });
    } else {
      res.json({ success: true, message: "No active session" });
    }
  });
  
  // Check if user is authenticated
  app.get("/api/auth/me", async (req, res) => {
    try {
      // Use session to check authentication
      if (!req.session || !req.session.authenticated || !req.session.userId) {
        console.log("No valid session found");
        return res.status(401).json({ authenticated: false });
      }
      
      const userId = req.session.userId;
      console.log("Session found for user ID:", userId);
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        console.log("User not found in database");
        return res.status(401).json({ authenticated: false });
      }
      
      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (user.tokenExpiry <= now) {
        console.log("Token expired");
        // In a real app, we'd refresh the token here
        return res.status(401).json({ authenticated: false, reason: "token_expired" });
      }
      
      return res.json({
        authenticated: true,
        user: {
          id: user.id,
          spotifyId: user.spotifyId,
          displayName: user.displayName,
          email: user.email,
          profileImage: user.profileImage,
          followers: user.followers,
        },
      });
    } catch (error) {
      console.error("Auth check error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Get user's top artists
  app.get("/api/me/top/artists", async (req, res) => {
    try {
      const timeRange = req.query.time_range || "medium_term";
      const limit = req.query.limit || "20";
      
      // Validate time range
      const parsedTimeRange = timeRangeSchema.parse(timeRange);
      
      // Get user from session
      if (!req.session || !req.session.authenticated || !req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Call Spotify API
      const response = await axios.get(
        `${SPOTIFY_API_BASE}/me/top/artists`,
        {
          headers: { Authorization: `Bearer ${user.accessToken}` },
          params: {
            time_range: parsedTimeRange,
            limit: parseInt(limit as string, 10),
          },
        }
      );
      
      res.json(response.data);
    } catch (error) {
      console.error("Top artists error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Get user's top tracks
  app.get("/api/me/top/tracks", async (req, res) => {
    try {
      const timeRange = req.query.time_range || "medium_term";
      const limit = req.query.limit || "20";
      
      // Validate time range
      const parsedTimeRange = timeRangeSchema.parse(timeRange);
      
      // Get user from session
      if (!req.session || !req.session.authenticated || !req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Call Spotify API
      const response = await axios.get(
        `${SPOTIFY_API_BASE}/me/top/tracks`,
        {
          headers: { Authorization: `Bearer ${user.accessToken}` },
          params: {
            time_range: parsedTimeRange,
            limit: parseInt(limit as string, 10),
          },
        }
      );
      
      res.json(response.data);
    } catch (error) {
      console.error("Top tracks error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Get user's recently played tracks
  app.get("/api/me/player/recently-played", async (req, res) => {
    try {
      const limit = req.query.limit || "20";
      
      // Get user from session
      if (!req.session || !req.session.authenticated || !req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Call Spotify API
      const response = await axios.get(
        `${SPOTIFY_API_BASE}/me/player/recently-played`,
        {
          headers: { Authorization: `Bearer ${user.accessToken}` },
          params: {
            limit: parseInt(limit as string, 10),
          },
        }
      );
      
      res.json(response.data);
    } catch (error) {
      console.error("Recently played error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  return httpServer;
}
