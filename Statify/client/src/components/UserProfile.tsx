import { useAuth } from "../context/AuthContext";
import { Card } from "@/components/ui/card";
import { getProfileGradient, defaultProfileGradient } from "@/lib/utils";

export default function UserProfile() {
  const { user } = useAuth();
  
  if (!user) {
    return null;
  }
  
  // Generate a custom gradient based on the user's Spotify ID
  const gradientClasses = user.spotifyId 
    ? getProfileGradient(user.spotifyId) 
    : defaultProfileGradient;
  
  return (
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
          <div className="flex items-center text-sm justify-center">
            <div className="px-4 py-1 rounded-full bg-white/10 backdrop-blur-sm">
              <strong>{user.followers || 0}</strong> Followers
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
