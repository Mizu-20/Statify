import { 
  users, 
  friendRequests,
  friendships,
  moodPosts,
  type User, 
  type InsertUser,
  type FriendRequest,
  type InsertFriendRequest,
  type Friendship,
  type InsertFriendship,
  type MoodPost,
  type InsertMoodPost
} from "@shared/schema";
import { customAlphabet } from 'nanoid';

// Generate a random ID with capital letters and numbers only
const generateUniqueId = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);

export interface IStorage {
  // User Methods
  getUser(id: number): Promise<User | undefined>;
  getUserBySpotifyId(spotifyId: string): Promise<User | undefined>;
  getUserByUniqueId(uniqueId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserToken(
    id: number, 
    accessToken: string, 
    refreshToken: string, 
    tokenExpiry: number
  ): Promise<User | undefined>;
  updateUserProfile(id: number, bio: string): Promise<User | undefined>;
  searchUsers(query: string): Promise<User[]>;
  
  // Friend Request Methods
  createFriendRequest(request: InsertFriendRequest): Promise<FriendRequest>;
  getFriendRequest(id: number): Promise<FriendRequest | undefined>;
  getFriendRequestsByUser(userId: number, status?: string): Promise<FriendRequest[]>;
  updateFriendRequestStatus(id: number, status: string): Promise<FriendRequest | undefined>;
  
  // Friendship Methods
  createFriendship(friendship: InsertFriendship): Promise<Friendship>;
  getFriendships(userId: number): Promise<Friendship[]>;
  deleteFriendship(userId: number, friendId: number): Promise<boolean>;
  getFriends(userId: number): Promise<User[]>;
  
  // Mood Post Methods
  createMoodPost(post: InsertMoodPost): Promise<MoodPost>;
  getMoodPost(id: number): Promise<MoodPost | undefined>;
  getUserMoodPosts(userId: number): Promise<MoodPost[]>;
  getFriendsMoodPosts(userId: number): Promise<MoodPost[]>;
  deleteMoodPost(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private spotifyIdToUserId: Map<string, number>;
  private uniqueIdToUserId: Map<string, number>;
  private friendRequests: Map<number, FriendRequest>;
  private friendships: Map<string, Friendship>; // key: userId-friendId
  private moodPosts: Map<number, MoodPost>;
  currentUserId: number;
  currentRequestId: number;
  currentMoodPostId: number;

  constructor() {
    this.users = new Map();
    this.spotifyIdToUserId = new Map();
    this.uniqueIdToUserId = new Map();
    this.friendRequests = new Map();
    this.friendships = new Map();
    this.moodPosts = new Map();
    this.currentUserId = 1;
    this.currentRequestId = 1;
    this.currentMoodPostId = 1;
  }

  // User Methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserBySpotifyId(spotifyId: string): Promise<User | undefined> {
    const userId = this.spotifyIdToUserId.get(spotifyId);
    if (!userId) return undefined;
    return this.users.get(userId);
  }

  async getUserByUniqueId(uniqueId: string): Promise<User | undefined> {
    const userId = this.uniqueIdToUserId.get(uniqueId);
    if (!userId) return undefined;
    return this.users.get(userId);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const uniqueId = generateUniqueId();
    
    const user: User = { 
      ...insertUser, 
      id, 
      uniqueId,
      bio: "",
      email: insertUser.email || null,
      profileImage: insertUser.profileImage || null,
      followers: insertUser.followers || null
    };
    
    this.users.set(id, user);
    this.spotifyIdToUserId.set(insertUser.spotifyId, id);
    this.uniqueIdToUserId.set(uniqueId, id);
    return user;
  }

  async updateUserToken(
    id: number, 
    accessToken: string, 
    refreshToken: string, 
    tokenExpiry: number
  ): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = {
      ...user,
      accessToken,
      refreshToken,
      tokenExpiry
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserProfile(id: number, bio: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = {
      ...user,
      bio
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async searchUsers(query: string): Promise<User[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.users.values()).filter(user => {
      return (
        user.displayName.toLowerCase().includes(lowercaseQuery) ||
        user.uniqueId.toLowerCase().includes(lowercaseQuery)
      );
    });
  }

  // Friend Request Methods
  async createFriendRequest(request: InsertFriendRequest): Promise<FriendRequest> {
    const id = this.currentRequestId++;
    const now = new Date();
    
    const friendRequest: FriendRequest = {
      id,
      senderId: request.senderId,
      receiverId: request.receiverId,
      status: request.status || "pending",
      createdAt: now,
      updatedAt: now
    };
    
    this.friendRequests.set(id, friendRequest);
    return friendRequest;
  }

  async getFriendRequest(id: number): Promise<FriendRequest | undefined> {
    return this.friendRequests.get(id);
  }

  async getFriendRequestsByUser(userId: number, status?: string): Promise<FriendRequest[]> {
    return Array.from(this.friendRequests.values()).filter(request => {
      const matchesUser = request.senderId === userId || request.receiverId === userId;
      if (status) {
        return matchesUser && request.status === status;
      }
      return matchesUser;
    });
  }

  async updateFriendRequestStatus(id: number, status: string): Promise<FriendRequest | undefined> {
    const request = this.friendRequests.get(id);
    if (!request) return undefined;
    
    const updatedRequest = {
      ...request,
      status,
      updatedAt: new Date()
    };
    
    this.friendRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  // Friendship Methods
  async createFriendship(friendship: InsertFriendship): Promise<Friendship> {
    const key1 = `${friendship.userId}-${friendship.friendId}`;
    const key2 = `${friendship.friendId}-${friendship.userId}`;
    
    const newFriendship: Friendship = {
      ...friendship,
      createdAt: new Date()
    };
    
    this.friendships.set(key1, newFriendship);
    
    // Also create the reverse friendship for bidirectional relationship
    const reverseFriendship: Friendship = {
      userId: friendship.friendId,
      friendId: friendship.userId,
      createdAt: new Date()
    };
    
    this.friendships.set(key2, reverseFriendship);
    
    return newFriendship;
  }

  async getFriendships(userId: number): Promise<Friendship[]> {
    return Array.from(this.friendships.values()).filter(
      friendship => friendship.userId === userId
    );
  }

  async deleteFriendship(userId: number, friendId: number): Promise<boolean> {
    const key1 = `${userId}-${friendId}`;
    const key2 = `${friendId}-${userId}`;
    
    const success1 = this.friendships.delete(key1);
    const success2 = this.friendships.delete(key2);
    
    return success1 && success2;
  }

  async getFriends(userId: number): Promise<User[]> {
    const friendships = await this.getFriendships(userId);
    const friendIds = friendships.map(f => f.friendId);
    
    return friendIds
      .map(id => this.users.get(id))
      .filter((user): user is User => user !== undefined);
  }

  // Mood Post Methods
  async createMoodPost(post: InsertMoodPost): Promise<MoodPost> {
    const id = this.currentMoodPostId++;
    
    const moodPost: MoodPost = {
      id,
      userId: post.userId,
      trackId: post.trackId,
      trackName: post.trackName,
      artistName: post.artistName,
      albumCover: post.albumCover || null,
      note: post.note || null,
      startTimeMs: post.startTimeMs || null,
      createdAt: new Date()
    };
    
    this.moodPosts.set(id, moodPost);
    return moodPost;
  }

  async getMoodPost(id: number): Promise<MoodPost | undefined> {
    return this.moodPosts.get(id);
  }

  async getUserMoodPosts(userId: number): Promise<MoodPost[]> {
    return Array.from(this.moodPosts.values())
      .filter(post => post.userId === userId)
      .sort((a, b) => {
        // Safely handle null createdAt values (shouldn't happen in practice)
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
  }

  async getFriendsMoodPosts(userId: number): Promise<MoodPost[]> {
    const friends = await this.getFriends(userId);
    const friendIds = friends.map(friend => friend.id);
    
    return Array.from(this.moodPosts.values())
      .filter(post => friendIds.includes(post.userId))
      .sort((a, b) => {
        // Safely handle null createdAt values (shouldn't happen in practice)
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
  }

  async deleteMoodPost(id: number): Promise<boolean> {
    return this.moodPosts.delete(id);
  }
}

export const storage = new MemStorage();
