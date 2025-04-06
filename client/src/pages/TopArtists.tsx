import { Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import UserProfile from "@/components/UserProfile";
import TimePeriodSelector from "@/components/TimePeriodSelector";
import TopArtistsSection from "@/components/TopArtistsSection";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function TopArtists() {
  const { user } = useAuth();

  if (!user) {
    return <LoadingSpinner message="Loading your profile..." />;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Sidebar (Desktop) */}
      <Sidebar activePage="artists" />

      {/* Main Content */}
      <div className="flex-1 md:ml-64">
        {/* Mobile Header */}
        <header className="md:hidden bg-gradient-to-r from-purple-900 to-black p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Statify
            </h1>
            <div className="flex items-center">
              {user.profileImage && (
                <img 
                  src={user.profileImage} 
                  alt="User profile" 
                  className="w-8 h-8 rounded-full"
                />
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-4 md:p-8 md:pt-6">
          {/* User Profile Section */}
          <Suspense fallback={<LoadingSpinner message="Loading profile..." />}>
            <UserProfile />
          </Suspense>

          {/* Time Period Selector */}
          <TimePeriodSelector />

          {/* Top Artists Section - Full View */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Your Top Artists</h2>
            <Suspense fallback={<LoadingSpinner message="Loading your top artists..." />}>
              <TopArtistsSection limit={30} showViewAll={false} />
            </Suspense>
          </section>
        </main>

        {/* Mobile Navigation */}
        <MobileNav activePage="artists" />
      </div>
    </div>
  );
}
