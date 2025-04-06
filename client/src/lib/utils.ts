import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// This is a placeholder for gradient colors when no profile image is available
export const defaultProfileGradient = "from-purple-900 to-black";

// This function generates a gradient based on the user's Spotify ID
// It's a deterministic function that will always return the same gradient for the same user
export function getProfileGradient(spotifyId: string): string {
  // Convert spotifyId to a number by summing char codes
  const idSum = spotifyId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  
  // Create a set of gradients
  const gradients = [
    "from-blue-900 to-indigo-800",
    "from-green-900 to-emerald-800",
    "from-purple-900 to-violet-800",
    "from-pink-900 to-rose-800",
    "from-red-900 to-orange-800",
    "from-cyan-900 to-sky-800",
    "from-amber-900 to-yellow-800",
    "from-indigo-900 to-blue-800",
    "from-emerald-900 to-teal-800",
    "from-rose-900 to-pink-800"
  ];
  
  // Get a gradient based on the user ID
  return gradients[idSum % gradients.length];
}
