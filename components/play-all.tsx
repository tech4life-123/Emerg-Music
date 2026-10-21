"use client";
import { Pause, Play } from "lucide-react";
import type { CatalogTrack } from "@/lib/catalog";
import { usePlayer } from "./player/player-provider";

export function PlayAll({ tracks, playLabel, pauseLabel }: { tracks: CatalogTrack[]; playLabel: string; pauseLabel: string }) {
  const p = usePlayer();
  const active = Boolean(p.current && tracks.some((t) => t.id === p.current?.id));
  return (
    <button type="button" className="grid h-14 w-14 place-items-center rounded-full bg-violet text-ivory" aria-label={active && p.playing ? pauseLabel : playLabel}
      onClick={() => (active ? p.toggle() : p.playQueue(tracks, 0))}>
      {active && p.playing ? <Pause size={26} /> : <Play size={26} />}
    </button>
  );
}
