import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { SearchIcon, UserPlusIcon, X, Check, User } from "lucide-react";

import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getProfileGradient, defaultProfileGradient } from "@/lib/utils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { mockFriends, mockFriendRequests } from "@/lib/mockData";

// User type for friends/search
interface User {
  id: number;
  uniqueId: string;
  displayName: string;
  profileImage: string | null;
  bio: string | null;
}

// Friend request type
interface FriendRequest {
  id: number;
  status: string;
  createdAt: string;
  isSender: boolean;
  user: User;
}

export default function Friends() {
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();
  const { isDemoUser } = useAuth();

  // Get friends list
  const friendsQuery = useQuery({
    queryKey: ['/api/friends'],
    queryFn: async () => {
      if (isDemoUser) {
        // Return mock friends data for demo mode
        return mockFriends;
      }
      
      const res = await fetch('/api/friends');
      if (!res.ok) throw new Error('Failed to fetch friends');
      return res.json() as Promise<User[]>;
    }
  });

  // Get pending friend requests
  const requestsQuery = useQuery({
    queryKey: ['/api/friends/requests'],
    queryFn: async () => {
      if (isDemoUser) {
        // Return mock friend requests for demo mode
        return mockFriendRequests as FriendRequest[];
      }
      
      const res = await fetch('/api/friends/requests?status=pending');
      if (!res.ok) throw new Error('Failed to fetch friend requests');
      return res.json() as Promise<FriendRequest[]>;
    }
  });

  // Search users
  const searchResults = useQuery({
    queryKey: ['/api/users/search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      
      if (isDemoUser) {
        // Filter mock friends based on the search query for demo mode
        const results = mockFriends.filter(friend => 
          friend.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          friend.uniqueId.toLowerCase().includes(searchQuery.toLowerCase())
        );
        // Return results after a small delay to simulate API call
        await new Promise(resolve => setTimeout(resolve, 300));
        return results;
      }
      
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error('Failed to search users');
      return res.json() as Promise<User[]>;
    },
    enabled: searchQuery.length >= 2 && hasSearched
  });

  // Send friend request mutation
  const sendRequestMutation = useMutation({
    mutationFn: async (uniqueId: string) => {
      if (isDemoUser) {
        // Simulate a successful request in demo mode
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true };
      }
      return apiRequest('/api/friends/requests', 'POST', { receiverUniqueId: uniqueId });
    },
    onSuccess: () => {
      toast({
        title: "Friend request sent",
        description: "They'll need to accept your request to become friends"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/friends/requests'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send request",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
    }
  });

  // Accept/reject friend request mutation
  const respondToRequestMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: 'accepted' | 'rejected' }) => {
      if (isDemoUser) {
        // Simulate a successful response in demo mode
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true, status };
      }
      return apiRequest(`/api/friends/requests/${id}`, 'PATCH', { status });
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.status === 'accepted' ? "Friend request accepted" : "Friend request rejected",
        description: variables.status === 'accepted' 
          ? "You are now friends with this user" 
          : "The friend request has been rejected"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
      queryClient.invalidateQueries({ queryKey: ['/api/friends/requests'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to respond to request",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
    }
  });

  // Remove friend mutation
  const removeFriendMutation = useMutation({
    mutationFn: async (friendId: number) => {
      if (isDemoUser) {
        // Simulate a successful deletion in demo mode
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true };
      }
      return apiRequest(`/api/friends/${friendId}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: "Friend removed",
        description: "This user has been removed from your friends"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove friend",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
    }
  });

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
  };

  // Filter out users that are friends or have pending requests
  const filterSearchResults = (users: User[]) => {
    const friends = friendsQuery.data || [];
    const requests = requestsQuery.data || [];
    
    return users.filter(user => {
      // Check if already a friend
      const isFriend = friends.some(friend => friend.id === user.id);
      if (isFriend) return false;
      
      // Check if request already exists
      const hasRequest = requests.some(req => req.user.id === user.id);
      if (hasRequest) return false;
      
      return true;
    });
  };

  // Filter the results we display
  const filteredSearchResults = searchResults.data ? filterSearchResults(searchResults.data) : [];

  // Get received and sent requests
  const receivedRequests = requestsQuery.data?.filter(req => !req.isSender) || [];
  const sentRequests = requestsQuery.data?.filter(req => req.isSender) || [];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar activePage="friends" />
      </div>

      <div className="flex-1 flex justify-center">
        <div className="container px-4 py-6 md:px-6 md:py-8 max-w-4xl w-full">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Friends</h1>
          </div>

          <Tabs defaultValue="friends" className="space-y-6">
            <TabsList>
              <TabsTrigger value="friends">My Friends</TabsTrigger>
              <TabsTrigger value="requests">
                Requests
                {receivedRequests.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {receivedRequests.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="find">Find People</TabsTrigger>
            </TabsList>

            {/* Friends Tab */}
            <TabsContent value="friends" className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Your Friends</h2>
              
              {friendsQuery.isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Card key={i}>
                      <CardContent className="p-4 flex items-center">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="ml-4 space-y-2">
                          <Skeleton className="h-4 w-[200px]" />
                          <Skeleton className="h-3 w-[150px]" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : friendsQuery.error ? (
                <div className="bg-red-50 p-4 rounded text-red-600">
                  Failed to load friends. Please try again.
                </div>
              ) : friendsQuery.data?.length === 0 ? (
                <Card className="shadow-sm">
                  <CardContent className="p-8 text-center">
                    <User className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground font-medium">You don't have any friends yet.</p>
                    <p className="mt-2">
                      Go to the <span className="font-medium">Find People</span> tab to discover other users.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {friendsQuery.data?.map(friend => (
                    <Card key={friend.id} className="shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center">
                          <Avatar className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-600">
                            <AvatarImage src={friend.profileImage || undefined} />
                            <AvatarFallback className={`bg-gradient-to-br ${getProfileGradient(friend.uniqueId)}`}>
                              {friend.displayName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="ml-4 flex-1">
                            <div className="font-medium">{friend.displayName}</div>
                            <div className="text-sm text-muted-foreground">@{friend.uniqueId}</div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Link href={`/profile/${friend.uniqueId}`}>
                              <Button size="sm" variant="outline" className="bg-muted/50">Profile</Button>
                            </Link>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => removeFriendMutation.mutate(friend.id)}
                              disabled={removeFriendMutation.isPending}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Requests Tab */}
            <TabsContent value="requests" className="space-y-8">
              {requestsQuery.isLoading ? (
                <LoadingSpinner message="Loading friend requests..." />
              ) : requestsQuery.error ? (
                <div className="bg-red-50 p-4 rounded text-red-600">
                  Failed to load friend requests. Please try again.
                </div>
              ) : (
                <>
                  {/* Received requests */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Received Requests</h3>
                    
                    {receivedRequests.length === 0 ? (
                      <Card className="shadow-sm">
                        <CardContent className="p-6 text-center">
                          <p className="text-muted-foreground">No pending friend requests.</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-3">
                        {receivedRequests.map(request => (
                          <Card key={request.id} className="shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-center">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={request.user.profileImage || undefined} />
                                  <AvatarFallback className={`bg-gradient-to-br ${getProfileGradient(request.user.uniqueId)}`}>
                                    {request.user.displayName.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                
                                <div className="ml-4 flex-1">
                                  <div className="font-medium">{request.user.displayName}</div>
                                  <div className="text-sm text-muted-foreground">@{request.user.uniqueId}</div>
                                </div>
                                
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="text-green-600 hover:bg-green-50"
                                    onClick={() => respondToRequestMutation.mutate({ id: request.id, status: 'accepted' })}
                                    disabled={respondToRequestMutation.isPending}
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Accept
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="text-red-500 hover:bg-red-50"
                                    onClick={() => respondToRequestMutation.mutate({ id: request.id, status: 'rejected' })}
                                    disabled={respondToRequestMutation.isPending}
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Sent requests */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Sent Requests</h3>
                    
                    {sentRequests.length === 0 ? (
                      <Card className="shadow-sm">
                        <CardContent className="p-6 text-center">
                          <p className="text-muted-foreground">You haven't sent any friend requests.</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-3">
                        {sentRequests.map(request => (
                          <Card key={request.id} className="shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-center">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={request.user.profileImage || undefined} />
                                  <AvatarFallback className={`bg-gradient-to-br ${getProfileGradient(request.user.uniqueId)}`}>
                                    {request.user.displayName.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                
                                <div className="ml-4 flex-1">
                                  <div className="font-medium">{request.user.displayName}</div>
                                  <div className="text-sm text-muted-foreground">@{request.user.uniqueId}</div>
                                </div>
                                
                                <div className="text-sm text-muted-foreground">Pending</div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </TabsContent>

            {/* Find People Tab */}
            <TabsContent value="find" className="space-y-6">
              <div className="max-w-lg mx-auto">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Find Friends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSearch} className="flex gap-2">
                      <Input
                        placeholder="Search by name or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        type="submit" 
                        disabled={searchQuery.length < 2}
                        className="bg-primary"
                      >
                        <SearchIcon className="h-4 w-4 mr-2" />
                        Search
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
              
              <div className="max-w-lg mx-auto">
                {searchResults.isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <Card key={i} className="shadow-sm">
                        <CardContent className="p-4 flex items-center">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="ml-4 space-y-2">
                            <Skeleton className="h-4 w-[200px]" />
                            <Skeleton className="h-3 w-[150px]" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : searchResults.error ? (
                  <div className="bg-red-50 p-4 rounded text-red-600 shadow-sm">
                    Failed to search users. Please try again.
                  </div>
                ) : hasSearched && filteredSearchResults.length === 0 ? (
                  <Card className="shadow-sm">
                    <CardContent className="p-6 text-center">
                      <p className="text-muted-foreground">No users found matching your search.</p>
                      <p className="mt-2 text-sm">Try a different search term or check if they're already your friend.</p>
                    </CardContent>
                  </Card>
                ) : hasSearched ? (
                  <div className="space-y-3">
                    {filteredSearchResults.map(user => (
                      <Card key={user.id} className="shadow-sm hover:shadow transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.profileImage || undefined} />
                              <AvatarFallback className={`bg-gradient-to-br ${getProfileGradient(user.uniqueId)}`}>
                                {user.displayName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="ml-4 flex-1">
                              <div className="font-medium">{user.displayName}</div>
                              <div className="text-sm text-muted-foreground">@{user.uniqueId}</div>
                            </div>
                            
                            <Button 
                              onClick={() => sendRequestMutation.mutate(user.uniqueId)}
                              disabled={sendRequestMutation.isPending}
                              size="sm"
                              className="bg-primary hover:bg-primary/90"
                            >
                              <UserPlusIcon className="h-4 w-4 mr-2" />
                              Add Friend
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : null}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Mobile Nav */}
        <div className="block md:hidden fixed bottom-0 left-0 right-0 border-t bg-background">
          <MobileNav activePage="friends" />
        </div>
      </div>
    </div>
  );
}