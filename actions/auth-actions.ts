"use server";

import { createServerSupabaseClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function signUp(formData: FormData) {
  const supabase = await createServerSupabaseClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

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

