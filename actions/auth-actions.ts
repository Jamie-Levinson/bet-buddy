"use server";

import { createServerSupabaseClient } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function signUp(formData: FormData) {
  const supabase = await createServerSupabaseClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const nickname = (formData.get("nickname") as string)?.trim() || null;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  // If email confirmation is required, show a message
  if (data.user && !data.session) {
    redirect(
      `/signup?message=${encodeURIComponent("Check your email to confirm your account!")}`
    );
  }

  // If we have a session (immediate sign-up), create the user profile
  if (data.user && data.session) {
    try {
      await prisma.user.create({
        data: {
          id: data.user.id,
          nickname: nickname || email,
          timezone: "America/New_York",
          preferredOddsFormat: "decimal",
        },
      });
    } catch (error) {
      console.error("Error creating user profile:", error);
    }
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signIn(formData: FormData) {
  const supabase = await createServerSupabaseClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function resetPassword(formData: FormData) {
  const supabase = await createServerSupabaseClient();

  const email = formData.get("email") as string;

  if (!email) {
    redirect(`/forgot-password?error=${encodeURIComponent("Email is required")}`);
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/reset-password`,
  });

  if (error) {
    redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/forgot-password?message=${encodeURIComponent("Check your email for a password reset link!")}`);
}

export async function updatePasswordFromReset(formData: FormData) {
  const supabase = await createServerSupabaseClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    redirect(`/reset-password?error=${encodeURIComponent("Password and confirmation are required")}`);
  }

  if (password !== confirmPassword) {
    redirect(`/reset-password?error=${encodeURIComponent("Passwords do not match")}`);
  }

  if (password.length < 8) {
    redirect(`/reset-password?error=${encodeURIComponent("Password must be at least 8 characters")}`);
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect(`/login?message=${encodeURIComponent("Password reset successfully! Please sign in.")}`);
}

