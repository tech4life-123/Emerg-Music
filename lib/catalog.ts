import { createClient } from "@/lib/supabase/server";
import { mediaUrl } from "@/lib/storage";

export type CatalogTrack = {
  id: string; title: string; durationMs: number | null; audioUrl: string | null;
  artistName: string; artistSlug: string; releaseTitle: string; coverUrl: string | null;
};

type Row = {
  id: string; title: string; duration_ms: number | null; audio_path: string | null;
  artists: { name: string; slug: string } | null;
  releases: { title: string; cover_path: string | null } | null;
};
const SELECT = "id, title, duration_ms, audio_path, artists(name, slug), releases!inner(title, cover_path, status)";

function map(r: Row): CatalogTrack {
  return {
    id: r.id, title: r.title, durationMs: r.duration_ms, audioUrl: mediaUrl(r.audio_path),
    artistName: r.artists?.name ?? "", artistSlug: r.artists?.slug ?? "",
    releaseTitle: r.releases?.title ?? "", coverUrl: mediaUrl(r.releases?.cover_path),
  };
}

// RLS guarantees only published releases (and the signed-in artist's own drafts) are returned.
export async function latestTracks(limit = 24) {
  const supabase = await createClient();
  const { data } = await supabase.from("tracks").select(SELECT).eq("releases.status", "published")
    .order("created_at", { ascending: false }).limit(limit);
  return ((data ?? []) as unknown as Row[]).map(map);
}

export async function getTrack(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("tracks").select(SELECT).eq("id", id).eq("releases.status", "published").maybeSingle();
  return data ? map(data as unknown as Row) : null;
}

export async function getArtist(slug: string) {
  const supabase = await createClient();
  const { data: artist } = await supabase.from("artists").select("id, name, slug, bio, image_url").eq("slug", slug).maybeSingle();
  if (!artist) return null;
  const { data } = await supabase.from("tracks").select(SELECT).eq("artist_id", artist.id).eq("releases.status", "published")
    .order("created_at", { ascending: false });
  return { artist: { ...artist, imageUrl: mediaUrl(artist.image_url) }, tracks: ((data ?? []) as unknown as Row[]).map(map) };
}

export async function searchCatalog(query: string) {
  const q = query.trim().slice(0, 60).replace(/[%_,()\\]/g, " ");
  if (!q) return { tracks: [] as CatalogTrack[], artists: [] as { name: string; slug: string }[] };
  const supabase = await createClient();
  const [tracks, artists] = await Promise.all([
    supabase.from("tracks").select(SELECT).eq("releases.status", "published").ilike("title", `%${q}%`).limit(30),
    supabase.from("artists").select("name, slug").ilike("name", `%${q}%`).limit(10),
  ]);
  return { tracks: ((tracks.data ?? []) as unknown as Row[]).map(map), artists: artists.data ?? [] };
}
