"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { RIGHTS_VERSION } from "@/lib/rights";
import { isReleaseLanguage } from "@/lib/languages";
import { DEFAULT_RELEASE_TITLE, DEFAULT_TRACK_TITLE, MAX_TRACKS, isReleaseType, releaseIssues } from "@/lib/release-check";

const UUID = /^[0-9a-f-]{36}$/i;
type Result = { ok: true } | { ok: false; error: string };

async function context() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

// Creates an empty draft right away (like Spotify for Artists) and opens step 1.
export async function startRelease() {
  const { supabase, user } = await context();
  if (!user) redirect("/login?next=/studio");
  const { data: artist } = await supabase.from("artists").select("id").eq("owner_id", user.id).maybeSingle();
  if (!artist) redirect("/studio");
  const { data, error } = await supabase.from("releases").insert({ artist_id: artist.id, title: DEFAULT_RELEASE_TITLE, type: "single", status: "draft" }).select("id").single();
  if (error || !data) redirect("/studio?error=1");
  redirect(`/studio/releases/${data.id}?step=1`);
}

export async function saveReleaseDetails(releaseId: string, input: { title: string; type: string; genreId: string; language: string }): Promise<Result> {
  const { supabase, user } = await context();
  if (!user) return { ok: false, error: "auth" };
  if (!UUID.test(releaseId)) return { ok: false, error: "notfound" };
  const title = input.title.trim().slice(0, 120);
  if (!title) return { ok: false, error: "title" };
  if (!isReleaseType(input.type)) return { ok: false, error: "type" };
  if (input.genreId && !UUID.test(input.genreId)) return { ok: false, error: "genre" };
  if (input.language && !isReleaseLanguage(input.language)) return { ok: false, error: "language" };
  const { count } = await supabase.from("tracks").select("id", { count: "exact", head: true }).eq("release_id", releaseId);
  if ((count ?? 0) > MAX_TRACKS[input.type]) return { ok: false, error: "toomany" };
  const { data, error } = await supabase.from("releases")
    .update({ title, type: input.type, genre_id: input.genreId || null, language: input.language || null })
    .eq("id", releaseId).eq("status", "draft").select("id");
  if (error || !data?.length) return { ok: false, error: "save" };
  // Tracks inherit the release's main genre.
  if (input.genreId) await supabase.from("tracks").update({ genre_id: input.genreId }).eq("release_id", releaseId);
  revalidatePath(`/studio/releases/${releaseId}`);
  return { ok: true };
}

export async function addTrackToRelease(releaseId: string): Promise<Result> {
  const { supabase, user } = await context();
  if (!user) return { ok: false, error: "auth" };
  const { data: release } = await supabase.from("releases").select("id, artist_id, type, status, genre_id").eq("id", releaseId).maybeSingle();
  if (!release || release.status !== "draft") return { ok: false, error: "notfound" };
  if (!release.genre_id) return { ok: false, error: "genre" };
  const { count } = await supabase.from("tracks").select("id", { count: "exact", head: true }).eq("release_id", releaseId);
  const n = count ?? 0;
  if (n >= MAX_TRACKS[release.type as keyof typeof MAX_TRACKS]) return { ok: false, error: "toomany" };
  const { error } = await supabase.from("tracks").insert({ release_id: release.id, artist_id: release.artist_id, title: DEFAULT_TRACK_TITLE, track_number: n + 1, genre_id: release.genre_id });
  if (error) return { ok: false, error: "save" };
  revalidatePath(`/studio/releases/${releaseId}`);
  return { ok: true };
}

const names = (s: string) => [...new Set(s.split(/[,\n;]+/).map((x) => x.trim().slice(0, 120)).filter(Boolean))].slice(0, 8);

