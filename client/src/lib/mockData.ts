import { SpotifyArtist, SpotifyTrack } from '@shared/schema';

// Mock top artists data
export const mockTopArtists: SpotifyArtist[] = [
  {
    id: 'mock-artist-1',
    name: 'The Weeknd',
    images: [{ url: 'https://i.scdn.co/image/ab6761610000e5eb92df8981b78d559421113fa5' }],
    genres: ['pop', 'r&b', 'canadian pop'],
    followers: { total: 54823421 }
  },
  {
    id: 'mock-artist-2',
    name: 'Drake',
    images: [{ url: 'https://i.scdn.co/image/ab6761610000e5eb4293385d324db8558179afd9' }],
    genres: ['canadian hip hop', 'hip hop', 'rap'],
    followers: { total: 67542187 }
  },
  {
    id: 'mock-artist-3',
    name: 'Taylor Swift',
    images: [{ url: 'https://i.scdn.co/image/ab6761610000e5eb5a00969a4698c3bc19d84156' }],
    genres: ['pop', 'country pop'],
    followers: { total: 72653219 }
  },
  {
    id: 'mock-artist-4',
    name: 'Dua Lipa',
    images: [{ url: 'https://i.scdn.co/image/ab6761610000e5eb4c7f30ff25f8677f2c9e8c59' }],
    genres: ['dance pop', 'pop'],
    followers: { total: 32187654 }
  },
  {
    id: 'mock-artist-5',
    name: 'Kendrick Lamar',
    images: [{ url: 'https://i.scdn.co/image/ab6761610000e5eb7dd388f0e5d5bb9cd1e95ef3' }],
    genres: ['conscious hip hop', 'hip hop', 'rap', 'west coast rap'],
    followers: { total: 21564523 }
  },
  {
    id: 'mock-artist-6',
    name: 'Billie Eilish',
    images: [{ url: 'https://i.scdn.co/image/ab6761610000e5eb8f6e02a69433424b65b0a802' }],
    genres: ['art pop', 'electropop', 'pop'],
    followers: { total: 56781234 }
  },
  {
    id: 'mock-artist-7',
    name: 'Post Malone',
    images: [{ url: 'https://i.scdn.co/image/ab6761610000e5eb6be070445b03e0b63147c2c1' }],
    genres: ['dfw rap', 'melodic rap', 'rap'],
    followers: { total: 37865421 }
  },
  {
    id: 'mock-artist-8',
    name: 'SZA',
    images: [{ url: 'https://i.scdn.co/image/ab6761610000e5eb9817d4235cc11bb5ce836b09' }],
    genres: ['pop', 'r&b', 'urban contemporary'],
    followers: { total: 18765432 }
  },
  {
    id: 'mock-artist-9',
    name: 'Bad Bunny',
    images: [{ url: 'https://i.scdn.co/image/ab6761610000e5eb8ee9a6f54dcbd5bc95deb2ed' }],
    genres: ['latin', 'reggaeton', 'trap latino'],
    followers: { total: 61234567 }
  },
  {
    id: 'mock-artist-10',
    name: 'Tame Impala',
    images: [{ url: 'https://i.scdn.co/image/ab6761610000e5ebf8c9b86e845e14bcd5271a62' }],
    genres: ['alternative rock', 'psychedelic rock'],
    followers: { total: 12356789 }
  }
];

