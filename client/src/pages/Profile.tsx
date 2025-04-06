import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MusicIcon, Headphones, UserIcon, CircleUserIcon, UserPlusIcon, Check, X, Edit, Save } from "lucide-react";

import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import LoadingSpinner from "@/components/LoadingSpinner";
import TopTracksSection from "@/components/TopTracksSection";
import TopArtistsSection from "@/components/TopArtistsSection";
import GenreBreakdownSection from "@/components/GenreBreakdownSection";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { getProfileGradient, defaultProfileGradient } from "@/lib/utils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";

// User profile response type
interface UserProfile {
  id: number;
  uniqueId: string;
  displayName: string;
  profileImage: string | null;
  bio: string | null;
  friendshipStatus: 'none' | 'pending' | 'accepted' | 'rejected' | 'friends';
}

// Mood post type
interface MoodPost {
  id: number;
  userId: number;
  trackId: string;
  trackName: string;
  artistName: string;
  albumCover: string | null;
  note: string | null;
  startTimeMs: number | null;
  createdAt: string;
}

export default function Profile() {
  const [, params] = useRoute('/profile/:uniqueId');
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState("");

  // If no uniqueId param, navigate to not found
  if (!params || !params.uniqueId) {
    navigate('/not-found', { replace: true });
    return null;
  }

  const { uniqueId } = params;
  const isOwnProfile = user?.spotifyId && user.spotifyId === uniqueId;

  // Get user profile data
  const profileQuery = useQuery({
    queryKey: ['/api/users', uniqueId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${uniqueId}`);
      if (res.status === 404) {
        navigate('/not-found', { replace: true });
        return null;
      }
      if (!res.ok) throw new Error('Failed to fetch user profile');
      return res.json() as Promise<UserProfile>;
    }
  });

  // Get user mood posts
  const moodPostsQuery = useQuery({
    queryKey: ['/api/mood-posts', uniqueId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${uniqueId}/mood-posts`);
      if (!res.ok) throw new Error('Failed to fetch mood posts');
      return res.json() as Promise<MoodPost[]>;
    }
  });

  // Get user's currently playing song
  const currentlyPlayingQuery = useQuery({
    queryKey: ['/api/player/currently-playing', uniqueId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${uniqueId}/player/currently-playing`);
      if (!res.ok) {
        if (res.status === 404) return null; // User not found
        throw new Error('Failed to fetch currently playing');
      }
      return res.json();
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Send friend request
  const sendFriendRequestMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/friends/requests', 'POST', { receiverUniqueId: uniqueId });
    },
    onSuccess: () => {
      toast({
        title: "Friend request sent",
        description: "They'll need to accept your request to become friends",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users', uniqueId] });
      queryClient.invalidateQueries({ queryKey: ['/api/friends/requests'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send friend request",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
    }
  });

  // Update user bio
  const updateBioMutation = useMutation({
    mutationFn: async (newBio: string) => {
      return apiRequest('/api/me/profile', 'PATCH', { bio: newBio });
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your bio has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users', uniqueId] });
      setEditingBio(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update profile",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
    }
  });

  // Update local bio state when profile data loads
  if (profileQuery.data && profileQuery.data.bio !== null && bio === "") {
    setBio(profileQuery.data.bio);
  }

  // Determine what friendship action to show
  const getFriendshipAction = () => {
    if (isOwnProfile) return null;
    
    const status = profileQuery.data?.friendshipStatus;
    
    if (status === 'friends') {
      return (
        <Button variant="outline" disabled>
          <Check className="mr-2 h-4 w-4" />
          Friends
        </Button>
      );
    } else if (status === 'pending') {
      return (
        <Button variant="outline" disabled>
          <CircleUserIcon className="mr-2 h-4 w-4" />
          Request Pending
        </Button>
      );
    } else {
      return (
        <Button 
          onClick={() => sendFriendRequestMutation.mutate()}
          disabled={sendFriendRequestMutation.isPending}
        >
          <UserPlusIcon className="mr-2 h-4 w-4" />
          Add Friend
        </Button>
      );
    }
  };

  // Format date string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  if (profileQuery.isLoading) {
    return <LoadingSpinner fullScreen message="Loading profile..." />;
  }

  if (profileQuery.error || !profileQuery.data) {
    return (
      <div className="flex min-h-screen bg-background justify-center items-center">
        <div className="text-center p-6">
          <h1 className="text-2xl font-bold">Error Loading Profile</h1>
          <p className="text-muted-foreground mt-2">
            We couldn't load this profile. Please try again later.
          </p>
          <Button className="mt-4" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const profile = profileQuery.data;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar activePage="dashboard" />
      </div>

      <div className="flex-1">
        <div className="container px-4 py-6 md:px-6 md:py-8 max-w-6xl">
          {/* Profile Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="h-24 w-24 md:h-32 md:w-32">
                <AvatarImage src={profile.profileImage || undefined} />
                <AvatarFallback className={`text-3xl bg-gradient-to-br ${getProfileGradient(profile.uniqueId)}`}>
                  {profile.displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h1 className="text-3xl font-bold">{profile.displayName}</h1>
                <p className="text-muted-foreground">@{profile.uniqueId}</p>
                
                {isOwnProfile ? (
                  <div className="mt-4">
                    {editingBio ? (
                      <div className="space-y-2">
                        <Textarea 
                          value={bio} 
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Write something about yourself..."
                          className="h-24"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => updateBioMutation.mutate(bio)}
                            disabled={updateBioMutation.isPending}
                          >
                            <Save className="mr-2 h-4 w-4" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingBio(false);
                              setBio(profile.bio || "");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4">
                        <p className="text-muted-foreground italic">
                          {profile.bio || "No bio yet"}
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => setEditingBio(true)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Bio
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-4">
                    <p className="text-muted-foreground italic mb-4">
                      {profile.bio || "No bio yet"}
                    </p>
                    {getFriendshipAction()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Currently Playing (if available) */}
          {currentlyPlayingQuery.data && currentlyPlayingQuery.data.item && (
            <Card className="mb-8 bg-gradient-to-r from-green-900/20 to-green-700/20 border-green-500/20">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="bg-green-500 rounded-full p-2 mr-4">
                    <Headphones className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-green-600">Currently listening to</p>
                    <h3 className="text-xl font-bold">{currentlyPlayingQuery.data.item.name}</h3>
                    <p>{currentlyPlayingQuery.data.item.artists.map((a: any) => a.name).join(', ')}</p>
                  </div>
                  {currentlyPlayingQuery.data.item.album?.images?.[0]?.url && (
                    <img 
                      src={currentlyPlayingQuery.data.item.album.images[0].url} 
                      alt="Album Cover" 
                      className="ml-auto h-16 w-16 rounded-md"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="moods">Mood Posts</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              <TopTracksSection limit={5} showViewAll={false} />
              <TopArtistsSection limit={5} showViewAll={false} />
              <GenreBreakdownSection />
            </TabsContent>

            {/* Mood Posts Tab */}
            <TabsContent value="moods" className="space-y-4">
              <h2 className="text-2xl font-bold mb-4">Mood Posts</h2>
              
              {moodPostsQuery.isLoading ? (
                <LoadingSpinner message="Loading mood posts..." />
              ) : moodPostsQuery.error ? (
                <div className="bg-red-50 p-4 rounded-md text-red-600">
                  Failed to load mood posts. Please try again.
                </div>
              ) : moodPostsQuery.data?.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">No mood posts yet.</p>
                    {isOwnProfile && (
                      <p className="mt-2">
                        Share what you're listening to with your friends!
                      </p>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {moodPostsQuery.data?.map(post => (
                    <Card key={post.id} className="overflow-hidden">
                      <div className="flex flex-col md:flex-row">
                        {post.albumCover && (
                          <div className="md:w-32 h-32 flex-shrink-0">
                            <img 
                              src={post.albumCover} 
                              alt={`${post.trackName} cover`} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-4 flex-1">
                          <div className="flex justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{post.trackName}</h3>
                              <p className="text-muted-foreground">{post.artistName}</p>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(post.createdAt)}
                            </div>
                          </div>
                          
                          {post.note && (
                            <div className="mt-4 bg-muted p-3 rounded-md italic">
                              "{post.note}"
                            </div>
                          )}
                          
                          <div className="mt-4">
                            <a 
                              href={`https://open.spotify.com/track/${post.trackId}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-green-600 hover:text-green-700 flex items-center"
                            >
                              <MusicIcon className="h-4 w-4 mr-1" />
                              Listen on Spotify
                            </a>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Mobile Nav */}
        <div className="block md:hidden fixed bottom-0 left-0 right-0 border-t bg-background">
          <MobileNav activePage="dashboard" />
        </div>
      </div>
    </div>
  );
}