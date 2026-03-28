import { z } from "zod";

export const genderOptions = ["Male", "Female", "Other", "Prefer not to say"] as const;
export type Gender = typeof genderOptions[number];

export const ageGroupOptions = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"] as const;
export type AgeGroup = typeof ageGroupOptions[number];

export type User = {
  id: string;
  email: string;
  passwordHash: string | null;
  mumblesVibeName: string;
  ssoLinked: boolean | null;
  ssoProvider: string | null;
  ssoFirstLoginComplete: boolean | null;
  profileImageUrl: string | null;
  aboutMe: string | null;
  gender: string | null;
  ageGroup: string | null;
  profilePictures: string[];
  isProfilePublic: boolean | null;
  blocked: boolean | null;
  isAdmin: boolean | null;
  isSuperAdmin: boolean | null;
  adminArticles: boolean | null;
  adminEvents: boolean | null;
  adminReviews: boolean | null;
  adminPosts: boolean | null;
  adminGroups: boolean | null;
  adminPodcasts: boolean | null;
  subscriptionPlanId: string | null;
  subscriptionStartDate: Date | null;
  subscriptionEndDate: Date | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  lastActiveAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type InsertUser = Omit<User, 'createdAt' | 'updatedAt'>;
export type UpsertUser = Partial<InsertUser> & { id: string; email: string; mumblesVibeName: string };

export const updateProfileSchema = z.object({
  mumblesVibeName: z.string().min(1, "Vibe name is required").max(100, "Vibe name too long"),
  aboutMe: z.string().max(500, "About me is too long").optional().nullable(),
  gender: z.string().optional().nullable(),
  ageGroup: z.string().optional().nullable(),
  isProfilePublic: z.boolean().optional()
});
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
