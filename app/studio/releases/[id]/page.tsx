import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getMessages } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { RIGHTS_STATEMENT } from "@/lib/rights";
import { addTrack, submitRelease } from "../../actions";
import { MediaUpload } from "@/components/media-upload";
import { listGenres } from "@/lib/catalog";
import { mediaUrl } from "@/lib/storage";

export const metadata = { title: "Release" };

export default async function ReleasePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; submitted?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { t } = await getMessages();
  const locale = await getLocale();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await requireUser(`/studio/releases/${id}`);
  const { data: release } = await supabase.from("releases").select("id, title, type, status, removal_reason, cover_path").eq("id", id).maybeSingle();
  if (!release) notFound();
  const { data: tracks } = await supabase.from("tracks").select("id, title, track_number, audio_path, genre:genres!tracks_genre_id_fkey(name)").eq("release_id", id).order("track_number");
  const groups = await listGenres();
  const imgLabels = { ...t.studio.upload, errors: { ...t.studio.upload.errors, type: t.studio.upload.imageTypeError } };
  const coverUrl = mediaUrl(release.cover_path);
  const errMsg = sp.error === "genre" ? t.studio.errorGenre :  sp.error === "rights" ? t.studio.errorRights : sp.error === "notracks" ? t.studio.errorNoTracks : sp.error === "noaudio" ? t.studio.errorNoAudio : sp.error ? t.studio.errorGeneric : null;
  const draft = release.status === "draft";
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Link href="/studio" className="text-sm text-lilac underline">← {t.studio.title}</Link>
      <div><h1 className="text-3xl font-bold">{release.title}</h1>
        <p className="mt-1 text-muted">{t.studio.types[release.type as "single"]} · {t.studio.statuses[release.status as "draft"]}</p>
        {release.status === "removed" && release.removal_reason && <p className="alert alert-danger mt-3 text-sm">{t.studio.removedReason}: {release.removal_reason}</p>}
      </div>
      {sp.submitted && <p role="status" className="alert alert-success text-sm">{t.studio.submitted}</p>}
      {errMsg && <p role="alert" className="alert alert-danger text-sm">{errMsg}</p>}
      <section className="card flex flex-wrap items-center gap-4 p-4">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-md bg-plum">{coverUrl && /* eslint-disable-next-line @next/next/no-img-element */ <img src={coverUrl} alt="" className="h-full w-full object-cover" />}</div>
        <div className="min-w-0 flex-1"><h2 className="text-lg font-bold">{t.studio.coverTitle}</h2><p className="text-sm text-muted">{t.studio.coverHint}</p>
          <MediaUpload kind="cover" targetId={release.id} hasFile={Boolean(release.cover_path)} labels={imgLabels} /></div>
      </section>
      <section>
        <h2 className="mb-3 text-xl font-bold">{t.studio.tracks}</h2>
        {tracks?.length ? <ol className="card divide-y divide-border">{tracks.map((tr) => <li key={tr.id} className="p-3"><span className="mr-2 text-muted tabular-nums">{tr.track_number}.</span>{tr.title}<span className="ml-2 text-xs text-muted">{(Array.isArray(tr.genre) ? tr.genre[0]?.name : (tr.genre as { name: string } | null)?.name) ?? ""} · {tr.audio_path ? t.studio.upload.attached : t.studio.upload.missing}</span>{draft && <MediaUpload kind="audio" targetId={tr.id} hasFile={Boolean(tr.audio_path)} labels={t.studio.upload} />}</li>)}</ol> : <p className="text-muted">{t.studio.noTracks}</p>}
        <p className="alert alert-warning mt-3 text-sm">{t.studio.audioNote}</p>
        {draft && (
          <form action={addTrack} className="card mt-3 flex flex-wrap items-end gap-3 p-4">
            <input type="hidden" name="releaseId" value={release.id} />
            <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm">{t.studio.trackTitle}<input className="input" name="title" required maxLength={120} /></label>
            <label className="flex w-full flex-col gap-1 text-sm">{t.studio.genre}
              <select className="input" name="genreId" required defaultValue="">
                <option value="" disabled>{t.studio.chooseGenre}</option>
                {groups.map((c) => <optgroup key={c.slug} label={c.name}>{c.genres.map((g) => <option key={g.slug} value={g.id}>{g.name}</option>)}</optgroup>)}
              </select>
            </label>
            <label className="flex w-full flex-col gap-1 text-sm">{t.studio.secondaryGenre}
              <select className="input" name="secondaryGenreId" defaultValue="">
                <option value="">{t.studio.none}</option>
                {groups.map((c) => <optgroup key={c.slug} label={c.name}>{c.genres.map((g) => <option key={g.slug} value={g.id}>{g.name}</option>)}</optgroup>)}
              </select>
            </label>
            <label className="flex w-20 flex-col gap-1 text-sm">{t.studio.trackNumber}<input className="input" type="number" name="trackNumber" min={1} max={99} defaultValue={(tracks?.length ?? 0) + 1} /></label>
            <button className="btn btn-secondary" type="submit">{t.studio.addTrack}</button>
          </form>
        )}
      </section>
      {draft && (
        <section>
          <h2 className="mb-3 text-xl font-bold">{t.studio.rightsTitle}</h2>
          <form action={submitRelease} className="card flex flex-col gap-4 p-5">
            <input type="hidden" name="releaseId" value={release.id} />
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="accept" required className="mt-1 accent-violet" />{RIGHTS_STATEMENT[locale]}</label>
            <button className="btn btn-primary" type="submit">{t.studio.submit}</button>
          </form>
        </section>
      )}
    </div>
  );
}
