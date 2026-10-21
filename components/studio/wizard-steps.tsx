import Link from "next/link";

// Three-step indicator: Release > Tracks > Review. Completed steps link back.
export function WizardSteps({ current, releaseId, labels, reach }: { current: 1 | 2 | 3; releaseId: string; labels: [string, string, string]; reach: 1 | 2 | 3 }) {
  return (
    <ol className="flex items-center gap-2 text-sm" aria-label="Steps">
      {labels.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const done = n < current, on = n === current, canGo = n <= reach && n !== current;
        const dot = <span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-semibold ${done ? "bg-success text-night" : on ? "bg-violet text-ivory" : "bg-plum text-muted"}`}>{done ? "✓" : n}</span>;
        const inner = <span className="flex items-center gap-2">{dot}<span className={on ? "font-semibold" : "text-muted"}>{label}</span></span>;
        return (
          <li key={label} className="flex items-center gap-2" aria-current={on ? "step" : undefined}>
            {canGo ? <Link href={`/studio/releases/${releaseId}?step=${n}`} className="hover:underline">{inner}</Link> : inner}
            {n < 3 && <span className="text-muted" aria-hidden>›</span>}
          </li>
        );
      })}
    </ol>
  );
}
