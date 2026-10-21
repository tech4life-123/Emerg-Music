"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const text = (fd: FormData, k: string, max: number) => String(fd.get(k) ?? "").trim().slice(0, max);

export async function applyAsArtist(fd: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/studio/apply");
  const links = text(fd, "links", 600).split(/\s+/).filter((l) => /^https?:\/\//i.test(l)).slice(0, 5);
  const { error } = await supabase.from("artist_applications").insert({
    user_id: user.id, artist_name: text(fd, "artistName", 80), bio: text(fd, "bio", 2000) || null,
    links, rights_statement_accepted: fd.get("accept") === "on",
  });
  redirect(error ? "/studio/apply?error=1" : "/studio?applied=1");
}
