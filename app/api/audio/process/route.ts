import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@/lib/supabase/server";
import { downloadObject, uploadFile, r2Configured } from "@/lib/r2";
import { transcodeToAac } from "@/lib/transcode";

// Creates a standard (128 kbps) and a low (64 kbps) AAC version of an uploaded track,
// so listeners on slow or expensive mobile data can stream smoothly. Runs as the signed-in artist (RLS applies).
export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  const { trackId } = (await req.json().catch(() => ({}))) as { trackId?: string };
  if (!trackId || !/^[0-9a-f-]{36}$/i.test(trackId)) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  if (!r2Configured) return NextResponse.json({ error: "config" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });
  const { data: track } = await supabase.from("tracks").select("id, artist_id, audio_path").eq("id", trackId).maybeSingle();
  if (!track?.audio_path) return NextResponse.json({ error: "notfound" }, { status: 404 });

  const set = (status: string, low: string | null, std: string | null, ms: number | null) =>
    supabase.rpc("set_track_audio_variants", { p_track: track.id, p_status: status, p_low: low, p_std: std, p_duration_ms: ms });
  const first = await set("processing", null, null, null);
  if (first.error) return NextResponse.json({ error: "auth" }, { status: 403 });

  const dir = await mkdtemp(join(tmpdir(), "emerg-"));
  try {
    const src = join(dir, "source");
    await downloadObject(track.audio_path, src);
    const base = `audio/${track.artist_id}/${track.id}/${randomUUID()}`;
    const stdOut = join(dir, "std.m4a"), lowOut = join(dir, "low.m4a");
    const ms = await transcodeToAac(src, stdOut, "128k");
    await transcodeToAac(src, lowOut, "64k");
    const stdKey = `${base}-std.m4a`, lowKey = `${base}-low.m4a`;
    await uploadFile(stdKey, stdOut, "audio/mp4");
    await uploadFile(lowKey, lowOut, "audio/mp4");
    const done = await set("ready", lowKey, stdKey, ms > 0 ? ms : null);
    if (done.error) throw new Error(done.error.message);
    return NextResponse.json({ ok: true, durationMs: ms });
  } catch (e) {
    await set("failed", null, null, null);
    return NextResponse.json({ error: "failed", detail: e instanceof Error ? e.message : "unknown" }, { status: 500 });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
