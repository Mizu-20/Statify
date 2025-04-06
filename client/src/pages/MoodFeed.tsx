import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Music, User, RefreshCw, Link as LinkIcon, Trash2 } from "lucide-react";
import { Link } from "wouter";

import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import LoadingSpinner from "@/components/LoadingSpinner";
import CreateMoodPost from "@/components/CreateMoodPost";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getProfileGradient } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { mockMoodPosts } from "@/lib/mockData";

// Mood post with user information
interface MoodPostWithUser {
  id: number;
  userId: number;
  trackId: string;
  trackName: string;
  artistName: string;
  albumCover: string | null;
  note: string | null;
  startTimeMs: number | null;
  createdAt: string;
  user: {
    id: number;
    uniqueId: string;
    displayName: string;
    profileImage: string | null;
  };
}

export default function MoodFeed() {
  const { toast } = useToast();
  const { user, isDemoUser } = useAuth();

  // Get friends' mood posts
  const moodPostsQuery = useQuery({
    queryKey: ['/api/friends/mood-posts'],
    queryFn: async () => {
      if (isDemoUser) {
        // Return mock data for demo users
        return mockMoodPosts as MoodPostWithUser[];
      }
      
      const res = await fetch('/api/friends/mood-posts');
      if (!res.ok) throw new Error('Failed to fetch mood posts');
      return res.json() as Promise<MoodPostWithUser[]>;
    }
  });

  // Delete mood post mutation
  const deleteMoodPostMutation = useMutation({
    mutationFn: async (postId: number) => {
      if (isDemoUser) {
        // Simulate a successful deletion in demo mode
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true };
      }
      return apiRequest(`/api/mood-posts/${postId}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: "Post deleted",
        description: "Your post has been removed"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/friends/mood-posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/mood-posts'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete post",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
    }
  });

  // Format date string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    if (diffDays < 7) return `${diffDays} day ago`;
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  // Handle post deletion
  const handleDeletePost = (postId: number) => {
    if (confirm('Are you sure you want to delete this post?')) {
      deleteMoodPostMutation.mutate(postId);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar activePage="moods" />
      </div>

      <div className="flex-1 flex justify-center">
        <div className="container px-4 py-6 md:px-6 md:py-8 max-w-3xl w-full">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Mood Feed</h1>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => moodPostsQuery.refetch()}
                disabled={moodPostsQuery.isRefetching}
              >
                <RefreshCw className={`h-4 w-4 ${moodPostsQuery.isRefetching ? 'animate-spin' : ''}`} />
              </Button>
              <CreateMoodPost />
            </div>
          </div>

          {moodPostsQuery.isLoading ? (
            <div className="py-20 text-center">
              <LoadingSpinner message="Loading mood posts..." />
            </div>
          ) : moodPostsQuery.error ? (
            <div className="py-12 text-center">
              <div className="bg-red-50 p-4 rounded-md mb-4 text-red-600 inline-block">
                Failed to load mood posts. Please try again.
              </div>
              <div>
                <Button onClick={() => moodPostsQuery.refetch()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </div>
            </div>
          ) : moodPostsQuery.data?.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <Card className="w-full max-w-md shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-10 px-8 pb-10">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                      <Music className="h-10 w-10 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold">No mood posts yet</h2>
                    <p className="text-muted-foreground text-center">
                      Connect with friends and share what you're listening to.
                      Start by adding friends in the Friends section.
                    </p>
                    <div className="flex gap-3 mt-2">
                      <Link href="/friends">
                        <Button variant="outline" className="bg-muted/50">
                          <User className="mr-2 h-4 w-4" />
                          Find Friends
                        </Button>
                      </Link>
                      <CreateMoodPost />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              {moodPostsQuery.data?.map(post => (
                <Card key={post.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col">
                    {/* User info & time */}
                    <div className="p-4 pb-2 flex items-center justify-between">
                      <Link href={`/profile/${post.user.uniqueId}`}>
                        <div className="flex items-center group">
                          <Avatar className="h-10 w-10 border-2 border-background">
                            <AvatarImage src={post.user.profileImage || undefined} />
                            <AvatarFallback className={`bg-gradient-to-br ${getProfileGradient(post.user.uniqueId)}`}>
                              {post.user.displayName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-2">
                            <span className="font-medium group-hover:underline">{post.user.displayName}</span>
                            <span className="text-muted-foreground text-sm ml-2">· {formatDate(post.createdAt)}</span>
                          </div>
                        </div>
                      </Link>
                      
                      {/* Show delete button if it's the user's post */}
                      {user?.id === post.userId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeletePost(post.id)}
                          disabled={deleteMoodPostMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    {/* Song & Note */}
                    <div className="flex flex-col sm:flex-row">
                      {post.albumCover && (
                        <div className="sm:w-28 h-28 sm:h-full flex-shrink-0">
                          <img 
                            src={post.albumCover} 
                            alt={`${post.trackName} cover`} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-4 pt-1 flex-1">
                        <div>
                          <h3 className="font-semibold text-lg">{post.trackName}</h3>
                          <p className="text-muted-foreground">{post.artistName}</p>
                        </div>
                        
                        {post.note && (
                          <div className="mt-3 bg-muted/60 p-3 rounded-md italic">
                            "{post.note}"
                          </div>
                        )}
                        
                        <div className="mt-3">
                          <a 
                            href={`https://open.spotify.com/track/${post.trackId}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-green-600 hover:text-green-700 flex items-center w-fit px-2 py-1 rounded hover:bg-green-50 transition-colors"
                          >
                            <LinkIcon className="h-3 w-3 mr-1" />
                            Listen on Spotify
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Nav */}
        <div className="block md:hidden fixed bottom-0 left-0 right-0 border-t bg-background pb-safe-area">
          <MobileNav activePage="moods" />
        </div>
      </div>
    </div>
  );
}