"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { CatalogTrack } from "@/lib/catalog";

type Ctx = {
  queue: CatalogTrack[]; current: CatalogTrack | null; playing: boolean; progress: number; duration: number; volume: number; error: string | null;
  playQueue: (tracks: CatalogTrack[], index: number) => void; toggle: () => void; next: () => void; prev: () => void;
  seek: (s: number) => void; setVolume: (v: number) => void;
  guest: { used: number; limit: number } | null;
};
export const GUEST_LIMIT = 5;
export type GuestLabels = { title: string; body: string; create: string; signIn: string; counter: string; close: string };
const readGuestPlays = () => { try { return Math.min(99, Number(document.cookie.match(/(?:^|; )guest_plays=(\d+)/)?.[1] ?? 0)); } catch { return 0; } };
const writeGuestPlays = (n: number) => { try { document.cookie = `guest_plays=${n}; max-age=2592000; path=/; SameSite=Lax`; } catch {} };
const PlayerContext = createContext<Ctx | null>(null);
export const usePlayer = () => { const c = useContext(PlayerContext); if (!c) throw new Error("usePlayer outside provider"); return c; };

export function PlayerProvider({ children, guestLabels }: { children: React.ReactNode; guestLabels: GuestLabels }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [queue, setQueue] = useState<CatalogTrack[]>([]);
  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVol] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const counted = useRef<string | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [guestPlays, setGuestPlays] = useState(0);
  const [gateOpen, setGateOpen] = useState(false);
  const blocked = signedIn === false && guestPlays >= GUEST_LIMIT;

  useEffect(() => {
    setGuestPlays(readGuestPlays());
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user)));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(Boolean(session?.user)));
    return () => sub.subscription.unsubscribe();
  }, []);
  const current = index >= 0 ? queue[index] ?? null : null;

  const load = useCallback((track: CatalogTrack | undefined) => {
    const el = audio.current; if (!el || !track) return;
    setError(null); counted.current = null; setProgress(0);
    if (!track.audioUrl) { setPlaying(false); setError("unavailable"); return; }
    el.src = track.audioUrl;
    el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, []);

  const playQueue = useCallback((tracks: CatalogTrack[], i: number) => { if (blocked) { setGateOpen(true); return; } setQueue(tracks); setIndex(i); load(tracks[i]); }, [load, blocked]);
  const next = useCallback(() => { if (blocked) { setPlaying(false); setGateOpen(true); return; } if (index + 1 < queue.length) { setIndex(index + 1); load(queue[index + 1]); } else setPlaying(false); }, [index, queue, load, blocked]);
  const prev = useCallback(() => {
    const el = audio.current; if (!el) return;
    if (el.currentTime > 3 || index === 0) { el.currentTime = 0; return; }
    setIndex(index - 1); load(queue[index - 1]);
  }, [index, queue, load]);
  const toggle = useCallback(() => {
    const el = audio.current; if (!el || !current?.audioUrl) return;
    if (el.paused) el.play().then(() => setPlaying(true)).catch(() => {}); else { el.pause(); setPlaying(false); }
  }, [current]);
  const seek = useCallback((s: number) => { if (audio.current) audio.current.currentTime = s; }, []);
  const setVolume = useCallback((v: number) => { setVol(v); if (audio.current) audio.current.volume = v; }, []);

  // Record a real play after 30 s of listening (signed-in listeners only; the database enforces ownership).
  const onTime = () => {
    const el = audio.current; if (!el) return;
    setProgress(el.currentTime);
    if (current && counted.current !== current.id && el.currentTime >= 30) {
      counted.current = current.id;
      if (signedIn === false) {
        const n = readGuestPlays() + 1; writeGuestPlays(n); setGuestPlays(n);
      } else {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
          if (data.user) supabase.from("play_events").insert({ track_id: current.id, user_id: data.user.id, listened_ms: 30000 }).then(() => {});
        });
      }
    }
  };

  useEffect(() => {
    if (!current || !("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({ title: current.title, artist: current.artistName, album: current.releaseTitle, artwork: current.coverUrl ? [{ src: current.coverUrl }] : [] });
    navigator.mediaSession.setActionHandler("play", toggle);
    navigator.mediaSession.setActionHandler("pause", toggle);
    navigator.mediaSession.setActionHandler("nexttrack", next);
    navigator.mediaSession.setActionHandler("previoustrack", prev);
  }, [current, toggle, next, prev]);

  const value = useMemo(() => ({ queue, current, playing, progress, duration, volume, error, playQueue, toggle, next, prev, seek, setVolume, guest: signedIn === false ? { used: Math.min(guestPlays, GUEST_LIMIT), limit: GUEST_LIMIT } : null }),
    [queue, current, playing, progress, duration, volume, error, playQueue, toggle, next, prev, seek, setVolume, signedIn, guestPlays]);
  return (
    <PlayerContext.Provider value={value}>
      {children}
      {gateOpen && (
        <div role="dialog" aria-modal="true" aria-labelledby="gate-title" className="fixed inset-0 z-[60] flex items-end justify-center bg-night/75 sm:items-center">
          <div className="w-full max-w-md rounded-t-3xl bg-plum p-6 pb-10 sm:rounded-3xl">
            <h2 id="gate-title" className="text-2xl font-bold">{guestLabels.title}</h2>
            <p className="mt-3 text-ivory/90">{guestLabels.body}</p>
            <div className="mt-6 flex flex-col gap-3">
              <Link href="/signup" className="btn btn-primary inline-flex items-center justify-center">{guestLabels.create}</Link>
              <Link href="/login" className="btn btn-secondary inline-flex items-center justify-center">{guestLabels.signIn}</Link>
              <button type="button" className="min-h-11 text-sm text-muted underline" onClick={() => setGateOpen(false)}>{guestLabels.close}</button>
            </div>
          </div>
        </div>
      )}
      <audio ref={audio} preload="none" onTimeUpdate={onTime} onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={next} onPause={() => setPlaying(false)} onPlay={() => setPlaying(true)} onError={() => { setPlaying(false); setError("failed"); }} />
    </PlayerContext.Provider>
  );
}
