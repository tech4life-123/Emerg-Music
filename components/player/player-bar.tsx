"use client";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { Pause, Play, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { usePlayer } from "./player-provider";

const fmt = (s: number) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00");

export function PlayerBar({ labels }: { labels: Record<"play" | "pause" | "next" | "previous" | "volume" | "seek" | "unavailable" | "failed" | "nowPlaying", string> }) {
  const p = usePlayer();
  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {p.current && (
          <motion.section aria-label={labels.nowPlaying} initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/95 backdrop-blur">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 sm:px-6">
              <div className="min-w-0 flex-1 basis-40">
                <p className="truncate text-sm font-semibold">{p.current.title}</p>
                <p className="truncate text-xs text-muted">{p.current.artistName}</p>
              </div>
              <div className="flex items-center gap-1">
                <button className="btn btn-secondary !p-2" onClick={p.prev} aria-label={labels.previous}><SkipBack size={18} /></button>
                <button className="btn btn-primary !p-2" onClick={p.toggle} aria-label={p.playing ? labels.pause : labels.play}>{p.playing ? <Pause size={20} /> : <Play size={20} />}</button>
                <button className="btn btn-secondary !p-2" onClick={p.next} aria-label={labels.next}><SkipForward size={18} /></button>
              </div>
              <div className="flex basis-full items-center gap-2 text-xs text-muted sm:basis-72">
                <span className="w-9 text-right tabular-nums">{fmt(p.progress)}</span>
                <input type="range" className="w-full accent-violet" aria-label={labels.seek} min={0} max={p.duration || 0} step={1} value={Math.min(p.progress, p.duration || 0)} onChange={(e) => p.seek(Number(e.target.value))} />
                <span className="w-9 tabular-nums">{fmt(p.duration)}</span>
              </div>
              <label className="hidden items-center gap-2 text-muted sm:flex"><Volume2 size={16} aria-hidden />
                <input type="range" className="w-20 accent-violet" aria-label={labels.volume} min={0} max={1} step={0.05} value={p.volume} onChange={(e) => p.setVolume(Number(e.target.value))} />
              </label>
              {p.error && <p role="alert" className="basis-full text-xs text-[var(--danger)]">{p.error === "unavailable" ? labels.unavailable : labels.failed}</p>}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
