import type { SupabaseClient } from "@supabase/supabase-js";

export const DEFAULT_RELEASE_TITLE = "Untitled release";
export const DEFAULT_TRACK_TITLE = "Untitled track";
export const MAX_TRACKS = { single: 3, ep: 6, album: 40 } as const;
export type ReleaseType = keyof typeof MAX_TRACKS;
export const isReleaseType = (v: string): v is ReleaseType => v in MAX_TRACKS;

export type Issue = "title" | "genre" | "language" | "cover" | "notracks" | "trackTitle" | "noaudio";

// What is still missing before a release can be submitted. Used to show the checklist and to guard the submit action.
export async function releaseIssues(supabase: SupabaseClient, releaseId: string) {
  const { data: release } = await supabase.from("releases").select("id, title, type, status, cover_path, language, genre_id, artist_id, removal_reason").eq("id", releaseId).maybeSingle();
  if (!release) return null;
  const { data: tracks } = await supabase.from("tracks").select("id, title, audio_path").eq("release_id", releaseId);
  const issues: Issue[] = [];
  if (!release.title || release.title === DEFAULT_RELEASE_TITLE) issues.push("title");
  if (!release.genre_id) issues.push("genre");
  if (!release.language) issues.push("language");
  if (!release.cover_path) issues.push("cover");
  if (!tracks?.length) issues.push("notracks");
  if (tracks?.some((t) => !t.title || t.title === DEFAULT_TRACK_TITLE)) issues.push("trackTitle");
  if (tracks?.some((t) => !t.audio_path)) issues.push("noaudio");
  return { release, tracks: tracks ?? [], issues };
}