export async function saveTrack(trackId: string, input: { title: string; explicit: boolean; featured: string; writers: string; producers: string }): Promise<Result> {
  const { supabase, user } = await context();
  if (!user) return { ok: false, error: "auth" };
  if (!UUID.test(trackId)) return { ok: false, error: "notfound" };
  const title = input.title.trim().slice(0, 120);
  if (!title) return { ok: false, error: "title" };
  const { data: track } = await supabase.from("tracks").select("id, release_id, releases!inner(status)").eq("id", trackId).maybeSingle();
  const rel = Array.isArray(track?.releases) ? track.releases[0] : track?.releases;
  if (!track || rel?.status !== "draft") return { ok: false, error: "notfound" };
  const up = await supabase.from("tracks").update({ title, explicit: Boolean(input.explicit) }).eq("id", trackId);
  if (up.error) return { ok: false, error: "save" };

  const rows: { track_id: string; name: string; role: string; artist_id: string | null }[] = [];
  for (const [role, list] of [["featured", names(input.featured)], ["writer", names(input.writers)], ["producer", names(input.producers)]] as const) {
    for (const name of list) {
      let artistId: string | null = null;
      if (role === "featured") {
        // Link a featured artist to their Emerg Music page when the name matches an approved artist exactly (case-insensitive).
        const { data: match } = await supabase.from("artists").select("id").ilike("name", name.replace(/[%_\\]/g, "\\$&")).eq("status", "approved").limit(1);
        artistId = match?.[0]?.id ?? null;
      }
      rows.push({ track_id: trackId, name, role, artist_id: artistId });
    }
  }
  const del = await supabase.from("track_credits").delete().eq("track_id", trackId).in("role", ["featured", "writer", "producer"]);
  if (del.error) return { ok: false, error: "save" };
  if (rows.length) { const ins = await supabase.from("track_credits").insert(rows); if (ins.error) return { ok: false, error: "save" }; }
  revalidatePath(`/studio/releases/${track.release_id}`);
  return { ok: true };
}

export async function removeTrack(trackId: string): Promise<Result> {
  const { supabase, user } = await context();
  if (!user) return { ok: false, error: "auth" };
  const { data: track } = await supabase.from("tracks").select("id, release_id, releases!inner(status)").eq("id", trackId).maybeSingle();
  const rel = Array.isArray(track?.releases) ? track.releases[0] : track?.releases;
  if (!track || rel?.status !== "draft") return { ok: false, error: "notfound" };
  const del = await supabase.from("tracks").delete().eq("id", trackId);
  if (del.error) return { ok: false, error: "save" };
  const { data: rest } = await supabase.from("tracks").select("id").eq("release_id", track.release_id).order("track_number");
  for (const [i, r] of (rest ?? []).entries()) await supabase.from("tracks").update({ track_number: i + 1 }).eq("id", r.id);
  revalidatePath(`/studio/releases/${track.release_id}`);
  return { ok: true };
}

export async function deleteDraft(fd: FormData) {
  const { supabase, user } = await context();
  if (!user) redirect("/login");
  const id = String(fd.get("releaseId") ?? "");
  if (UUID.test(id)) await supabase.from("releases").delete().eq("id", id).eq("status", "draft");
  redirect("/studio");
}

export async function submitForReview(fd: FormData) {
  const { supabase, user } = await context();
  if (!user) redirect("/login");
  const id = String(fd.get("releaseId") ?? "");
  if (!UUID.test(id)) redirect("/studio");
  const back = (e: string) => redirect(`/studio/releases/${id}?step=3&error=${e}`);
  if (!(fd.get("r1") === "on" && fd.get("r2") === "on" && fd.get("r3") === "on")) back("rights");
  const check = await releaseIssues(supabase, id);
  if (!check || check.release.status !== "draft") redirect("/studio");
  if (check.issues.length) back(check.issues[0]);
  const decl = await supabase.from("rights_declarations").insert({ release_id: id, user_id: user.id, statement_version: RIGHTS_VERSION });
  if (decl.error) back("save");
  const { error } = await supabase.from("releases").update({ status: "in_review" }).eq("id", id);
  if (error) back("save");
  revalidatePath("/studio");
  redirect(`/studio/releases/${id}?submitted=1`);
}
