import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useMutation } from "@tanstack/react-query";
import { Pencil, Copy, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getProfileGradient, defaultProfileGradient } from "@/lib/utils";

export default function UserProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(user?.bio || "");
  const [copied, setCopied] = useState(false);
  
  if (!user) {
    return null;
  }
  
  // Generate a custom gradient based on the user's Spotify ID
  const gradientClasses = user.spotifyId 
    ? getProfileGradient(user.spotifyId) 
    : defaultProfileGradient;

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (newBio: string) => {
      return apiRequest('/api/me/profile', 'PATCH', { bio: newBio });
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    }
  });

  // Copy unique ID to clipboard
  const copyUniqueId = () => {
    if (user.uniqueId) {
      navigator.clipboard.writeText(user.uniqueId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Unique ID copied to clipboard"
      });
    }
  };

  // Handle bio save
  const handleSaveBio = () => {
    updateProfileMutation.mutate(bio);
  };
  
  return (
    <>
      <section className={`mb-8 bg-gradient-to-r ${gradientClasses} rounded-xl p-6 md:p-10 text-center shadow-xl`}>
        <div className="flex flex-col items-center justify-center">
          {user.profileImage ? (
            <div className="relative mb-5">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-md transform scale-110"></div>
              <img 
                src={user.profileImage} 
                alt="User Profile" 
                className="relative w-32 h-32 rounded-full border-4 border-white/60 object-cover shadow-xl"
              />
            </div>
          ) : (
            <div className="relative mb-5">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-md transform scale-110"></div>
              <div className="relative w-32 h-32 rounded-full border-4 border-white/60 bg-secondary flex items-center justify-center shadow-xl">
                <span className="text-5xl font-bold">{user.displayName?.charAt(0)}</span>
              </div>
            </div>
          )}
          <div>
            <span className="text-sm font-medium uppercase tracking-wide mb-1 block text-white/80">Spotify Profile</span>
            <h1 className="text-4xl font-bold mb-3">{user.displayName}</h1>
            
            {/* Unique ID */}
            <div 
              className="px-4 py-2 mb-4 rounded-full bg-white/10 backdrop-blur-sm inline-flex items-center gap-1 cursor-pointer hover:bg-white/15 transition-colors"
              onClick={copyUniqueId}
            >
              <span className="font-mono text-sm font-bold">@{user.uniqueId}</span>
              {copied ? (
                <Check className="h-4 w-4 text-green-300" />
              ) : (
                <Copy className="h-4 w-4 text-white/60" />
              )}
            </div>
            
            <div className="flex items-center text-sm justify-center">
              <div className="px-4 py-1 rounded-full bg-white/10 backdrop-blur-sm">
                <strong>{user.followers || 0}</strong> Followers
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bio Section */}
      <Card className="mb-8 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Bio</h2>
            {!isEditing && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell others about yourself..."
                className="min-h-[120px]"
              />
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    setBio(user.bio || "");
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveBio}
                  disabled={updateProfileMutation.isPending}
                >
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">
              {user.bio ? user.bio : "No bio yet. Click edit to add one."}
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
