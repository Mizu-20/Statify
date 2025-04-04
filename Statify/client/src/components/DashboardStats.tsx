import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { SpotifyTrack, SpotifyArtist } from "@shared/schema";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

export default function DashboardStats() {
  const { user } = useAuth();
  
  // Always use long_term (all-time) data for the Home page
  const timeRange = 'long_term';
  
  // Get top tracks to calculate minutes listened
  const { data: tracksData, isLoading: tracksLoading, error: tracksError } = useQuery<{ items: SpotifyTrack[] }>({
    queryKey: [`/api/me/top/tracks?time_range=${timeRange}&limit=50`, timeRange],
    enabled: !!user,
  });
  
  // Get top artists to calculate top genre
  const { data: artistsData, isLoading: artistsLoading, error: artistsError } = useQuery<{ items: SpotifyArtist[] }>({
    queryKey: [`/api/me/top/artists?time_range=${timeRange}&limit=50`, timeRange],
    enabled: !!user,
  });
  
  if (tracksLoading || artistsLoading) {
    return <LoadingSpinner message="Calculating your stats..." />;
  }
  
  if (tracksError || artistsError) {
    return (
      <Card className="p-4 mb-8">
        <p className="text-destructive">Failed to load stats. Please try again later.</p>
      </Card>
    );
  }
  
  if (!tracksData || !artistsData || tracksData.items.length === 0 || artistsData.items.length === 0) {
    return (
      <Card className="p-6 text-center mb-8">
        <p className="text-muted-foreground">No listening data found.</p>
        <p className="text-sm mt-2">Try listening to more music on Spotify.</p>
      </Card>
    );
  }
  
  // Calculate total minutes listened (estimate based on track durations and multiplier)
  const tracksPlayed = tracksData.items.length;
  let totalMinutesListened = 0;
  
  tracksData.items.forEach(track => {
    totalMinutesListened += track.duration_ms / 60000;
  });
  
  // Apply a multiplier to estimate repeated listens
  const listeningMultiplier = 20; // Assume each track is listened to multiple times
  totalMinutesListened = Math.round(totalMinutesListened * listeningMultiplier);
  
  // Convert minutes to hours and days for display
  const hours = Math.floor(totalMinutesListened / 60);
  const days = Math.floor(hours / 24);
  
  // Calculate top genre
  const genreCounts: Record<string, number> = {};
  let topGenre = { name: 'Unknown', count: 0 };
  let totalGenres = 0;
  
  artistsData.items.forEach(artist => {
    artist.genres.forEach(genre => {
      if (!genreCounts[genre]) {
        genreCounts[genre] = 0;
      }
      genreCounts[genre]++;
      totalGenres++;
      
      if (genreCounts[genre] > topGenre.count) {
        topGenre = { name: genre, count: genreCounts[genre] };
      }
    });
  });
  
  const topGenrePercentage = Math.round((topGenre.count / totalGenres) * 100);
  
  // Count unique artists
  const uniqueArtistsCount = new Set(
    artistsData.items.map(artist => artist.id)
  ).size;
  
  return (
    <section className="mb-10">
      <h2 className="text-2xl font-bold mb-5 text-center">Your All-Time Listening Stats</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Minutes Stat */}
        <div className="bg-card rounded-xl p-5 flex flex-col border border-border/30 shadow-lg hover:shadow-xl transition-all hover:border-primary/30 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground text-sm font-medium">Listening Time</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <span className="text-4xl font-bold mt-2">{days} days</span>
          <span className="text-muted-foreground text-sm mt-3">{hours.toLocaleString()} hours of music</span>
          <div className="mt-4 h-1 w-full bg-secondary/50 rounded-full overflow-hidden">
            <div className="bg-primary h-full" style={{ width: `${Math.min(days/30 * 100, 100)}%` }}></div>
          </div>
        </div>
        
        {/* Tracks Count Stat */}
        <div className="bg-card rounded-xl p-5 flex flex-col border border-border/30 shadow-lg hover:shadow-xl transition-all hover:border-primary/30 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground text-sm font-medium">Tracks Played</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13"></path>
              <circle cx="6" cy="18" r="3"></circle>
              <circle cx="18" cy="16" r="3"></circle>
            </svg>
          </div>
          <span className="text-4xl font-bold mt-2">{(tracksPlayed * listeningMultiplier).toLocaleString()}</span>
          <span className="text-muted-foreground text-sm mt-3">Estimated from your top tracks</span>
          <div className="mt-4 h-1 w-full bg-secondary/50 rounded-full overflow-hidden">
            <div className="bg-primary h-full" style={{ width: `${Math.min((tracksPlayed * listeningMultiplier)/1000 * 100, 100)}%` }}></div>
          </div>
        </div>
        
        {/* Top Genre Stat */}
        <div className="bg-card rounded-xl p-5 flex flex-col border border-border/30 shadow-lg hover:shadow-xl transition-all hover:border-primary/30 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground text-sm font-medium">Top Genre</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"></path>
            </svg>
          </div>
          <span className="text-4xl font-bold mt-2 capitalize">{topGenre.name}</span>
          <span className="text-muted-foreground text-sm mt-3">{topGenrePercentage}% of your listening</span>
          <div className="mt-4 h-1 w-full bg-secondary/50 rounded-full overflow-hidden">
            <div className="bg-primary h-full" style={{ width: `${topGenrePercentage}%` }}></div>
          </div>
        </div>
        
        {/* Artists Count */}
        <div className="bg-card rounded-xl p-5 flex flex-col border border-border/30 shadow-lg hover:shadow-xl transition-all hover:border-primary/30 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground text-sm font-medium">Unique Artists</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <span className="text-4xl font-bold mt-2">{uniqueArtistsCount}</span>
          <span className="text-muted-foreground text-sm mt-3">Artists you've enjoyed</span>
          <div className="mt-4 h-1 w-full bg-secondary/50 rounded-full overflow-hidden">
            <div className="bg-primary h-full" style={{ width: `${Math.min(uniqueArtistsCount/50 * 100, 100)}%` }}></div>
          </div>
        </div>
      </div>
    </section>
  );
}
