"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  updatePasswordSchema,
  updateProfileSchema,
  type UpdatePasswordData,
  type UpdateProfileData,
} from "@/lib/validations/account";

export interface UserProfile {
  id: string;
  email: string; // Always fetched from Supabase auth, not stored in DB
  nickname: string | null;
  timezone: string;
  preferredOddsFormat: "decimal" | "american";
}

/**
 * Get user profile, creating it if it doesn't exist
 */
export async function getUserProfile(): Promise<UserProfile> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  // Always get email from Supabase auth user (never from database)
  const userEmail = user.email || "";

  // Try to find existing profile
  let profile = await prisma.user.findUnique({
    where: { id: user.id },
  });

  // Create profile if it doesn't exist
  if (!profile) {
    profile = await prisma.user.create({
      data: {
        id: user.id,
        nickname: userEmail, // Default to email if not provided during sign-up
        timezone: "America/New_York",
        preferredOddsFormat: "decimal",
      },
    });
  }

  return {
    id: profile.id,
    email: userEmail, // Always return email from Supabase auth
    nickname: profile.nickname,
    timezone: profile.timezone,
    preferredOddsFormat: profile.preferredOddsFormat as "decimal" | "american",
  };
}

/**
 * Get user timezone, with fallback to Eastern
 */
export async function getUserTimezone(): Promise<string> {
  try {
    const profile = await getUserProfile();
    return profile.timezone;
  } catch {
    return "America/New_York";
  }
}

/**
 * Update user password
 */
export async function updatePassword(data: UpdatePasswordData) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const validated = updatePasswordSchema.parse(data);
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.updateUser({
    password: validated.password, // Only use password, confirmPassword is just for validation
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/account");
  return { success: true, message: "Password updated successfully" };
}

/**
 * Update user profile (nickname, timezone, odds format)
 */
export async function updateProfile(data: Partial<UpdateProfileData>) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const validated = updateProfileSchema.partial().parse(data);

  const updateData: {
    nickname?: string | null;
    timezone?: string;
    preferredOddsFormat?: string;
  } = {};

  if (validated.nickname !== undefined) {
    updateData.nickname = validated.nickname || null;
  }
  if (validated.timezone !== undefined) {
    updateData.timezone = validated.timezone;
  }
  if (validated.preferredOddsFormat !== undefined) {
    updateData.preferredOddsFormat = validated.preferredOddsFormat;
  }

  await prisma.user.upsert({
    where: { id: user.id },
    update: updateData,
    create: {
      id: user.id,
      ...updateData,
      timezone: updateData.timezone || "America/New_York",
      preferredOddsFormat: updateData.preferredOddsFormat || "decimal",
    },
  });

  // Revalidate paths to clear cache
  revalidatePath("/account");
  revalidatePath("/dashboard");
  return { success: true, message: "Profile updated successfully" };
}

/**
 * Update odds format preference
 */
export async function updateOddsFormat(format: "decimal" | "american") {
  return updateProfile({ preferredOddsFormat: format });
}

/**
 * Sign out user
 */
export async function signOut() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

