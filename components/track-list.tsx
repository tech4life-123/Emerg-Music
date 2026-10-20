"use client";
import Link from "next/link";
import { Pause, Play } from "lucide-react";
import type { CatalogTrack } from "@/lib/catalog";
import { usePlayer } from "./player/player-provider";

export function TrackList({ tracks, playLabel, pauseLabel }: { tracks: CatalogTrack[]; playLabel: string; pauseLabel: string }) {
  const p = usePlayer();
  return (
    <ul className="card divide-y divide-border">
      {tracks.map((t, i) => {
        const active = p.current?.id === t.id;
        return (
          <li key={t.id} className="flex items-center gap-3 p-3">
            <button className="btn btn-secondary !p-2" aria-label={`${active && p.playing ? pauseLabel : playLabel}: ${t.title}`}
              onClick={() => (active ? p.toggle() : p.playQueue(tracks, i))}>
              {active && p.playing ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <div className="min-w-0 flex-1">
              <Link href={`/track/${t.id}`} className="block truncate font-semibold hover:underline">{t.title}</Link>
              <Link href={`/artist/${t.artistSlug}`} className="block truncate text-sm text-muted hover:underline">{t.artistName}</Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
