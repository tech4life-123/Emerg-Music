"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { RIGHTS_VERSION } from "@/lib/rights";

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

export async function createRelease(fd: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/studio");
  const { data: artist } = await supabase.from("artists").select("id").eq("owner_id", user.id).single();
  if (!artist) redirect("/studio");
  const type = ["single", "ep", "album"].includes(String(fd.get("type"))) ? String(fd.get("type")) : "single";
  const { data, error } = await supabase.from("releases").insert({ artist_id: artist.id, title: text(fd, "title", 120), type, status: "draft" }).select("id").single();
  if (error || !data) redirect("/studio?error=1");
  redirect(`/studio/releases/${data.id}`);
}

export async function addTrack(fd: FormData) {
  const supabase = await createClient();
  const releaseId = text(fd, "releaseId", 40);
  const { data: release } = await supabase.from("releases").select("id, artist_id, status").eq("id", releaseId).single();
  if (!release || release.status !== "draft") redirect(`/studio/releases/${releaseId}?error=1`);
  const number = Math.max(1, Math.min(99, Number(fd.get("trackNumber")) || 1));
  const { error } = await supabase.from("tracks").insert({ release_id: release.id, artist_id: release.artist_id, title: text(fd, "title", 120), track_number: number });
  revalidatePath(`/studio/releases/${releaseId}`);
  redirect(`/studio/releases/${releaseId}${error ? "?error=1" : ""}`);
}

export async function submitRelease(fd: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const releaseId = text(fd, "releaseId", 40);
  if (!user) redirect("/login");
  if (fd.get("accept") !== "on") redirect(`/studio/releases/${releaseId}?error=rights`);
  const { count } = await supabase.from("tracks").select("id", { count: "exact", head: true }).eq("release_id", releaseId);
  if (!count) redirect(`/studio/releases/${releaseId}?error=notracks`);
  const decl = await supabase.from("rights_declarations").insert({ release_id: releaseId, user_id: user.id, statement_version: RIGHTS_VERSION });
  if (decl.error) redirect(`/studio/releases/${releaseId}?error=1`);
  const { error } = await supabase.from("releases").update({ status: "in_review" }).eq("id", releaseId);
  revalidatePath(`/studio/releases/${releaseId}`);
  redirect(`/studio/releases/${releaseId}${error ? "?error=1" : "?submitted=1"}`);
}
