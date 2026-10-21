"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f-]{36}$/i;
type Ok = { ok: true } | { ok: false; error: "auth" | "failed" };

async function ctx() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function toggleLike(trackId: string, like: boolean): Promise<Ok> {
  const { supabase, user } = await ctx();
  if (!user) return { ok: false, error: "auth" };
  if (!UUID.test(trackId)) return { ok: false, error: "failed" };
  const r = like
    ? await supabase.from("favorites").upsert({ user_id: user.id, track_id: trackId }, { onConflict: "user_id,track_id", ignoreDuplicates: true })
    : await supabase.from("favorites").delete().eq("user_id", user.id).eq("track_id", trackId);
  revalidatePath("/library");
  return r.error ? { ok: false, error: "failed" } : { ok: true };
}

export async function toggleFollow(artistId: string, follow: boolean): Promise<Ok> {
  const { supabase, user } = await ctx();
  if (!user) return { ok: false, error: "auth" };
  if (!UUID.test(artistId)) return { ok: false, error: "failed" };
  const r = follow
    ? await supabase.from("artist_follows").upsert({ user_id: user.id, artist_id: artistId }, { onConflict: "user_id,artist_id", ignoreDuplicates: true })
    : await supabase.from("artist_follows").delete().eq("user_id", user.id).eq("artist_id", artistId);
  revalidatePath("/library"); revalidatePath("/artist/[slug]", "page");
  return r.error ? { ok: false, error: "failed" } : { ok: true };
}

export async function toggleBlock(artistId: string, block: boolean): Promise<Ok> {
  const { supabase, user } = await ctx();
  if (!user) return { ok: false, error: "auth" };
  if (!UUID.test(artistId)) return { ok: false, error: "failed" };
  const r = block
    ? await supabase.from("artist_blocks").upsert({ user_id: user.id, artist_id: artistId }, { onConflict: "user_id,artist_id", ignoreDuplicates: true })
    : await supabase.from("artist_blocks").delete().eq("user_id", user.id).eq("artist_id", artistId);
  return r.error ? { ok: false, error: "failed" } : { ok: true };
}

export async function createPlaylist(name: string, trackId?: string): Promise<{ ok: true; id: string } | { ok: false; error: "auth" | "failed" | "name" }> {
  const { supabase, user } = await ctx();
  if (!user) return { ok: false, error: "auth" };
  const clean = name.trim().slice(0, 80);
  if (!clean) return { ok: false, error: "name" };
  const { data, error } = await supabase.from("playlists").insert({ owner_id: user.id, name: clean }).select("id").single();
  if (error || !data) return { ok: false, error: "failed" };
  if (trackId && UUID.test(trackId)) await supabase.from("playlist_tracks").insert({ playlist_id: data.id, track_id: trackId, position: 0 });
  revalidatePath("/library");
  return { ok: true, id: data.id };
}

export async function addToPlaylist(playlistId: string, trackId: string): Promise<Ok> {
  const { supabase, user } = await ctx();
  if (!user) return { ok: false, error: "auth" };
  if (!UUID.test(playlistId) || !UUID.test(trackId)) return { ok: false, error: "failed" };
  const { count } = await supabase.from("playlist_tracks").select("track_id", { count: "exact", head: true }).eq("playlist_id", playlistId);
  const r = await supabase.from("playlist_tracks").upsert({ playlist_id: playlistId, track_id: trackId, position: count ?? 0 }, { onConflict: "playlist_id,track_id", ignoreDuplicates: true });
  revalidatePath(`/playlist/${playlistId}`);
  return r.error ? { ok: false, error: "failed" } : { ok: true };
}

export async function removeFromPlaylist(fd: FormData) {
  const { supabase, user } = await ctx();
  if (!user) redirect("/login");
  const playlistId = String(fd.get("playlistId") ?? ""), trackId = String(fd.get("trackId") ?? "");
  if (UUID.test(playlistId) && UUID.test(trackId)) await supabase.from("playlist_tracks").delete().eq("playlist_id", playlistId).eq("track_id", trackId);
  revalidatePath(`/playlist/${playlistId}`);
  redirect(`/playlist/${playlistId}`);
}

export async function deletePlaylist(fd: FormData) {
  const { supabase, user } = await ctx();
  if (!user) redirect("/login");
  const id = String(fd.get("playlistId") ?? "");
  if (UUID.test(id)) await supabase.from("playlists").delete().eq("id", id).eq("owner_id", user.id);
  revalidatePath("/library");
  redirect("/library?tab=playlists");
}

export async function createPlaylistForm(fd: FormData) {
  const r = await createPlaylist(String(fd.get("name") ?? ""));
  if (!r.ok && r.error === "auth") redirect("/login?next=/library");
  redirect(r.ok ? `/playlist/${r.id}` : "/library?tab=playlists&error=1");
}
