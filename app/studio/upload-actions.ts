"use server";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { AUDIO_TYPES, MAX_AUDIO_BYTES, presignAudioPut, r2Configured } from "@/lib/r2";

type Signed = { ok: true; url: string; key: string } | { ok: false; error: "auth" | "notfound" | "type" | "size" | "config" | "failed" };

// Step 1: validate ownership + file, hand back a short-lived signed upload URL.
export async function signAudioUpload(trackId: string, contentType: string, size: number): Promise<Signed> {
  if (!r2Configured) return { ok: false, error: "config" };
  const ext = AUDIO_TYPES[contentType];
  if (!ext) return { ok: false, error: "type" };
  if (!Number.isFinite(size) || size <= 0 || size > MAX_AUDIO_BYTES) return { ok: false, error: "size" };
  if (!/^[0-9a-f-]{36}$/i.test(trackId)) return { ok: false, error: "notfound" };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "auth" };
  // RLS: only the owning artist can see/modify their draft tracks; admins/others get nothing back.
  const { data: track } = await supabase.from("tracks").select("id, artist_id, releases!inner(status)").eq("id", trackId).single();
  const rel = Array.isArray(track?.releases) ? track.releases[0] : track?.releases;
  if (!track || rel?.status !== "draft") return { ok: false, error: "notfound" };
  const { data: owns } = await supabase.rpc("owns_artist", { a: track.artist_id });
  if (!owns) return { ok: false, error: "auth" };
  const key = `audio/${track.artist_id}/${track.id}/${randomUUID()}.${ext}`;
  try { return { ok: true, url: await presignAudioPut(key, contentType, size), key }; } catch { return { ok: false, error: "failed" }; }
}

// Step 2: after the browser finished the PUT, record the path on the track.
export async function confirmAudioUpload(trackId: string, key: string) {
  const supabase = await createClient();
  const { data: track } = await supabase.from("tracks").select("id, artist_id").eq("id", trackId).single();
  if (!track || !key.startsWith(`audio/${track.artist_id}/${track.id}/`)) return { ok: false };
  const { error } = await supabase.from("tracks").update({ audio_path: key }).eq("id", trackId);
  return { ok: !error };
}
