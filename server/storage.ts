import { users, type User, type InsertUser } from "@shared/schema";

// This interface matches the schema but is implemented in memory
// for any server-side operations that might be needed.
// Most data is handled client-side with Firebase.

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.currentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === username, // Mapping username to email for simplicity
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id, createdAt: new Date(), role: 'user', photoUrl: null, studentId: null };
    this.users.set(id, user);
    return user;
  }
}

export const storage = new MemStorage();
