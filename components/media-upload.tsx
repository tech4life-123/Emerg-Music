"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signUpload, confirmUpload, type UploadKind } from "@/app/studio/upload-actions";

type Labels = { choose: string; replace: string; uploading: string; done: string; optimizing?: string; optimized?: string; optimizeFailed?: string; errors: Record<string, string> };
const ACCEPT: Record<UploadKind, string> = {
  audio: "audio/mpeg,audio/mp4,audio/aac,audio/wav,audio/flac,audio/ogg,.mp3,.m4a,.wav,.flac",
  cover: "image/jpeg,image/png,image/webp",
  artist: "image/jpeg,image/png,image/webp",
  avatar: "image/jpeg,image/png,image/webp",
};

// Reads the length of an audio file in the browser (no upload needed).
function audioDurationMs(file: File): Promise<number | undefined> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const a = new Audio();
    const done = (v?: number) => { URL.revokeObjectURL(url); resolve(v); };
    a.preload = "metadata";
    a.onloadedmetadata = () => done(Number.isFinite(a.duration) ? Math.round(a.duration * 1000) : undefined);
    a.onerror = () => done(undefined);
    a.src = url;
    setTimeout(() => done(undefined), 8000);
  });
}

// PUT with a real progress bar (fetch cannot report upload progress).
function putWithProgress(url: string, file: File, onProgress: (pct: number) => void): Promise<"ok" | "denied" | "failed" | "network"> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300 ? "ok" : xhr.status === 403 ? "denied" : "failed");
    xhr.onerror = () => resolve("network");
    xhr.send(file);
  });
}

export function MediaUpload({ kind, targetId, hasFile, labels, variant = "button", onDone }: { kind: UploadKind; targetId: string; hasFile: boolean; labels: Labels; variant?: "button" | "link"; onDone?: () => void }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "optimizing" | "done" | string>("idle");
  const [pct, setPct] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setState("busy"); setPct(0);
    const duration = kind === "audio" ? await audioDurationMs(file) : undefined;
    const signed = await signUpload(kind, targetId, file.type, file.size);
    if (!signed.ok) return setState(signed.error);
    const put = await putWithProgress(signed.url, file, setPct);
    if (put !== "ok") return setState(put);
    const res = await confirmUpload(kind, targetId, signed.key, duration);
    if (!res.ok) return setState("save");
    if (input.current) input.current.value = "";
    if (kind === "audio") {
      // Make a standard and a low-data version so the track plays well on slow mobile networks.
      setState("optimizing"); router.refresh();
      try {
        const r = await fetch("/api/audio/process", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ trackId: targetId }) });
        setState(r.ok ? "optimized" : "optimizeFailed");
      } catch { setState("optimizeFailed"); }
    } else setState("done");
    router.refresh();
    onDone?.();
  }

  const busy = state === "busy" || state === "optimizing";
  const btn = variant === "link" ? "cursor-pointer text-sm font-semibold text-lilac underline" : "btn btn-secondary cursor-pointer";
  return (
    <div className="mt-2 flex flex-col gap-2 text-sm">
      <div className="flex flex-wrap items-center gap-3">
        <label className={`${btn} ${busy ? "pointer-events-none opacity-60" : ""}`}>
          {state === "busy" ? labels.uploading : hasFile ? labels.replace : labels.choose}
          <input ref={input} type="file" accept={ACCEPT[kind]} className="sr-only" disabled={busy} onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
        {state === "done" && <span role="status" className="text-success">{labels.done}</span>}
        {state === "optimized" && <span role="status" className="text-success">{labels.optimized ?? labels.done}</span>}
        {state === "optimizing" && <span role="status" className="text-muted">{labels.optimizing}</span>}
        {state === "optimizeFailed" && <span role="status" className="text-muted">{labels.optimizeFailed}</span>}
        {!["idle", "busy", "optimizing", "done", "optimized", "optimizeFailed"].includes(state) && <span role="alert" className="text-danger">{labels.errors[state] ?? labels.errors.failed}</span>}
      </div>
      {state === "busy" && (
        <div className="flex items-center gap-3" aria-live="polite">
          <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-plum">
            <div className="h-full rounded-full bg-violet transition-[width]" style={{ width: `${pct}%` }} />
          </div>
          <span className="tabular-nums text-muted">{pct}%</span>
        </div>
      )}
    </div>
  );
}
