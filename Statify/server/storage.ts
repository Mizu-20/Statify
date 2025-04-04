import { 
  users, 
  type User, 
  type InsertUser 
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserBySpotifyId(spotifyId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserToken(
    id: number, 
    accessToken: string, 
    refreshToken: string, 
    tokenExpiry: number
  ): Promise<User | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private spotifyIdToUserId: Map<string, number>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.spotifyIdToUserId = new Map();
    this.currentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserBySpotifyId(spotifyId: string): Promise<User | undefined> {
    const userId = this.spotifyIdToUserId.get(spotifyId);
    if (!userId) return undefined;
    return this.users.get(userId);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    this.spotifyIdToUserId.set(insertUser.spotifyId, id);
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
}

export const storage = new MemStorage();
