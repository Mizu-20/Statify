import { apiRequest } from "./queryClient";
import { SpotifyArtist, SpotifyTrack, TimeRange } from "@shared/schema";
import { mockGenreDistribution, mockRecentlyPlayed, mockTopArtists, mockTopTracks } from "./mockData";

/**
 * Get user's top artists from Spotify
 */
export async function getTopArtists(timeRange: TimeRange, limit = 20) {
  const response = await apiRequest(
    "GET", 
    `/api/me/top/artists?time_range=${timeRange}&limit=${limit}`,
    undefined
  );
  
  return response.json() as Promise<{ items: SpotifyArtist[] }>;
}

/**
 * Get user's top tracks from Spotify
 */
export async function getTopTracks(timeRange: TimeRange, limit = 20) {
  const response = await apiRequest(
    "GET", 
    `/api/me/top/tracks?time_range=${timeRange}&limit=${limit}`,
    undefined
  );
  
  return response.json() as Promise<{ items: SpotifyTrack[] }>;
}

/**
 * Get user's recently played tracks
 */
export async function getRecentlyPlayed(limit = 20) {
  const response = await apiRequest(
    "GET", 
    `/api/me/player/recently-played?limit=${limit}`,
    undefined
  );
  
  return response.json();
}

/**
 * Extract unique genres from top artists and calculate percentages
 */
export function extractGenres(artists: SpotifyArtist[]) {
  const genreCounts: Record<string, number> = {};
  let totalGenres = 0;
  
  artists.forEach(artist => {
    artist.genres.forEach(genre => {
      if (!genreCounts[genre]) {
        genreCounts[genre] = 0;
      }
      genreCounts[genre]++;
      totalGenres++;
    });
  });
  
  return Object.entries(genreCounts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / totalGenres) * 100)
    }))
    .sort((a, b) => b.count - a.count);
}
