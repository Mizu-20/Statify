import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { useTimeRange } from "../context/TimeRangeContext";
import { SpotifyArtist, TimeRange } from "@shared/schema";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

interface GenreBreakdownSectionProps {
  fullView?: boolean;
  fixedTimeRange?: TimeRange;
}

// Define colors for genres
const genreColors = [
  "bg-pink-600",
  "bg-purple-600",
  "bg-blue-600",
  "bg-green-600", 
  "bg-yellow-600",
  "bg-red-600",
  "bg-indigo-600",
  "bg-teal-600",
  "bg-orange-600",
  "bg-cyan-600"
];

export default function GenreBreakdownSection({ fullView = false, fixedTimeRange }: GenreBreakdownSectionProps) {
  const timeRangeContext = useTimeRange();
  const { user } = useAuth();
  
  // Use fixed time range if provided (for Home page), otherwise use context
  const timeRange = fixedTimeRange || timeRangeContext.timeRange;
  
  // We'll use top artists data to calculate genre breakdown
  const { data, isLoading, error } = useQuery<{ items: SpotifyArtist[] }>({
    queryKey: [`/api/me/top/artists?time_range=${timeRange}&limit=50`, timeRange],
    enabled: !!user,
  });
  
  if (isLoading) {
    return <LoadingSpinner message="Analyzing your genres..." />;
  }
  
  if (error) {
    return (
      <Card className="p-4">
        <p className="text-destructive">Failed to load genre data. Please try again later.</p>
      </Card>
    );
  }
  
  if (!data || data.items.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">No genre data found for this time period.</p>
        <p className="text-sm mt-2">Try selecting a different time range or listening to more music.</p>
      </Card>
    );
  }
  
  // Calculate genre counts from all artist genres
  const genreCounts: Record<string, number> = {};
  let totalGenres = 0;
  
  data.items.forEach(artist => {
    artist.genres.forEach(genre => {
      if (!genreCounts[genre]) {
        genreCounts[genre] = 0;
      }
      genreCounts[genre]++;
      totalGenres++;
    });
  });
  
  // Convert to array and sort by count
  const genreArray = Object.entries(genreCounts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / totalGenres) * 100)
    }))
    .sort((a, b) => b.count - a.count);
  
  // Get top genres (all for full view, or just top 7 for dashboard)
  const topGenres = fullView ? genreArray : genreArray.slice(0, 7);
  const barGenres = genreArray.slice(0, 3); // Just top 3 for the bar visualization
  
  return (
    <section className="mb-8">
      <h3 className="text-lg font-bold mb-4">Your Genre Breakdown</h3>
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            {topGenres.map((genre, index) => (
              <div 
                key={genre.name} 
                className={`${genreColors[index % genreColors.length]} text-white px-3 py-1 rounded-full text-sm font-medium`}
              >
                {genre.name} {genre.percentage}%
              </div>
            ))}
          </div>
          
          {/* Bar Chart Visualization */}
          <div className="mt-6 space-y-3">
            {barGenres.map((genre, index) => (
              <div key={genre.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="capitalize">{genre.name}</span>
                  <span>{genre.percentage}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div 
                    className={`${genreColors[index % genreColors.length]} h-2.5 rounded-full`} 
                    style={{ width: `${genre.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          
          {fullView && genreArray.length > 10 && (
            <div className="mt-8">
              <h3 className="text-xl font-bold mb-4">All Genres</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {genreArray.slice(0, 20).map((genre) => (
                  <div key={genre.name} className="bg-secondary p-3 rounded-md">
                    <div className="font-medium capitalize">{genre.name}</div>
                    <div className="text-sm text-muted-foreground">{genre.percentage}% of your listening</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
