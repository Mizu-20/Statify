import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model for storing Spotify users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  spotifyId: text("spotify_id").notNull().unique(),
  displayName: text("display_name").notNull(),
  email: text("email"),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  tokenExpiry: integer("token_expiry").notNull(),
  profileImage: text("profile_image"),
  followers: integer("followers").default(0),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

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
