"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveReleaseDetails } from "@/app/studio/release-actions";
import { useAutosave } from "./use-autosave";
import { MediaUpload } from "@/components/media-upload";
import { Cover } from "@/components/cover";
import { DEFAULT_RELEASE_TITLE } from "@/lib/release-check";

type Group = { slug: string; name: string; genres: { id: string; slug: string; name: string }[] };
type Props = {
  releaseId: string; initial: { title: string; type: string; genreId: string; language: string };
  coverUrl: string | null; groups: Group[]; languages: { code: string; label: string }[];
  types: Record<"single" | "ep" | "album", string>;
  t: { wizard: Record<string, any>; genre: string }; // eslint-disable-line @typescript-eslint/no-explicit-any
  imageLabels: any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

export function ReleaseDetailsForm({ releaseId, initial, coverUrl, groups, languages, types, t, imageLabels }: Props) {
  const router = useRouter();
  const w = t.wizard;
  const [title, setTitle] = useState(initial.title === DEFAULT_RELEASE_TITLE ? "" : initial.title);
  const [type, setType] = useState(initial.type);
  const [genreId, setGenreId] = useState(initial.genreId);
  const [language, setLanguage] = useState(initial.language);
  const value = { title, type, genreId, language };
  const { status, error, flush } = useAutosave(value, (v) => (v.title.trim() ? saveReleaseDetails(releaseId, v) : Promise.resolve({ ok: true as const })));
  const complete = Boolean(title.trim() && type && genreId && language && coverUrl);

  async function next() {
    if (!(await flush())) return;
    router.push(`/studio/releases/${releaseId}?step=2`);
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="card flex flex-wrap items-center gap-4 p-4">
        <Cover url={coverUrl} seed={title || releaseId} className="h-28 w-28" />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold">{w.artworkTitle}</h2>
          <p className="text-sm text-muted">{w.artworkHint}</p>
          <MediaUpload kind="cover" targetId={releaseId} hasFile={Boolean(coverUrl)} labels={imageLabels} />
        </div>
      </section>

      <div className="flex flex-col gap-5">
        <label className="flex flex-col gap-1 text-sm font-medium">{w.titleLabel}
          <input className="input h-12 text-base" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} autoComplete="off" />
          <span className="text-xs font-normal text-muted">{w.titleHint}</span>
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">{w.typeLabel}</legend>
          <div className="grid grid-cols-3 gap-2">
            {(["single", "ep", "album"] as const).map((k) => (
              <label key={k} className={`flex min-h-14 cursor-pointer flex-col items-center justify-center rounded-lg border px-2 py-2 text-center ${type === k ? "border-violet bg-plum" : "border-border"}`}>
                <input type="radio" name="type" value={k} checked={type === k} onChange={() => setType(k)} className="sr-only" />
                <span className="font-semibold">{types[k]}</span>
                <span className="text-xs text-muted">{w.typeHint[k]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex flex-col gap-1 text-sm font-medium">{w.genreLabel}
          <select className="input h-12 text-base" value={genreId} onChange={(e) => setGenreId(e.target.value)}>
            <option value="" disabled>{w.chooseGenre}</option>
            {groups.map((c) => <optgroup key={c.slug} label={c.name}>{c.genres.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</optgroup>)}
          </select>
          <span className="text-xs font-normal text-muted">{w.genreHint}</span>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">{w.languageLabel}
          <select className="input h-12 text-base" value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="" disabled>{w.chooseLanguage}</option>
            {languages.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span role="status" className={`text-sm ${status === "error" ? "text-danger" : "text-muted"}`}>
          {status === "saving" ? w.saving : status === "saved" ? w.saved : status === "error" ? (w.issues[error ?? "save"] ?? w.saveFailed) : ""}
        </span>
        <div className="flex flex-col items-end gap-1">
          <button type="button" className="btn btn-primary h-12 min-w-40" disabled={!complete || status === "saving"} onClick={next}>{w.continue}</button>
          {!complete && <span className="text-xs text-muted">{w.needStep1}</span>}
        </div>
      </div>
    </div>
  );
}
