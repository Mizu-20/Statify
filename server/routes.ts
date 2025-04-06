import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";
import { z } from "zod";
import { TimeRange, insertFriendRequestSchema, insertFriendshipSchema, insertMoodPostSchema } from "@shared/schema";
import session from "express-session";
import MemoryStore from "memorystore";
import { WebSocketServer, WebSocket } from "ws";

// For typescript
declare module "express-session" {
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
const SCOPES = ["user-read-private", "user-read-email", "user-top-read"].join(
  " ",
);

const timeRangeSchema = z.enum(["short_term", "medium_term", "long_term"]);

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize HTTP server
  const httpServer = createServer(app);

  // Set up session middleware
  const SessionMemoryStore = MemoryStore(session);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "spotify-stats-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
      store: new SessionMemoryStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
    }),
  );

  // Route for initiating Spotify OAuth flow
  app.get("/api/auth/login", (req, res) => {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    if (!clientId) {
      return res
        .status(500)
        .json({ message: "Spotify client ID not configured" });
    }

    // Get Replit-specific URL
    // For Spotify OAuth to work, this URL must be EXACTLY the same as registered in Spotify Developer Dashboard
    const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
    console.log("Using redirect URI:", redirectUri);

    // Build the authorization URL
    const authUrl = new URL(SPOTIFY_AUTH_URL);
    authUrl.searchParams.append("client_id", clientId);
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("redirect_uri", redirectUri);
    authUrl.searchParams.append("scope", SCOPES);
    authUrl.searchParams.append("show_dialog", "true");

    // Return the authorization URL
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
      // For Spotify OAuth to work, this URL must be EXACTLY the same as registered in Spotify Developer Dashboard
      const replitUrl = process.env.REPLIT_DOMAINS;
      let redirectUri;

      // Replacing all the redirectUri logic with this
      redirectUri = process.env.SPOTIFY_REDIRECT_URI!;
      console.log("Using static redirect URI:", redirectUri);

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
        },
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
          tokenExpiry,
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
        return res
          .status(401)
          .json({ authenticated: false, reason: "token_expired" });
      }

      return res.json({
        authenticated: true,
        user: {
          id: user.id,
          spotifyId: user.spotifyId,
          uniqueId: user.uniqueId,
          displayName: user.displayName,
          email: user.email,
          profileImage: user.profileImage,
          followers: user.followers,
          bio: user.bio,
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
      const response = await axios.get(`${SPOTIFY_API_BASE}/me/top/artists`, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
        params: {
          time_range: parsedTimeRange,
          limit: parseInt(limit as string, 10),
        },
      });

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
      const response = await axios.get(`${SPOTIFY_API_BASE}/me/top/tracks`, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
        params: {
          time_range: parsedTimeRange,
          limit: parseInt(limit as string, 10),
        },
      });

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
        },
      );

      res.json(response.data);
    } catch (error) {
      console.error("Recently played error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Middleware to check if user is authenticated
  const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session || !req.session.authenticated || !req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    // Attach user object to req for convenience
    (req as any).user = user;
    next();
  };

  // User currently playing track
  app.get("/api/me/player/currently-playing", authenticateUser, async (req, res) => {
    try {
      const user = (req as any).user;
      
      // Call Spotify API
      try {
        const response = await axios.get(
          `${SPOTIFY_API_BASE}/me/player/currently-playing`,
          {
            headers: { Authorization: `Bearer ${user.accessToken}` }
          }
        );
        
        res.json(response.data);
      } catch (error: any) {
        // If the user is not playing anything, Spotify returns 204 No Content
        if (error.response && error.response.status === 204) {
          return res.json(null);
        }
        throw error;
      }
    } catch (error) {
      console.error("Currently playing error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Update user profile
  app.patch("/api/me/profile", authenticateUser, async (req, res) => {
    try {
      const user = (req as any).user;
      const { bio } = req.body;
      
      if (typeof bio !== "string") {
        return res.status(400).json({ message: "Invalid bio format" });
      }
      
      const updatedUser = await storage.updateUserProfile(user.id, bio);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        id: updatedUser.id,
        uniqueId: updatedUser.uniqueId,
        displayName: updatedUser.displayName,
        bio: updatedUser.bio,
        profileImage: updatedUser.profileImage
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Search for users
  app.get("/api/users/search", authenticateUser, async (req, res) => {
    try {
      const query = req.query.q as string;
      
      if (!query || query.length < 2) {
        return res.status(400).json({ message: "Search query too short" });
      }
      
      const users = await storage.searchUsers(query);
      
      // Remove current user and sensitive info from results
      const currentUserId = (req as any).user.id;
      const filteredUsers = users
        .filter(user => user.id !== currentUserId)
        .map(user => ({
          id: user.id,
          uniqueId: user.uniqueId,
          displayName: user.displayName,
          profileImage: user.profileImage,
          bio: user.bio
        }));
      
      res.json(filteredUsers);
    } catch (error) {
      console.error("Search users error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get user by uniqueId
  app.get("/api/users/:uniqueId", authenticateUser, async (req, res) => {
    try {
      const { uniqueId } = req.params;
      const user = await storage.getUserByUniqueId(uniqueId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get friendship status if it exists
      const currentUserId = (req as any).user.id;
      const friendRequests = await storage.getFriendRequestsByUser(currentUserId);
      const sentRequest = friendRequests.find(r => 
        (r.senderId === currentUserId && r.receiverId === user.id) ||
        (r.senderId === user.id && r.receiverId === currentUserId)
      );
      
      const friends = await storage.getFriends(currentUserId);
      const isFriend = friends.some(f => f.id === user.id);
      
      // Return user info with friendship status
      res.json({
        id: user.id,
        uniqueId: user.uniqueId,
        displayName: user.displayName,
        profileImage: user.profileImage,
        bio: user.bio,
        friendshipStatus: isFriend ? "friends" : 
                         sentRequest ? sentRequest.status : 
                         "none"
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Send friend request
  app.post("/api/friends/requests", authenticateUser, async (req, res) => {
    try {
      const senderId = (req as any).user.id;
      const { receiverUniqueId } = req.body;
      
      if (!receiverUniqueId) {
        return res.status(400).json({ message: "Receiver ID is required" });
      }
      
      // Find receiver by uniqueId
      const receiver = await storage.getUserByUniqueId(receiverUniqueId);
      if (!receiver) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if they are already friends
      const friends = await storage.getFriends(senderId);
      if (friends.some(f => f.id === receiver.id)) {
        return res.status(400).json({ message: "Already friends with this user" });
      }
      
      // Check if a friend request already exists
      const existingRequests = await storage.getFriendRequestsByUser(senderId);
      const existingRequest = existingRequests.find(r => 
        (r.senderId === senderId && r.receiverId === receiver.id) ||
        (r.senderId === receiver.id && r.receiverId === senderId)
      );
      
      if (existingRequest) {
        if (existingRequest.status === "pending") {
          return res.status(400).json({ message: "Friend request already sent or received" });
        } else if (existingRequest.status === "accepted") {
          return res.status(400).json({ message: "Already friends with this user" });
        }
      }
      
      // Parse request data
      const data = insertFriendRequestSchema.parse({
        senderId,
        receiverId: receiver.id,
        status: "pending"
      });
      
      // Create friend request
      const request = await storage.createFriendRequest(data);
      
      res.status(201).json(request);
    } catch (error) {
      console.error("Send friend request error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get friend requests
  app.get("/api/friends/requests", authenticateUser, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const status = req.query.status as string || "pending";
      
      const requests = await storage.getFriendRequestsByUser(userId, status);
      
      // Fetch user details for each request
      const enrichedRequests = await Promise.all(
        requests.map(async request => {
          const otherUserId = request.senderId === userId ? request.receiverId : request.senderId;
          const otherUser = await storage.getUser(otherUserId);
          
          return {
            id: request.id,
            status: request.status,
            createdAt: request.createdAt,
            isSender: request.senderId === userId,
            user: otherUser ? {
              id: otherUser.id,
              uniqueId: otherUser.uniqueId,
              displayName: otherUser.displayName,
              profileImage: otherUser.profileImage
            } : null
          };
        })
      );
      
      res.json(enrichedRequests);
    } catch (error) {
      console.error("Get friend requests error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Respond to friend request
  app.patch("/api/friends/requests/:id", authenticateUser, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status || !["accepted", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      // Find the request
      const request = await storage.getFriendRequest(parseInt(id, 10));
      if (!request) {
        return res.status(404).json({ message: "Friend request not found" });
      }
      
      // Check if user is the receiver
      const userId = (req as any).user.id;
      if (request.receiverId !== userId) {
        return res.status(403).json({ message: "Not authorized to accept this request" });
      }
      
      // Update request status
      const updatedRequest = await storage.updateFriendRequestStatus(request.id, status);
      
      // If accepted, create friendship
      if (status === "accepted") {
        await storage.createFriendship({
          userId: request.receiverId,
          friendId: request.senderId
        });
      }
      
      res.json(updatedRequest);
    } catch (error) {
      console.error("Respond to friend request error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get friends
  app.get("/api/friends", authenticateUser, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const friends = await storage.getFriends(userId);
      
      // Remove sensitive information
      const sanitizedFriends = friends.map(friend => ({
        id: friend.id,
        uniqueId: friend.uniqueId,
        displayName: friend.displayName,
        profileImage: friend.profileImage,
        bio: friend.bio
      }));
      
      res.json(sanitizedFriends);
    } catch (error) {
      console.error("Get friends error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Remove friend
  app.delete("/api/friends/:friendId", authenticateUser, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const friendId = parseInt(req.params.friendId, 10);
      
      // Delete friendship
      const success = await storage.deleteFriendship(userId, friendId);
      
      if (!success) {
        return res.status(404).json({ message: "Friendship not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Remove friend error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Create mood post
  app.post("/api/mood-posts", authenticateUser, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { trackId, trackName, artistName, albumCover, note, startTimeMs } = req.body;
      
      // Validate mood post data
      const data = insertMoodPostSchema.parse({
        userId,
        trackId,
        trackName,
        artistName,
        albumCover,
        note,
        startTimeMs: startTimeMs || 0
      });
      
      // Create mood post
      const post = await storage.createMoodPost(data);
      
      res.status(201).json(post);
    } catch (error) {
      console.error("Create mood post error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get user's mood posts
  app.get("/api/users/:uniqueId/mood-posts", authenticateUser, async (req, res) => {
    try {
      const { uniqueId } = req.params;
      
      // Find user by uniqueId
      const user = await storage.getUserByUniqueId(uniqueId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get user's mood posts
      const posts = await storage.getUserMoodPosts(user.id);
      
      res.json(posts);
    } catch (error) {
      console.error("Get user mood posts error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get friends' mood posts
  app.get("/api/friends/mood-posts", authenticateUser, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      
      // Get mood posts from friends
      const posts = await storage.getFriendsMoodPosts(userId);
      
      // Enrich posts with user details
      const enrichedPosts = await Promise.all(
        posts.map(async post => {
          const user = await storage.getUser(post.userId);
          
          return {
            ...post,
            user: user ? {
              id: user.id,
              uniqueId: user.uniqueId,
              displayName: user.displayName,
              profileImage: user.profileImage
            } : null
          };
        })
      );
      
      res.json(enrichedPosts);
    } catch (error) {
      console.error("Get friends mood posts error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Delete mood post
  app.delete("/api/mood-posts/:id", authenticateUser, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const postId = parseInt(req.params.id, 10);
      
      // Find the post
      const post = await storage.getMoodPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Mood post not found" });
      }
      
      // Check if user owns the post
      if (post.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this post" });
      }
      
      // Delete the post
      const success = await storage.deleteMoodPost(postId);
      
      if (!success) {
        return res.status(404).json({ message: "Mood post not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Delete mood post error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Set up WebSocket server for real-time updates
  // Use a separate server for WebSockets to avoid conflicts with Vite
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/api/ws'  // Use a specific path to avoid conflicts with Vite
  });
  
  // Store connections by user ID
  const connections = new Map<number, WebSocket>();
  
  // Track user IDs for each WebSocket connection
  const userSocketMap = new WeakMap<WebSocket, number>();
  
  // Handle errors at the WebSocketServer level
  wss.on('error', (error) => {
    console.error('WebSocket Server Error:', error);
  });
  
  wss.on('connection', (ws, req) => {
    console.log('WebSocket connection established');
    
    // Send initial connection confirmation
    try {
      ws.send(JSON.stringify({ type: 'connection_established' }));
    } catch (error) {
      console.error('Error sending initial message:', error);
    }
    
    // Set up error handler for this connection
    ws.on('error', (error) => {
      console.error('WebSocket connection error:', error);
    });
    
    // Extract session ID from URL or headers
    try {
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const sessionId = url.searchParams.get('sessionId');
      
      // Anonymous connection, continue but don't store
      if (!sessionId) {
        console.log('Anonymous WebSocket connection, no sessionId provided');
        return;
      }
    } catch (error) {
      console.error('Error parsing WebSocket URL:', error);
    }
    
    // Set up message handler
    ws.on('message', async (message: any) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('WebSocket message received:', data.type);
        
        // Handle different message types
        if (data.type === 'auth') {
          // Authenticate user
          const user = await storage.getUserBySpotifyId(data.spotifyId);
          if (user) {
            connections.set(user.id, ws);
            userSocketMap.set(ws, user.id);
            
            // Send confirmation
            ws.send(JSON.stringify({
              type: 'auth_success',
              userId: user.id
            }));
            console.log('User authenticated via WebSocket:', user.id);
          } else {
            console.log('User not found for WebSocket auth:', data.spotifyId);
          }
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      console.log('WebSocket connection closed');
      try {
        const userId = userSocketMap.get(ws);
        if (userId) {
          connections.delete(userId);
          console.log('User disconnected from WebSocket:', userId);
        }
      } catch (error) {
        console.error('Error handling WebSocket closure:', error);
      }
    });
  });

  return httpServer;
}
