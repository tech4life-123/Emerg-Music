"use client";
import { useState } from "react";
import { submitForReview } from "@/app/studio/release-actions";

export function RightsForm({ releaseId, items, blocked, labels }: { releaseId: string; items: readonly string[]; blocked: boolean; labels: { submit: string; fixFirst: string } }) {
  const [checked, setChecked] = useState<boolean[]>(items.map(() => false));
  const all = checked.every(Boolean);
  return (
    <form action={submitForReview} className="flex flex-col gap-3">
      <input type="hidden" name="releaseId" value={releaseId} />
      {items.map((text, i) => (
        <label key={i} className="flex items-start gap-3 text-sm leading-snug">
          <input type="checkbox" name={`r${i + 1}`} checked={checked[i]} onChange={(e) => setChecked(checked.map((c, j) => (j === i ? e.target.checked : c)))} className="mt-0.5 h-5 w-5 shrink-0 accent-violet" />
          <span>{text}</span>
        </label>
      ))}
      <button type="submit" className="btn btn-primary mt-2 h-12" disabled={!all || blocked}>{labels.submit}</button>
      {blocked && <p className="text-xs text-muted">{labels.fixFirst}</p>}
    </form>
  );
}
