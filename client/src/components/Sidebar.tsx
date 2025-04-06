import { Link, useLocation } from "wouter";
import { useAuth } from "../context/AuthContext";
import { Badge } from "@/components/ui/badge";

interface SidebarProps {
  activePage: "dashboard" | "artists" | "tracks" | "genres" | "friends" | "moods";
}

export default function Sidebar({ activePage }: SidebarProps) {
  const { user, isDemoUser } = useAuth();
  
  return (
    <div className="hidden md:flex md:w-64 bg-black flex-shrink-0 flex-col p-4 fixed h-full">
      <div className="mb-8 px-2">
        <h1 className="text-3xl font-bold text-white flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Statify
        </h1>
        {isDemoUser && (
          <div className="mt-2">
            <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/20">
              DEMO MODE
            </Badge>
          </div>
        )}
      </div>
      
      <nav>
        <ul>
          <li className="mb-2">
            <Link href="/">
              <a className={`flex items-center px-4 py-3 rounded-md ${activePage === "dashboard" ? 
                "text-white bg-secondary" : 
                "text-muted-foreground hover:text-white transition-colors"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Home</span>
              </a>
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/artists">
              <a className={`flex items-center px-4 py-3 rounded-md ${activePage === "artists" ? 
                "text-white bg-secondary" : 
                "text-muted-foreground hover:text-white transition-colors"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Top Artists</span>
              </a>
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/tracks">
              <a className={`flex items-center px-4 py-3 rounded-md ${activePage === "tracks" ? 
                "text-white bg-secondary" : 
                "text-muted-foreground hover:text-white transition-colors"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <span>Top Tracks</span>
              </a>
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/genres">
              <a className={`flex items-center px-4 py-3 rounded-md ${activePage === "genres" ? 
                "text-white bg-secondary" : 
                "text-muted-foreground hover:text-white transition-colors"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                <span>Genres</span>
              </a>
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/friends">
              <a className={`flex items-center px-4 py-3 rounded-md ${activePage === "friends" ? 
                "text-white bg-secondary" : 
                "text-muted-foreground hover:text-white transition-colors"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span>Friends</span>
              </a>
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/moods">
              <a className={`flex items-center px-4 py-3 rounded-md ${activePage === "moods" ? 
                "text-white bg-secondary" : 
                "text-muted-foreground hover:text-white transition-colors"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Mood Feed</span>
              </a>
            </Link>
          </li>
        </ul>
      </nav>
      
      <div className="mt-auto">
        {user && (
          <div className="flex items-center p-2 rounded-md hover:bg-secondary transition-colors">
            {user.profileImage ? (
              <img src={user.profileImage} alt="User profile" className="w-10 h-10 rounded-full mr-3" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-secondary mr-3 flex items-center justify-center">
                <span className="text-xl">{user.displayName?.charAt(0)}</span>
              </div>
            )}
            <div className="overflow-hidden">
              <div className="font-medium truncate">{user.displayName}</div>
              <div className="text-xs text-muted-foreground">View Profile</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
