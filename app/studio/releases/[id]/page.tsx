import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getMessages } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { RIGHTS_STATEMENT } from "@/lib/rights";
import { addTrack, submitRelease } from "../../actions";

export const metadata = { title: "Release" };

export default async function ReleasePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; submitted?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { t } = await getMessages();
  const locale = await getLocale();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await requireUser(`/studio/releases/${id}`);
  const { data: release } = await supabase.from("releases").select("id, title, type, status, removal_reason").eq("id", id).maybeSingle();
  if (!release) notFound();
  const { data: tracks } = await supabase.from("tracks").select("id, title, track_number, audio_path").eq("release_id", id).order("track_number");
  const errMsg = sp.error === "rights" ? t.studio.errorRights : sp.error === "notracks" ? t.studio.errorNoTracks : sp.error ? t.studio.errorGeneric : null;
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
      <section>
        <h2 className="mb-3 text-xl font-bold">{t.studio.tracks}</h2>
        {tracks?.length ? <ol className="card divide-y divide-border">{tracks.map((tr) => <li key={tr.id} className="p-3"><span className="mr-2 text-muted tabular-nums">{tr.track_number}.</span>{tr.title}</li>)}</ol> : <p className="text-muted">{t.studio.noTracks}</p>}
        <p className="alert alert-warning mt-3 text-sm">{t.studio.audioNote}</p>
        {draft && (
          <form action={addTrack} className="card mt-3 flex flex-wrap items-end gap-3 p-4">
            <input type="hidden" name="releaseId" value={release.id} />
            <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm">{t.studio.trackTitle}<input className="input" name="title" required maxLength={120} /></label>
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
