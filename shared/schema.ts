import { pgTable, text, serial, integer, boolean, jsonb, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { customAlphabet } from 'nanoid';

// Generate a random ID with capital letters and numbers only
const generateUniqueId = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);

// User model for storing Spotify users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uniqueId: text("unique_id").notNull().unique().$defaultFn(() => generateUniqueId()),
  spotifyId: text("spotify_id").notNull().unique(),
  displayName: text("display_name").notNull(),
  email: text("email"),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  tokenExpiry: integer("token_expiry").notNull(),
  profileImage: text("profile_image"),
  followers: integer("followers").default(0),
  bio: text("bio"),
});

// Friend requests between users
export const friendRequests = pgTable("friend_requests", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Friendships between users (after a request is accepted)
export const friendships = pgTable("friendships", {
  userId: integer("user_id").notNull().references(() => users.id),
  friendId: integer("friend_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  pk: primaryKey({columns: [t.userId, t.friendId]})
}));

// Mood posts with songs and notes
export const moodPosts = pgTable("mood_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  trackId: text("track_id").notNull(), // Spotify track ID
  trackName: text("track_name").notNull(),
  artistName: text("artist_name").notNull(),
  albumCover: text("album_cover"),
  note: text("note"),
  startTimeMs: integer("start_time_ms").default(0), // Start time for 30-second clip
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  uniqueId: true,
});

export const insertFriendRequestSchema = createInsertSchema(friendRequests).omit({
  id: true, 
  createdAt: true,
  updatedAt: true,
});

export const insertFriendshipSchema = createInsertSchema(friendships).omit({
  createdAt: true,
});

export const insertMoodPostSchema = createInsertSchema(moodPosts).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertFriendRequest = z.infer<typeof insertFriendRequestSchema>;
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type InsertMoodPost = z.infer<typeof insertMoodPostSchema>;

export type User = typeof users.$inferSelect;
export type FriendRequest = typeof friendRequests.$inferSelect;
export type Friendship = typeof friendships.$inferSelect;
export type MoodPost = typeof moodPosts.$inferSelect;

// Spotify specific types for client-side use
export interface SpotifyProfile {
  id: string;
  display_name: string;
  email: string;
  followers: { total: number };
  images: Array<{ url: string }>;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  album: {
    name: string;
    images: Array<{ url: string }>;
  };
  artists: Array<{
    id: string;
    name: string;
  }>;
  duration_ms: number;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images: Array<{ url: string }>;
  genres: string[];
  followers: { total: number };
}

export type TimeRange = 'short_term' | 'medium_term' | 'long_term';
