import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";

interface MobileNavProps {
  activePage: "dashboard" | "artists" | "tracks" | "genres" | "friends" | "moods";
}

export default function MobileNav({ activePage }: MobileNavProps) {
  const { isDemoUser } = useAuth();
  
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black flex flex-col p-3 border-t border-border overflow-x-auto">
      {isDemoUser && (
        <div className="flex justify-center mb-1">
          <Badge variant="outline" className="text-[9px] bg-amber-500/10 text-amber-500 border-amber-500/20">
            DEMO MODE
          </Badge>
        </div>
      )}
      
      <div className="flex justify-around items-center w-full">
        <Link href="/">
          <div className={`flex flex-col items-center min-w-[60px] ${activePage === "dashboard" ? "text-white" : "text-muted-foreground"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs mt-1">Home</span>
          </div>
        </Link>
        
        <Link href="/artists">
          <div className={`flex flex-col items-center min-w-[60px] ${activePage === "artists" ? "text-white" : "text-muted-foreground"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-xs mt-1">Artists</span>
          </div>
        </Link>
        
        <Link href="/tracks">
          <div className={`flex flex-col items-center min-w-[60px] ${activePage === "tracks" ? "text-white" : "text-muted-foreground"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <span className="text-xs mt-1">Tracks</span>
          </div>
        </Link>
        
        <Link href="/genres">
          <div className={`flex flex-col items-center min-w-[60px] ${activePage === "genres" ? "text-white" : "text-muted-foreground"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            <span className="text-xs mt-1">Genres</span>
          </div>
        </Link>
        
        <Link href="/friends">
          <div className={`flex flex-col items-center min-w-[60px] ${activePage === "friends" ? "text-white" : "text-muted-foreground"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-xs mt-1">Friends</span>
          </div>
        </Link>
        
        <Link href="/moods">
          <div className={`flex flex-col items-center min-w-[60px] ${activePage === "moods" ? "text-white" : "text-muted-foreground"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs mt-1">Moods</span>
          </div>
        </Link>
      </div>
    </nav>
  );
}
