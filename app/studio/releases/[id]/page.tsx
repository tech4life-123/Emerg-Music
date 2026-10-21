import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getLocale, getMessages } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { RIGHTS_ITEMS } from "@/lib/rights";
import { listGenres } from "@/lib/catalog";
import { mediaUrl } from "@/lib/storage";
import { imageUploadLabels } from "@/lib/upload-labels";
import { languageLabel, languageOptions } from "@/lib/languages";
import { MAX_TRACKS, releaseIssues, type Issue } from "@/lib/release-check";
import { addTrackToRelease, deleteDraft } from "../../release-actions";
import { WizardSteps } from "@/components/studio/wizard-steps";
import { ReleaseDetailsForm } from "@/components/studio/release-details-form";
import { TrackEditor } from "@/components/studio/track-editor";
import { RightsForm } from "@/components/studio/rights-form";
import { Cover } from "@/components/cover";

export const metadata = { title: "Release" };

export default async function ReleasePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ step?: string; error?: string; submitted?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { t } = await getMessages();
  const locale = await getLocale();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await requireUser(`/studio/releases/${id}`);
  const check = await releaseIssues(supabase, id);
  if (!check) notFound();
  const { release, issues } = check;
  const w = t.studio.wizard;
  const coverUrl = mediaUrl(release.cover_path);
  const imageLabels = imageUploadLabels(t, "cover");
  const uploadLabels = { ...t.studio.upload, errors: { ...t.studio.upload.errors, notfound: w.issues.notfound } };
  const has = (...k: Issue[]) => k.some((x) => issues.includes(x));

  const { data: tracks } = await supabase.from("tracks")
    .select("id, title, track_number, audio_path, explicit, processing_status, track_credits(name, role)")
    .eq("release_id", id).order("track_number");
  const list = tracks ?? [];

  // ---- Not a draft any more: read-only status page ----
  if (release.status !== "draft") {
    return (
      <div className="flex max-w-2xl flex-col gap-6">
        <Link href="/studio" className="text-sm text-lilac underline">← {t.studio.title}</Link>
        {sp.submitted && (
          <div role="status" className="alert alert-success"><p className="font-semibold">{w.submittedTitle}</p><p className="text-sm">{w.submittedBody}</p></div>
        )}
        <div className="flex items-center gap-4">
          <Cover url={coverUrl} seed={release.title} className="h-24 w-24" />
          <div>
            <h1 className="text-3xl font-bold">{release.title}</h1>
            <p className="text-muted">{t.studio.types[release.type as "single"]} · {t.studio.statuses[release.status as "draft"]}</p>
            {release.status === "published" && <Link className="text-sm text-lilac underline" href={`/release/${release.id}`}>{w.view}</Link>}
          </div>
        </div>
        {release.status === "removed" && release.removal_reason && <p className="alert alert-danger text-sm">{t.studio.removedReason}: {release.removal_reason}</p>}
        <ol className="card divide-y divide-border">{list.map((tr) => <li key={tr.id} className="p-3 text-sm"><span className="mr-2 tabular-nums text-muted">{tr.track_number}.</span>{tr.title}</li>)}</ol>
      </div>
    );
  }

  // ---- Draft: three-step wizard ----
  const step1Done = !has("title", "genre", "language", "cover");
  const step2Done = !has("notracks", "trackTitle", "noaudio");
  const reach = (step1Done ? (step2Done ? 3 : 2) : 1) as 1 | 2 | 3;
  const wanted = Math.min(3, Math.max(1, Number(sp.step) || 1)) as 1 | 2 | 3;
  if (wanted > reach) redirect(`/studio/releases/${id}?step=${reach}`);
  const step = wanted;
  const groups = await listGenres();
  const types = t.studio.types;
  const errKey = sp.error && sp.error in w.issues ? (sp.error as keyof typeof w.issues) : sp.error ? "save" : null;
  const maxTracks = MAX_TRACKS[release.type as keyof typeof MAX_TRACKS];
  const credits = (tr: (typeof list)[number], role: string) => (tr.track_credits as { name: string; role: string }[] | null ?? []).filter((c) => c.role === role).map((c) => c.name).join(", ");
  const genreName = groups.flatMap((g) => g.genres).find((g) => g.id === release.genre_id)?.name ?? "";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <Link href="/studio" className="inline-flex min-h-11 items-center text-sm text-lilac underline">← {t.studio.title}</Link>
        <form action={deleteDraft}><input type="hidden" name="releaseId" value={release.id} />
          <button className="min-h-11 text-sm text-muted underline" type="submit">{w.deleteDraft}</button></form>
      </div>
      <h1 className="text-3xl font-bold">{step === 1 ? w.step1Title : step === 2 ? w.step2Title : w.step3Title}</h1>
      <WizardSteps current={step} releaseId={release.id} reach={reach} labels={[w.steps.release, w.steps.tracks, w.steps.review]} />
      {errKey && <p role="alert" className="alert alert-danger text-sm">{w.issues[errKey]}</p>}

      {step === 1 && (
        <ReleaseDetailsForm
          releaseId={release.id}
          initial={{ title: release.title, type: release.type, genreId: release.genre_id ?? "", language: release.language ?? "" }}
          coverUrl={coverUrl} groups={groups} languages={languageOptions(locale)} types={types}
          t={{ wizard: w, genre: t.studio.genre }} imageLabels={imageLabels}
        />
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <ul className="flex flex-col gap-4">
            {list.map((tr, i) => (
              <TrackEditor key={tr.id} trackId={tr.id} index={i} canRemove={list.length > 1}
                initial={{ title: tr.title, explicit: tr.explicit, featured: credits(tr, "featured"), writers: credits(tr, "writer"), producers: credits(tr, "producer") }}
                hasAudio={Boolean(tr.audio_path)} processing={tr.processing_status} t={t.studio} uploadLabels={uploadLabels} />
            ))}
          </ul>
          {list.length < maxTracks
            ? <form action={async () => { "use server"; await addTrackToRelease(id); redirect(`/studio/releases/${id}?step=2`); }}><button className="btn btn-secondary h-12 w-full" type="submit">+ {w.addAnother}</button></form>
            : <p className="text-sm text-muted">{w.limitReached}</p>}
          <p className="alert alert-warning text-sm">{t.studio.audioNote}</p>
          <div className="flex items-center justify-between gap-3">
            <Link className="btn btn-secondary inline-flex h-12 items-center" href={`/studio/releases/${id}?step=1`}>{w.back}</Link>
            <div className="flex flex-col items-end gap-1">
              {step2Done
                ? <Link className="btn btn-primary inline-flex h-12 min-w-40 items-center justify-center" href={`/studio/releases/${id}?step=3`}>{w.continue}</Link>
                : <button className="btn btn-primary h-12 min-w-40" disabled>{w.continue}</button>}
              {!step2Done && <span className="text-xs text-muted">{w.needStep2}</span>}
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-5">
          <p className="text-muted">{w.reviewIntro}</p>
          <div className="card flex items-center gap-4 p-3">
            <Cover url={coverUrl} seed={release.title} className="h-24 w-24" />
            <div className="min-w-0">
              <p className="truncate text-xl font-bold">{release.title}</p>
              <p className="text-sm text-muted">{types[release.type as "single"]} · {genreName} · {languageLabel(release.language, locale)}</p>
              <Link href={`/studio/releases/${id}?step=1`} className="text-sm text-lilac underline">{w.edit}</Link>
            </div>
          </div>
          <ul className="card divide-y divide-border">
            {list.map((tr) => (
              <li key={tr.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                <span className="min-w-0 truncate"><span className="mr-2 tabular-nums text-muted">{tr.track_number}.</span>{tr.title}{tr.explicit && <span className="ml-2 rounded bg-plum px-1.5 text-xs">E</span>}</span>
                <span className={tr.audio_path ? "text-success" : "text-danger"}>{tr.audio_path ? w.ready : w.needsAudio}</span>
              </li>
            ))}
          </ul>
          {issues.length > 0 && (
            <div role="alert" className="alert alert-danger text-sm"><p className="font-semibold">{w.checklist}</p>
              <ul className="mt-1 list-disc pl-5">{issues.map((i) => <li key={i}>{w.issues[i]}</li>)}</ul></div>
          )}
          <h2 className="text-xl font-bold">{w.rightsTitle}</h2>
          <RightsForm releaseId={release.id} items={RIGHTS_ITEMS[locale]} blocked={issues.length > 0} labels={{ submit: w.submit, fixFirst: w.fixFirst }} />
          <div className="rounded-xl border border-border bg-surface p-3 text-sm text-muted"><p className="font-semibold text-ivory">{w.nextTitle}</p><p>{w.nextBody}</p></div>
          <Link className="btn btn-secondary inline-flex h-12 w-fit items-center" href={`/studio/releases/${id}?step=2`}>{w.back}</Link>
        </div>
      )}
    </div>
  );
}
