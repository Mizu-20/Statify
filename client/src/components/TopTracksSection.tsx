import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { useTimeRange } from "../context/TimeRangeContext";
import { Link } from "wouter";
import { SpotifyTrack } from "@shared/schema";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";
import { mockTopTracks } from "@/lib/mockData";

interface TopTracksSectionProps {
  limit?: number;
  showViewAll?: boolean;
}

// Format milliseconds to minutes:seconds
const formatDuration = (ms: number) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export default function TopTracksSection({ 
  limit = 5, 
  showViewAll = true 
}: TopTracksSectionProps) {
  const { timeRange } = useTimeRange();
  const { user, isDemoUser } = useAuth();
  
  const { data, isLoading, error } = useQuery<{ items: SpotifyTrack[] }>({
    queryKey: [`/api/me/top/tracks?time_range=${timeRange}&limit=${limit}`, timeRange],
    enabled: !!user && !isDemoUser,
  });
  
  // Return mock data for demo mode
  if (isDemoUser) {
    // Simulate different data based on time range
    const mockTracksByTimeRange = {
      short_term: mockTopTracks.slice(0, limit),
      medium_term: [...mockTopTracks.slice(5, 8), ...mockTopTracks.slice(0, 2)].slice(0, limit),
      long_term: [...mockTopTracks.slice(7, 10), ...mockTopTracks.slice(3, 5)].slice(0, limit)
    };
    
    return (
      <section className="mb-8">
        {showViewAll && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Your Top Tracks</h2>
            <Link href="/tracks">
              <a className="text-primary hover:text-primary/80 text-sm font-medium">See All</a>
            </Link>
          </div>
        )}
        
        <div className="bg-card rounded-lg overflow-hidden">
          {/* Header Row */}
          <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_auto_auto] gap-4 px-4 py-2 border-b border-border text-muted-foreground text-sm font-medium">
            <div className="w-8 text-center">#</div>
            <div>TITLE</div>
            <div className="hidden md:block">ALBUM</div>
            <div className="text-right pr-2">DURATION</div>
          </div>
          
          {/* Track List */}
          <div className="divide-y divide-border/30">
            {mockTracksByTimeRange[timeRange].map((track, index) => (
              <div key={track.id} className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_auto_auto] gap-4 px-4 py-3 hover:bg-secondary items-center">
                <div className="w-8 text-center text-muted-foreground">{index + 1}</div>
                <div className="flex items-center">
                  <img 
                    src={track.album.images[0]?.url || ''} 
                    alt={track.album.name} 
                    className="w-10 h-10 mr-3"
                  />
                  <div>
                    <div className="font-medium">{track.name}</div>
                    <div className="text-sm text-muted-foreground">{track.artists.map(a => a.name).join(', ')}</div>
                  </div>
                </div>
                <div className="hidden md:block text-muted-foreground truncate">{track.album.name}</div>
                <div className="text-muted-foreground text-right">{formatDuration(track.duration_ms)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
  
  if (isLoading) {
    return <LoadingSpinner message="Loading your top tracks..." />;
  }
  
  if (error) {
    return (
      <Card className="p-4">
        <p className="text-destructive">Failed to load tracks. Please try again later.</p>
      </Card>
    );
  }
  
  if (!data || data.items.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">No track data found for this time period.</p>
        <p className="text-sm mt-2">Try selecting a different time range or listening to more music.</p>
      </Card>
    );
  }
  
  return (
    <section className="mb-8">
      {showViewAll && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Your Top Tracks</h2>
          <Link href="/tracks">
            <a className="text-primary hover:text-primary/80 text-sm font-medium">See All</a>
          </Link>
        </div>
      )}
      
      <div className="bg-card rounded-lg overflow-hidden">
        {/* Header Row */}
        <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_auto_auto] gap-4 px-4 py-2 border-b border-border text-muted-foreground text-sm font-medium">
          <div className="w-8 text-center">#</div>
          <div>TITLE</div>
          <div className="hidden md:block">ALBUM</div>
          <div className="text-right pr-2">DURATION</div>
        </div>
        
        {/* Track List */}
        <div className="divide-y divide-border/30">
          {data.items.map((track, index) => (
            <div key={track.id} className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_auto_auto] gap-4 px-4 py-3 hover:bg-secondary items-center">
              <div className="w-8 text-center text-muted-foreground">{index + 1}</div>
              <div className="flex items-center">
                <img 
                  src={track.album.images[0]?.url || ''} 
                  alt={track.album.name} 
                  className="w-10 h-10 mr-3"
                />
                <div>
                  <div className="font-medium">{track.name}</div>
                  <div className="text-sm text-muted-foreground">{track.artists.map(a => a.name).join(', ')}</div>
                </div>
              </div>
              <div className="hidden md:block text-muted-foreground truncate">{track.album.name}</div>
              <div className="text-muted-foreground text-right">{formatDuration(track.duration_ms)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
