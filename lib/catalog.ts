import { createClient } from "@/lib/supabase/server";
import { mediaUrl } from "@/lib/storage";

export type CatalogTrack = {
  id: string; title: string; durationMs: number | null; audioUrl: string | null;
  artistName: string; artistSlug: string; artistImageUrl: string | null;
  releaseId: string; releaseTitle: string; releaseType: string; coverUrl: string | null; releasedAt: string;
  genreName: string | null; genreSlug: string | null; categoryName: string | null; categorySlug: string | null;
  secondaryGenreName: string | null; trackNumber: number;
};

type Row = {
  id: string; title: string; duration_ms: number | null; audio_path: string | null; track_number: number;
  artists: { name: string; slug: string; image_url: string | null } | null;
  releases: { id: string; title: string; type: string; cover_path: string | null; created_at: string } | null;
  genre: { name: string; slug: string; category: { name: string; slug: string } | null } | null;
  secondary: { name: string } | null;
};
const SELECT = `id, title, duration_ms, audio_path, track_number,
  artists(name, slug, image_url),
  releases!inner(id, title, type, cover_path, created_at, status),
  genre:genres!tracks_genre_id_fkey(name, slug, category:genre_categories(name, slug)),
  secondary:genres!tracks_secondary_genre_id_fkey(name)`;

function map(r: Row): CatalogTrack {
  return {
    id: r.id, title: r.title, durationMs: r.duration_ms, audioUrl: mediaUrl(r.audio_path), trackNumber: r.track_number,
    artistName: r.artists?.name ?? "", artistSlug: r.artists?.slug ?? "", artistImageUrl: mediaUrl(r.artists?.image_url),
    releaseId: r.releases?.id ?? "", releaseTitle: r.releases?.title ?? "", releaseType: r.releases?.type ?? "single",
    coverUrl: mediaUrl(r.releases?.cover_path), releasedAt: r.releases?.created_at ?? "",
    genreName: r.genre?.name ?? null, genreSlug: r.genre?.slug ?? null,
    categoryName: r.genre?.category?.name ?? null, categorySlug: r.genre?.category?.slug ?? null,
    secondaryGenreName: r.secondary?.name ?? null,
  };
}
const rows = (d: unknown) => ((d ?? []) as Row[]).map(map);
const UUID = /^[0-9a-f-]{36}$/i;

// RLS guarantees only published releases (and the signed-in artist's own drafts) are returned; we also filter explicitly.
export async function latestTracks(limit = 24) {
  const supabase = await createClient();
  const { data } = await supabase.from("tracks").select(SELECT).eq("releases.status", "published").order("created_at", { ascending: false }).limit(limit);
  return rows(data);
}

