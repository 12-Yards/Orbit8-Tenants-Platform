import { type User, type UpsertUser } from "@shared/models/auth";
import { prisma } from "../../db";

export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const user = await prisma.users.findUnique({ where: { id } });
    return (user as User) ?? undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const user = await prisma.users.upsert({
      where: { id: userData.id },
      create: userData,
      update: {
        ...userData,
        updatedAt: new Date(),
      },
    });
    return user as User;
  }
}

export const authStorage = new AuthStorage();
