"use client";
import Link from "next/link";
import { Pause, Play } from "lucide-react";
import type { CatalogTrack } from "@/lib/catalog";
import { Cover } from "./cover";
import { LikeButton } from "./like-button";
import { TrackMenu } from "./track-menu";
import { useLibrary } from "./library-provider";
import { usePlayer } from "./player/player-provider";

const fmt = (ms: number | null) => (ms ? `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}` : "");

export function TrackList({ tracks, playLabel, pauseLabel, showCover = true, numbered = false }: { tracks: CatalogTrack[]; playLabel: string; pauseLabel: string; showCover?: boolean; numbered?: boolean }) {
  const p = usePlayer();
  const { labels } = useLibrary();
  return (
    <ul className="flex flex-col">
      {tracks.map((t, i) => {
        const active = p.current?.id === t.id;
        const featured = t.credits.filter((c) => c.role === "featured").map((c) => c.name);
        const who = featured.length ? `${t.artistName}, ${featured.join(", ")}` : t.artistName;
        const sub = [who, t.genreName].filter(Boolean).join(" · ");
        return (
          <li key={t.id} className="flex min-h-16 items-center gap-1.5 rounded-md px-1 py-1.5 hover:bg-surface sm:gap-3">
            {numbered && <span className="w-5 shrink-0 text-center text-sm text-muted tabular-nums">{i + 1}</span>}
            {showCover && <Cover url={t.coverUrl} seed={t.title} className="h-12 w-12" />}
            <div className="ml-1 min-w-0 flex-1 sm:ml-0">
              <Link href={`/track/${t.id}`} className={`block truncate font-semibold hover:underline ${active ? "text-lilac" : ""}`}>{t.title}</Link>
              <p className="flex min-w-0 items-center gap-1.5 text-sm text-muted">
                {t.explicit && <span title={labels.explicit} aria-label={labels.explicit} className="grid h-4 w-4 shrink-0 place-items-center rounded-sm bg-muted/30 text-[10px] font-bold text-ivory">E</span>}
                <Link href={`/artist/${t.artistSlug}`} className="truncate hover:underline">{sub}</Link>
              </p>
            </div>
            <span className="hidden text-sm text-muted tabular-nums sm:block">{fmt(t.durationMs)}</span>
            <LikeButton trackId={t.id} />
            <TrackMenu track={t} />
            <button className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-violet text-ivory" aria-label={`${active && p.playing ? pauseLabel : playLabel}: ${t.title}`}
              onClick={() => (active ? p.toggle() : p.playQueue(tracks, i))}>
              {active && p.playing ? <Pause size={18} /> : <Play size={18} />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