// Mock top tracks data
export const mockTopTracks: SpotifyTrack[] = [
  {
    id: 'mock-track-1',
    name: 'Blinding Lights',
    album: {
      name: 'After Hours',
      images: [{ url: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36' }]
    },
    artists: [{ id: 'mock-artist-1', name: 'The Weeknd' }],
    duration_ms: 200040
  },
  {
    id: 'mock-track-2',
    name: 'Circles',
    album: {
      name: "Hollywood's Bleeding",
      images: [{ url: 'https://i.scdn.co/image/ab67616d0000b273b1c4b76e23414c9f20242268' }]
    },
    artists: [{ id: 'mock-artist-7', name: 'Post Malone' }],
    duration_ms: 215280
  },
  {
    id: 'mock-track-3',
    name: 'Don\'t Start Now',
    album: {
      name: 'Future Nostalgia',
      images: [{ url: 'https://i.scdn.co/image/ab67616d0000b273d4daf28d55fe4197ede848be' }]
    },
    artists: [{ id: 'mock-artist-4', name: 'Dua Lipa' }],
    duration_ms: 183290
  },
  {
    id: 'mock-track-4',
    name: 'Anti-Hero',
    album: {
      name: 'Midnights',
      images: [{ url: 'https://i.scdn.co/image/ab67616d0000b273bb54dde68cd23e2a268ae0f5' }]
    },
    artists: [{ id: 'mock-artist-3', name: 'Taylor Swift' }],
    duration_ms: 200690
  },
  {
    id: 'mock-track-5',
    name: 'Humble',
    album: {
      name: 'DAMN.',
      images: [{ url: 'https://i.scdn.co/image/ab67616d0000b273b5f13ed49bd51b65b5d4dbed' }]
    },
    artists: [{ id: 'mock-artist-5', name: 'Kendrick Lamar' }],
    duration_ms: 177000
  },
  {
    id: 'mock-track-6',
    name: 'Bad Guy',
    album: {
      name: 'WHEN WE ALL FALL ASLEEP, WHERE DO WE GO?',
      images: [{ url: 'https://i.scdn.co/image/ab67616d0000b2732a038d3bf875d23e4aeaa84e' }]
    },
    artists: [{ id: 'mock-artist-6', name: 'Billie Eilish' }],
    duration_ms: 194088
  },
  {
    id: 'mock-track-7',
    name: 'One Dance',
    album: {
      name: 'Views',
      images: [{ url: 'https://i.scdn.co/image/ab67616d0000b27301902f639b0292b2abc80e8f' }]
    },
    artists: [{ id: 'mock-artist-2', name: 'Drake' }],
    duration_ms: 173987
  },
  {
    id: 'mock-track-8',
    name: 'Kill Bill',
    album: {
      name: 'SOS',
      images: [{ url: 'https://i.scdn.co/image/ab67616d0000b273a0495c3427aaf8d0a55deecd' }]
    },
    artists: [{ id: 'mock-artist-8', name: 'SZA' }],
    duration_ms: 154322
  },
  {
    id: 'mock-track-9',
    name: 'Tití Me Preguntó',
    album: {
      name: 'Un Verano Sin Ti',
      images: [{ url: 'https://i.scdn.co/image/ab67616d0000b273d0a830432996fd426ef1b26e' }]
    },
    artists: [{ id: 'mock-artist-9', name: 'Bad Bunny' }],
    duration_ms: 243857
  },
  {
    id: 'mock-track-10',
    name: 'The Less I Know The Better',
    album: {
      name: 'Currents',
      images: [{ url: 'https://i.scdn.co/image/ab67616d0000b2739e1cfc756886ac782e363d79' }]
    },
    artists: [{ id: 'mock-artist-10', name: 'Tame Impala' }],
    duration_ms: 218533
  }
];

// Mock recently played tracks
export const mockRecentlyPlayed: SpotifyTrack[] = [
  {
    id: 'mock-recent-1',
    name: 'Save Your Tears',
    album: {
      name: 'After Hours',
      images: [{ url: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36' }]
    },
    artists: [{ id: 'mock-artist-1', name: 'The Weeknd' }],
    duration_ms: 215880
  },
  {
    id: 'mock-recent-2',
    name: 'Lavender Haze',
    album: {
      name: 'Midnights',
      images: [{ url: 'https://i.scdn.co/image/ab67616d0000b273bb54dde68cd23e2a268ae0f5' }]
    },
    artists: [{ id: 'mock-artist-3', name: 'Taylor Swift' }],
    duration_ms: 202395
  },
  {
    id: 'mock-recent-3',
    name: 'Levitating',
    album: {
      name: 'Future Nostalgia',
      images: [{ url: 'https://i.scdn.co/image/ab67616d0000b273d4daf28d55fe4197ede848be' }]
    },
    artists: [{ id: 'mock-artist-4', name: 'Dua Lipa' }],
    duration_ms: 203807
  },
  {
    id: 'mock-recent-4',
    name: 'N95',
    album: {
      name: 'Mr. Morale & The Big Steppers',
      images: [{ url: 'https://i.scdn.co/image/ab67616d0000b2732e968a78380aa0e7b4f9debf' }]
    },
    artists: [{ id: 'mock-artist-5', name: 'Kendrick Lamar' }],
    duration_ms: 195128
  },
  {
    id: 'mock-recent-5',
    name: 'Sunflower',
    album: {
      name: 'Spider-Man: Into the Spider-Verse',
      images: [{ url: 'https://i.scdn.co/image/ab67616d0000b273e2e352d89826aef6dbd5ff8f' }]
    },
    artists: [{ id: 'mock-artist-7', name: 'Post Malone' }],
    duration_ms: 158040
  }
];

// Genre distribution (for charts)
export const mockGenreDistribution = {
  'pop': 28,
  'hip hop': 24,
  'r&b': 15,
  'rock': 10,
  'electronic': 8,
  'latin': 7,
  'country': 4,
  'other': 4
};

// Mock friends data
export const mockFriends = [
  {
    id: 1,
    uniqueId: 'MUSIC123',
    displayName: 'Emma Wilson',
    profileImage: 'https://i.imgur.com/K7SwQmH.jpeg',
    bio: 'Music enthusiast | Concert photographer | Always looking for new sounds',
  },
  {
    id: 2,
    uniqueId: 'BEAT456B',
    displayName: 'Michael Chen',
    profileImage: 'https://i.imgur.com/NF7BWRt.jpeg',
    bio: 'DJ on weekends, software engineer by day. Hip-hop and electronic music lover.',
  },
  {
    id: 3,
    uniqueId: 'TUNE789X',
    displayName: 'Sophia Rodriguez',
    profileImage: 'https://i.imgur.com/5yw5H9K.jpeg',
    bio: 'Vinyl collector | 70s rock enthusiast | Music is my therapy',
  }
];

// Mock mood posts
export const mockMoodPosts = [
  {
    id: 1,
    userId: 1,
    trackId: 'mock-track-3',
    trackName: "Don't Start Now",
    artistName: 'Dua Lipa',
    albumCover: 'https://i.scdn.co/image/ab67616d0000b273d4daf28d55fe4197ede848be',
    note: 'This song always puts me in a great mood! Perfect for my morning commute.',
    startTimeMs: 45000,
    createdAt: '2025-04-03T14:23:11Z',
    user: {
      id: 1,
      uniqueId: 'MUSIC123',
      displayName: 'Emma Wilson',
      profileImage: 'https://i.imgur.com/K7SwQmH.jpeg'
    }
  },
  {
    id: 2,
    userId: 2,
    trackId: 'mock-track-5',
    trackName: 'Humble',
    artistName: 'Kendrick Lamar',
    albumCover: 'https://i.scdn.co/image/ab67616d0000b273b5f13ed49bd51b65b5d4dbed',
    note: 'When you need that confidence boost 💪',
    startTimeMs: 30000,
    createdAt: '2025-04-02T18:45:22Z',
    user: {
      id: 2,
      uniqueId: 'BEAT456B',
      displayName: 'Michael Chen',
      profileImage: 'https://i.imgur.com/NF7BWRt.jpeg'
    }
  },
  {
    id: 3,
    userId: 3,
    trackId: 'mock-track-10',
    trackName: 'The Less I Know The Better',
    artistName: 'Tame Impala',
    albumCover: 'https://i.scdn.co/image/ab67616d0000b2739e1cfc756886ac782e363d79',
    note: 'Feeling nostalgic today. This song takes me back to summer 2019.',
    startTimeMs: 65000,
    createdAt: '2025-04-01T21:12:48Z',
    user: {
      id: 3,
      uniqueId: 'TUNE789X',
      displayName: 'Sophia Rodriguez',
      profileImage: 'https://i.imgur.com/5yw5H9K.jpeg'
    }
  },
  {
    id: 4,
    userId: 0,
    trackId: 'mock-track-4',
    trackName: 'Anti-Hero',
    artistName: 'Taylor Swift',
    albumCover: 'https://i.scdn.co/image/ab67616d0000b273bb54dde68cd23e2a268ae0f5',
    note: 'Sometimes we all feel like the problem, right? 🙃',
    startTimeMs: 50000,
    createdAt: '2025-04-04T09:34:15Z',
    user: {
      id: 0,
      uniqueId: 'DEMO1234',
      displayName: 'Demo User',
      profileImage: 'https://i.imgur.com/8Km9tLL.png'
    }
  }
];

// Mock friend requests
export const mockFriendRequests = [
  {
    id: 1,
    status: 'pending',
    createdAt: '2025-04-01T18:25:33Z',
    isSender: false,
    user: {
      id: 4,
      uniqueId: 'ROCK567J',
      displayName: 'Alex Johnson',
      profileImage: 'https://i.imgur.com/bTnJGK3.jpeg',
      bio: 'Rock music enthusiast and guitarist. Always looking for new bands.'
    }
  }
];