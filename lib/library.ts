import "server-only";
import { createClient } from "@/lib/supabase/server";

export type LibraryState = {
  likedIds: string[]; followingIds: string[]; blockedIds: string[];
  playlists: { id: string; name: string }[];
};

// What the signed-in listener has liked, followed, muted and their playlists. Null for guests.
export async function getLibraryState(userId: string | undefined): Promise<LibraryState | null> {
  if (!userId) return null;
  const supabase = await createClient();
  const [liked, follows, blocks, lists] = await Promise.all([
    supabase.from("favorites").select("track_id").eq("user_id", userId).limit(2000),
    supabase.from("artist_follows").select("artist_id").eq("user_id", userId).limit(2000),
    supabase.from("artist_blocks").select("artist_id").eq("user_id", userId).limit(500),
    supabase.from("playlists").select("id, name").eq("owner_id", userId).order("created_at", { ascending: false }).limit(200),
  ]);
  return {
    likedIds: (liked.data ?? []).map((r) => r.track_id),
    followingIds: (follows.data ?? []).map((r) => r.artist_id),
    blockedIds: (blocks.data ?? []).map((r) => r.artist_id),
    playlists: lists.data ?? [],
  };
}