export async function getTrack(id: string) {
  if (!UUID.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("tracks").select(SELECT).eq("id", id).eq("releases.status", "published").maybeSingle();
  return data ? map(data as unknown as Row) : null;
}

export type ReleaseCard = { id: string; title: string; type: string; coverUrl: string | null; artistName: string; artistSlug: string; year: string; genreName: string | null };
const RSELECT = "id, title, type, cover_path, created_at, artists(name, slug), tracks(genre:genres!tracks_genre_id_fkey(name))";
type RRow = { id: string; title: string; type: string; cover_path: string | null; created_at: string; artists: { name: string; slug: string } | null; tracks: { genre: { name: string } | null }[] };
const rmap = (r: RRow): ReleaseCard => ({
  id: r.id, title: r.title, type: r.type, coverUrl: mediaUrl(r.cover_path), artistName: r.artists?.name ?? "", artistSlug: r.artists?.slug ?? "",
  year: r.created_at.slice(0, 4), genreName: r.tracks?.[0]?.genre?.name ?? null,
});

export async function latestReleases(limit = 12) {
  const supabase = await createClient();
  const { data } = await supabase.from("releases").select(RSELECT).eq("status", "published").order("created_at", { ascending: false }).limit(limit);
  return ((data ?? []) as unknown as RRow[]).map(rmap);
}

export async function getRelease(id: string) {
  if (!UUID.test(id)) return null;
  const supabase = await createClient();
  const { data: rel } = await supabase.from("releases").select(RSELECT).eq("id", id).eq("status", "published").maybeSingle();
  if (!rel) return null;
  const { data } = await supabase.from("tracks").select(SELECT).eq("release_id", id).eq("releases.status", "published").order("track_number");
  return { release: rmap(rel as unknown as RRow), tracks: rows(data) };
}

export async function getArtist(slug: string) {
  const supabase = await createClient();
  const { data: artist } = await supabase.from("artists").select("id, name, slug, bio, image_url").eq("slug", slug).maybeSingle();
  if (!artist) return null;
  const [{ data }, { data: rels }] = await Promise.all([
    supabase.from("tracks").select(SELECT).eq("artist_id", artist.id).eq("releases.status", "published").order("created_at", { ascending: false }),
    supabase.from("releases").select(RSELECT).eq("artist_id", artist.id).eq("status", "published").order("created_at", { ascending: false }),
  ]);
  return { artist: { ...artist, imageUrl: mediaUrl(artist.image_url) }, tracks: rows(data), releases: ((rels ?? []) as unknown as RRow[]).map(rmap) };
}

export type GenreGroup = { slug: string; name: string; genres: { id: string; slug: string; name: string }[] };
export async function listGenres(): Promise<GenreGroup[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("genre_categories").select("slug, name, sort, genres(id, slug, name, sort)").order("sort");
  return ((data ?? []) as unknown as (GenreGroup & { genres: { id: string; slug: string; name: string; sort: number }[] })[])
    .map((c) => ({ slug: c.slug, name: c.name, genres: [...c.genres].sort((a, b) => a.sort - b.sort) }));
}

// A genre slug or a category slug, whichever matches.
export async function tracksByGenreOrCategory(slug: string) {
  const supabase = await createClient();
  const { data: g } = await supabase.from("genres").select("id, name").eq("slug", slug).maybeSingle();
  if (g) {
    const { data } = await supabase.from("tracks").select(SELECT).eq("releases.status", "published").or(`genre_id.eq.${g.id},secondary_genre_id.eq.${g.id}`).order("created_at", { ascending: false }).limit(60);
    return { title: g.name, tracks: rows(data) };
  }
  const { data: c } = await supabase.from("genre_categories").select("id, name, genres(id)").eq("slug", slug).maybeSingle();
  if (!c) return null;
  const ids = (c.genres as { id: string }[]).map((x) => x.id);
  if (!ids.length) return { title: c.name, tracks: [] as CatalogTrack[] };
  const { data } = await supabase.from("tracks").select(SELECT).eq("releases.status", "published").in("genre_id", ids).order("created_at", { ascending: false }).limit(60);
  return { title: c.name, tracks: rows(data) };
}

export async function searchCatalog(query: string) {
  const q = query.trim().slice(0, 60).replace(/[%_,()\\]/g, " ");
  if (!q) return { tracks: [] as CatalogTrack[], artists: [] as { name: string; slug: string }[] };
  const supabase = await createClient();
  const [tracks, artists] = await Promise.all([
    supabase.from("tracks").select(SELECT).eq("releases.status", "published").ilike("title", `%${q}%`).limit(30),
    supabase.from("artists").select("name, slug").ilike("name", `%${q}%`).limit(10),
  ]);
  return { tracks: rows(tracks.data), artists: artists.data ?? [] };
}

export async function featuredArtists(limit = 12) {
  const supabase = await createClient();
  const { data } = await supabase.from("artists").select("name, slug, image_url, releases!inner(status)").eq("releases.status", "published").limit(limit);
  return ((data ?? []) as unknown as { name: string; slug: string; image_url: string | null }[]).map((a) => ({ name: a.name, slug: a.slug, imageUrl: mediaUrl(a.image_url) }));
}
