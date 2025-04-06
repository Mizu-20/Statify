import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { SpotifyTrack } from '@shared/schema';
import { useQueryClient } from '@tanstack/react-query';
import LoadingSpinner from './LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { mockTopTracks } from '@/lib/mockData';

interface SearchResults {
  tracks: {
    items: SpotifyTrack[];
  }
}

export default function CreateMoodPost() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isDemoUser } = useAuth();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    try {
      if (isDemoUser) {
        // For demo users, filter mock tracks that match the search query
        const filteredTracks = mockTopTracks.filter(track => 
          track.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          track.artists.some(artist => artist.name.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        
        // Simulate API delay
        setTimeout(() => {
          setSearchResults(filteredTracks);
          setIsSearching(false);
        }, 500);
        return;
      }
      
      // For real users, search the Spotify API
      const response = await apiRequest(
        "GET",
        `/api/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=5`,
        undefined
      );
      
      const data = await response.json() as SearchResults;
      setSearchResults(data.tracks.items);
    } catch (error) {
      toast({
        title: "Search Failed",
        description: "Could not search for tracks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectTrack = (track: SpotifyTrack) => {
    setSelectedTrack(track);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleSubmit = async () => {
    if (!selectedTrack) {
      toast({
        title: "No Track Selected",
        description: "Please select a track for your mood post.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const payload = {
        trackId: selectedTrack.id,
        trackName: selectedTrack.name,
        artistName: selectedTrack.artists.map(a => a.name).join(', '),
        albumCover: selectedTrack.album.images[0]?.url || null,
        note: note.trim() || null,
        startTimeMs: 0, // Default to start of track
      };
      
      if (isDemoUser) {
        // For demo users, simulate a successful post
        setTimeout(() => {
          toast({
            title: "Mood Post Created",
            description: "Your mood post has been shared with your friends!",
          });
          
          // Reset the form
          setSelectedTrack(null);
          setNote('');
          setIsSubmitting(false);
          
          // Refresh the mood posts list
          queryClient.invalidateQueries({ queryKey: ['/api/mood-posts'] });
          queryClient.invalidateQueries({ queryKey: ['/api/friends/mood-posts'] });
        }, 700);
        return;
      }
      
      // For real users, make the API request
      await apiRequest("POST", "/api/mood-posts", payload);
      
      toast({
        title: "Mood Post Created",
        description: "Your mood post has been shared with your friends!",
      });
      
      // Reset the form
      setSelectedTrack(null);
      setNote('');
      
      // Refresh the mood posts list
      queryClient.invalidateQueries({ queryKey: ['/api/mood-posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/friends/mood-posts'] });
    } catch (error) {
      toast({
        title: "Failed to Create Post",
        description: "There was an error creating your mood post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-5">
      <h2 className="text-xl font-bold mb-4">Share Your Current Mood</h2>
      
      {/* Track selection section */}
      {!selectedTrack ? (
        <div className="mb-4">
          <div className="flex gap-2 mb-3">
            <Input
              placeholder="Search for a song..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? <LoadingSpinner message="" /> : 'Search'}
            </Button>
          </div>
          
          {isSearching ? (
            <div className="py-8 text-center">
              <LoadingSpinner message="Searching tracks..." />
            </div>
          ) : (
            searchResults.length > 0 && (
              <div className="bg-card border rounded-md overflow-hidden">
                <div className="text-sm text-muted-foreground p-2 border-b">
                  Select a track for your mood post:
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {searchResults.map(track => (
                    <div
                      key={track.id}
                      className="flex items-center gap-3 p-3 hover:bg-secondary cursor-pointer border-b last:border-b-0"
                      onClick={() => handleSelectTrack(track)}
                    >
                      <img
                        src={track.album.images[0]?.url || ''}
                        alt={track.album.name}
                        className="w-12 h-12 object-cover"
                      />
                      <div>
                        <div className="font-medium">{track.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {track.artists.map(a => a.name).join(', ')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      ) : (
        <div className="mb-4">
          <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg mb-3">
            <img
              src={selectedTrack.album.images[0]?.url || ''}
              alt={selectedTrack.album.name}
              className="w-14 h-14 object-cover rounded-md"
            />
            <div className="flex-1">
              <div className="font-medium">{selectedTrack.name}</div>
              <div className="text-sm text-muted-foreground">
                {selectedTrack.artists.map(a => a.name).join(', ')}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTrack(null)}
            >
              Change
            </Button>
          </div>
        </div>
      )}
      
      {/* Note textarea */}
      <div className="mb-4">
        <Textarea
          placeholder="Add a note about this song... (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="resize-none"
          rows={3}
        />
      </div>
      
      {/* Submit button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!selectedTrack || isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? <LoadingSpinner message="Posting..." /> : 'Share Mood'}
        </Button>
      </div>
    </Card>
  );
}