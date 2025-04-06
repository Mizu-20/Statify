import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { useTimeRange } from "../context/TimeRangeContext";
import { Link } from "wouter";
import { SpotifyArtist } from "@shared/schema";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";
import { mockTopArtists } from "@/lib/mockData";

interface TopArtistsSectionProps {
  limit?: number;
  showViewAll?: boolean;
}

export default function TopArtistsSection({ 
  limit = 5, 
  showViewAll = true 
}: TopArtistsSectionProps) {
  const { timeRange } = useTimeRange();
  const { user, isDemoUser } = useAuth();
  
  const { data, isLoading, error } = useQuery<{ items: SpotifyArtist[] }>({
    queryKey: [`/api/me/top/artists?time_range=${timeRange}&limit=${limit}`, timeRange],
    enabled: !!user && !isDemoUser,
  });
  
  // Return mock data for demo mode
  if (isDemoUser) {
    // Simulate different data based on time range
    const mockArtistsByTimeRange = {
      short_term: mockTopArtists.slice(0, limit),
      medium_term: [...mockTopArtists.slice(5, 7), ...mockTopArtists.slice(0, 3)].slice(0, limit),
      long_term: [...mockTopArtists.slice(7, 10), ...mockTopArtists.slice(2, 4)].slice(0, limit)
    };
    
    return (
      <section className="mb-8">
        {showViewAll && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Your Top Artists</h2>
            <Link href="/artists">
              <a className="text-primary hover:text-primary/80 text-sm font-medium">See All</a>
            </Link>
          </div>
        )}
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {mockArtistsByTimeRange[timeRange].map((artist) => (
            <div key={artist.id} className="bg-card rounded-lg p-4 transition-all duration-300 card-hover">
              <div className="aspect-square mb-3">
                {artist.images && artist.images.length > 0 ? (
                  <img 
                    src={artist.images[0].url} 
                    alt={artist.name} 
                    className="w-full h-full object-cover rounded-md"
                  />
                ) : (
                  <div className="w-full h-full bg-secondary rounded-md flex items-center justify-center">
                    <span className="text-2xl">{artist.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              <h3 className="font-bold truncate">{artist.name}</h3>
              <p className="text-muted-foreground text-sm">Artist</p>
            </div>
          ))}
        </div>
      </section>
    );
  }
  
  if (isLoading) {
    return <LoadingSpinner message="Loading your top artists..." />;
  }
  
  if (error) {
    return (
      <Card className="p-4">
        <p className="text-destructive">Failed to load artists. Please try again later.</p>
      </Card>
    );
  }
  
  if (!data || data.items.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">No artist data found for this time period.</p>
        <p className="text-sm mt-2">Try selecting a different time range or listening to more music.</p>
      </Card>
    );
  }
  
  return (
    <section className="mb-8">
      {showViewAll && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Your Top Artists</h2>
          <Link href="/artists">
            <a className="text-primary hover:text-primary/80 text-sm font-medium">See All</a>
          </Link>
        </div>
      )}
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {data.items.map((artist) => (
          <div key={artist.id} className="bg-card rounded-lg p-4 transition-all duration-300 card-hover">
            <div className="aspect-square mb-3">
              {artist.images && artist.images.length > 0 ? (
                <img 
                  src={artist.images[0].url} 
                  alt={artist.name} 
                  className="w-full h-full object-cover rounded-md"
                />
              ) : (
                <div className="w-full h-full bg-secondary rounded-md flex items-center justify-center">
                  <span className="text-2xl">{artist.name.charAt(0)}</span>
                </div>
              )}
            </div>
            <h3 className="font-bold truncate">{artist.name}</h3>
            <p className="text-muted-foreground text-sm">Artist</p>
          </div>
        ))}
      </div>
    </section>
  );
}
