"use server";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { AUDIO_TYPES, IMAGE_TYPES, MAX_AUDIO_BYTES, MAX_IMAGE_BYTES, presignAudioPut, r2Configured } from "@/lib/r2";

export type UploadKind = "audio" | "cover" | "artist" | "avatar";
type Signed = { ok: true; url: string; key: string } | { ok: false; error: "auth" | "notfound" | "type" | "size" | "config" | "failed" };
const UUID = /^[0-9a-f-]{36}$/i;

// Step 1: check the file and that the caller owns the target, then hand back a short-lived signed upload URL.
// targetId is the track id (audio), release id (cover), artist id (artist photo) or ignored (profile photo = the caller).
export async function signUpload(kind: UploadKind, targetId: string, contentType: string, size: number): Promise<Signed> {
  if (!r2Configured) return { ok: false, error: "config" };
  const types = kind === "audio" ? AUDIO_TYPES : IMAGE_TYPES;
  const ext = types[contentType];
  if (!ext) return { ok: false, error: "type" };
  if (!Number.isFinite(size) || size <= 0 || size > (kind === "audio" ? MAX_AUDIO_BYTES : MAX_IMAGE_BYTES)) return { ok: false, error: "size" };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "auth" };

  let key = "";
  if (kind === "avatar") {
    key = `avatars/${user.id}/${randomUUID()}.${ext}`;
  } else {
    if (!UUID.test(targetId)) return { ok: false, error: "notfound" };
    let artistId: string | undefined;
    if (kind === "audio") {
      const { data: track } = await supabase.from("tracks").select("id, artist_id, releases!inner(status)").eq("id", targetId).single();
      const rel = Array.isArray(track?.releases) ? track.releases[0] : track?.releases;
      if (!track || rel?.status !== "draft") return { ok: false, error: "notfound" };
      artistId = track.artist_id; key = `audio/${artistId}/${track.id}/${randomUUID()}.${ext}`;
    } else if (kind === "cover") {
      const { data: rel } = await supabase.from("releases").select("id, artist_id, status").eq("id", targetId).single();
      if (!rel || rel.status !== "draft") return { ok: false, error: "notfound" };
      artistId = rel.artist_id; key = `covers/${artistId}/${rel.id}/${randomUUID()}.${ext}`;
    } else {
      const { data: artist } = await supabase.from("artists").select("id").eq("id", targetId).eq("owner_id", user.id).single();
      if (!artist) return { ok: false, error: "notfound" };
      artistId = artist.id; key = `artists/${artist.id}/${randomUUID()}.${ext}`;
    }
    const { data: owns } = await supabase.rpc("owns_artist", { a: artistId });
    if (!owns) return { ok: false, error: "auth" };
  }
  try { return { ok: true, url: await presignAudioPut(key, contentType, size), key }; } catch { return { ok: false, error: "failed" }; }
}

// Step 2: after the browser finished the PUT, record the path. The database also checks the folder.
export async function confirmUpload(kind: UploadKind, targetId: string, key: string, durationMs?: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  if (kind === "avatar") {
    const { error } = await supabase.from("profiles").update({ avatar_url: key }).eq("id", user.id);
    return { ok: !error };
  }
  const table = kind === "audio" ? "tracks" : kind === "cover" ? "releases" : "artists";
  const column = kind === "audio" ? "audio_path" : kind === "cover" ? "cover_path" : "image_url";
  const patch: Record<string, unknown> = { [column]: key };
  if (kind === "audio" && Number.isFinite(durationMs) && durationMs! > 0 && durationMs! < 6 * 3600 * 1000) patch.duration_ms = Math.round(durationMs!);
  const { error } = await supabase.from(table).update(patch).eq("id", targetId);
  return { ok: !error };
}
