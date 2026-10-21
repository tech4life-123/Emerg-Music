import Link from "next/link";
import type { ReleaseCard } from "@/lib/catalog";
import { Cover } from "./cover";

export function ReleaseCardView({ r, typeLabel }: { r: ReleaseCard; typeLabel: string }) {
  return (
    <Link href={`/release/${r.id}`} className="block w-36 shrink-0 sm:w-44">
      <Cover url={r.coverUrl} seed={r.title} className="w-full" />
      <p className="mt-2 truncate text-sm font-semibold">{r.title}</p>
      <p className="truncate text-xs text-muted">{r.artistName} · {typeLabel}</p>
    </Link>
  );
}
