"use client";
import { useState } from "react";
import { saveTrack, removeTrack } from "@/app/studio/release-actions";
import { useAutosave } from "./use-autosave";
import { MediaUpload } from "@/components/media-upload";
import { DEFAULT_TRACK_TITLE } from "@/lib/release-check";

type Props = {
  trackId: string; index: number; canRemove: boolean;
  initial: { title: string; explicit: boolean; featured: string; writers: string; producers: string };
  hasAudio: boolean; processing: string;
  t: Record<string, any>; uploadLabels: any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

export function TrackEditor({ trackId, index, canRemove, initial, hasAudio, processing, t, uploadLabels }: Props) {
  const w = t.wizard;
  const [title, setTitle] = useState(initial.title === DEFAULT_TRACK_TITLE ? "" : initial.title);
  const [explicit, setExplicit] = useState(initial.explicit);
  const [featured, setFeatured] = useState(initial.featured);
  const [writers, setWriters] = useState(initial.writers);
  const [producers, setProducers] = useState(initial.producers);
  const [removing, setRemoving] = useState(false);
  const { status, error } = useAutosave({ title, explicit, featured, writers, producers }, (v) => (v.title.trim() ? saveTrack(trackId, v) : Promise.resolve({ ok: true as const })));

  async function remove() {
    if (!confirm(w.confirmRemove)) return;
    setRemoving(true);
    await removeTrack(trackId);
    location.reload();
  }
  const audioState = !hasAudio ? w.noAudioYet : processing === "ready" ? w.optimizedOk : processing === "failed" ? w.optimizedFailed : w.optimizedPending;

  return (
    <li className="card flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold">{w.trackN.replace("{n}", String(index + 1))}</h3>
        <div className="flex items-center gap-3 text-xs text-muted">
          <span role="status">{status === "saving" ? w.saving : status === "saved" ? w.saved : status === "error" ? (w.issues[error ?? "save"] ?? w.saveFailed) : ""}</span>
          {canRemove && <button type="button" onClick={remove} disabled={removing} className="min-h-11 px-2 text-sm text-danger underline">{w.removeTrack}</button>}
        </div>
      </div>

      <label className="flex flex-col gap-1 text-sm font-medium">{w.trackTitle}
        <input className="input h-12 text-base" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} autoComplete="off" />
      </label>

      <div className="rounded-lg border border-border p-3">
        <p className="text-sm font-medium">{w.audio}</p>
        <p className="text-xs text-muted">{w.audioHint}</p>
        <p className={`mt-1 text-sm ${hasAudio ? "text-success" : "text-muted"}`}>{audioState}</p>
        <MediaUpload kind="audio" targetId={trackId} hasFile={hasAudio} labels={uploadLabels} />
      </div>

      <label className="flex min-h-12 cursor-pointer items-center justify-between gap-4 text-sm">
        <span><span className="block font-medium">{w.explicit}</span><span className="text-xs text-muted">{w.explicitHint}</span></span>
        <input type="checkbox" role="switch" checked={explicit} onChange={(e) => setExplicit(e.target.checked)} className="h-6 w-11 shrink-0 accent-violet" />
      </label>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm font-medium">{w.featured}<input className="input" value={featured} onChange={(e) => setFeatured(e.target.value)} maxLength={400} /></label>
        <label className="flex flex-col gap-1 text-sm font-medium">{w.writers}<input className="input" value={writers} onChange={(e) => setWriters(e.target.value)} maxLength={400} /></label>
        <label className="flex flex-col gap-1 text-sm font-medium">{w.producers}<input className="input" value={producers} onChange={(e) => setProducers(e.target.value)} maxLength={400} /></label>
      </div>
      <p className="-mt-2 text-xs text-muted">{w.namesHint}</p>
    </li>
  );
}
