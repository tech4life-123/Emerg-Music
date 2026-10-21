"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUpload, confirmUpload, type UploadKind } from "@/app/studio/upload-actions";

type Labels = { choose: string; replace: string; uploading: string; done: string; errors: Record<string, string> };
const ACCEPT: Record<UploadKind, string> = {
  audio: "audio/mpeg,audio/mp4,audio/aac,audio/wav,audio/flac,audio/ogg,.mp3,.m4a,.wav,.flac",
  cover: "image/jpeg,image/png,image/webp",
  artist: "image/jpeg,image/png,image/webp",
};

export function MediaUpload({ kind, targetId, hasFile, labels }: { kind: UploadKind; targetId: string; hasFile: boolean; labels: Labels }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "done" | string>("idle");

  async function onFile(file: File | undefined) {
    if (!file) return;
    setState("busy");
    const signed = await signUpload(kind, targetId, file.type, file.size);
    if (!signed.ok) return setState(signed.error);
    try {
      const put = await fetch(signed.url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!put.ok) return setState(put.status === 403 ? "denied" : "failed");
    } catch { return setState("network"); }
    const res = await confirmUpload(kind, targetId, signed.key);
    if (!res.ok) return setState("save");
    setState("done");
    router.refresh();
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
      <label className="btn btn-secondary cursor-pointer">
        {state === "busy" ? labels.uploading : hasFile ? labels.replace : labels.choose}
        <input type="file" accept={ACCEPT[kind]} className="sr-only" disabled={state === "busy"} onChange={(e) => onFile(e.target.files?.[0])} />
      </label>
      {state === "done" && <span role="status" className="text-success">{labels.done}</span>}
      {state !== "idle" && state !== "busy" && state !== "done" && <span role="alert" className="text-danger">{labels.errors[state] ?? labels.errors.failed}</span>}
    </div>
  );
}
