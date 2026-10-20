import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "listener" | "artist" | "admin";

export async function requireUser(next: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  const { data: profile } = await supabase.from("profiles").select("role, display_name").eq("id", user.id).single();
  return { supabase, user, role: (profile?.role ?? "listener") as Role };
}

export async function requireAdmin() {
  const ctx = await requireUser("/admin");
  if (ctx.role !== "admin") redirect("/");
  return ctx;
}
