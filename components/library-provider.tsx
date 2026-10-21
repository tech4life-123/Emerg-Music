"use client";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toggleBlock, toggleFollow, toggleLike, createPlaylist, addToPlaylist } from "@/app/library-actions";
import type { LibraryState } from "@/lib/library";

type Ctx = {
  signedIn: boolean; labels: Record<string, any>; requireSignIn: () => void; // eslint-disable-line @typescript-eslint/no-explicit-any

  liked: (trackId: string) => boolean; following: (artistId: string) => boolean; blocked: (artistId: string) => boolean;
  blockedIds: string[]; playlists: { id: string; name: string }[];
  like: (trackId: string) => Promise<void>; follow: (artistId: string) => Promise<void>; block: (artistId: string) => Promise<void>;
  newPlaylist: (name: string, trackId?: string) => Promise<string | null>; addTo: (playlistId: string, trackId: string) => Promise<boolean>;
};
const LibraryContext = createContext<Ctx | null>(null);
export const useLibrary = () => { const c = useContext(LibraryContext); if (!c) throw new Error("useLibrary outside provider"); return c; };

// Holds the listener's likes / follows / mutes so buttons react instantly; the server remains the source of truth.
export function LibraryProvider({ state, labels, children }: { state: LibraryState | null; labels: Record<string, any>; children: React.ReactNode }) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const router = useRouter();
  const signedIn = Boolean(state);
  const [likedIds, setLiked] = useState(() => new Set(state?.likedIds));
  const [followIds, setFollow] = useState(() => new Set(state?.followingIds));
  const [blockIds, setBlock] = useState(() => new Set(state?.blockedIds));
  const [playlists, setPlaylists] = useState(state?.playlists ?? []);

  const toLogin = useCallback(() => router.push(`/login?next=${encodeURIComponent(location.pathname)}`), [router]);
  const flip = useCallback(async (set: Set<string>, setter: (s: Set<string>) => void, id: string, act: (id: string, on: boolean) => Promise<{ ok: boolean }>) => {
    if (!signedIn) return toLogin();
    const on = !set.has(id);
    const nextSet = new Set(set); if (on) nextSet.add(id); else nextSet.delete(id);
    setter(nextSet);
    const r = await act(id, on);
    if (!r.ok) setter(set); else router.refresh();
  }, [signedIn, toLogin, router]);

  const value = useMemo<Ctx>(() => ({
    signedIn, labels, requireSignIn: toLogin, playlists, blockedIds: [...blockIds],
    liked: (id) => likedIds.has(id), following: (id) => followIds.has(id), blocked: (id) => blockIds.has(id),
    like: (id) => flip(likedIds, setLiked, id, toggleLike),
    follow: (id) => flip(followIds, setFollow, id, toggleFollow),
    block: (id) => flip(blockIds, setBlock, id, toggleBlock),
    newPlaylist: async (name, trackId) => {
      if (!signedIn) { toLogin(); return null; }
      const r = await createPlaylist(name, trackId);
      if (!r.ok) return null;
      setPlaylists([{ id: r.id, name: name.trim().slice(0, 80) }, ...playlists]); router.refresh();
      return r.id;
    },
    addTo: async (playlistId, trackId) => { if (!signedIn) { toLogin(); return false; } const r = await addToPlaylist(playlistId, trackId); if (r.ok) router.refresh(); return r.ok; },
  }), [signedIn, labels, playlists, likedIds, followIds, blockIds, flip, toLogin, router]);
  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}
