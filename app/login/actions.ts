"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "/profile";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/profile";
}

export async function signIn(_prev: { error?: boolean } | undefined, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (error) return { error: true };
  redirect(safeNext(formData.get("next")));
}

export async function signUp(_prev: { error?: boolean; checkEmail?: boolean } | undefined, formData: FormData) {
  const supabase = await createClient();
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: true };
  const { data, error } = await supabase.auth.signUp({
    email: String(formData.get("email") ?? ""),
    password,
    options: {
      data: { display_name: String(formData.get("displayName") ?? "").slice(0, 80) },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });
  if (error) return { error: true };
  if (data.session) redirect("/profile");
  return { checkEmail: true };
}
