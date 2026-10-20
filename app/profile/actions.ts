"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveProfile(_prev: { saved?: boolean; error?: boolean } | undefined, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: true };
  const locale = formData.get("locale") === "fr" ? "fr" : "en";
  const displayName = String(formData.get("displayName") ?? "").trim().slice(0, 80);
  const { error } = await supabase.from("profiles").update({ display_name: displayName, locale }).eq("id", user.id);
  if (error) return { error: true };
  (await cookies()).set("locale", locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
  return { saved: true };
}
