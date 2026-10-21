"use client";
import { useState } from "react";
import Link from "next/link";
import { MoreVertical, ListPlus, UserRound, Share2, Flag, Plus } from "lucide-react";
import type { CatalogTrack } from "@/lib/catalog";
import { Sheet, sheetItem } from "./sheet";
import { Cover } from "./cover";
import { useLibrary } from "./library-provider";
import { shareLink } from "./share-action";

export type LibraryLabels = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export function TrackMenu({ track }: { track: CatalogTrack }) {
  const lib = useLibrary();
  const labels = lib.labels;
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"menu" | "playlists">("menu");
  const [name, setName] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const close = () => { setOpen(false); setView("menu"); setNote(null); setName(""); };
  const url = typeof window === "undefined" ? "" : `${location.origin}/track/${track.id}`;

  async function add(id: string) { setNote((await lib.addTo(id, track.id)) ? labels.added : labels.failed); }
  async function create() {
    const id = await lib.newPlaylist(name, track.id);
    setNote(id ? labels.added : labels.failed); if (id) setName("");
  }
  async function share() { const r = await shareLink(url, `${track.title} — ${track.artistName}`); setNote(r === "copied" ? labels.copied : r === "failed" ? labels.failed : null); }

  return (
    <>
      <button type="button" aria-label={`${labels.menu}: ${track.title}`} onClick={() => setOpen(true)} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted hover:text-ivory">
        <MoreVertical size={22} aria-hidden />
      </button>
      <Sheet open={open} onClose={close} closeLabel={labels.close}
        title={<div className="flex items-center gap-3"><Cover url={track.coverUrl} seed={track.title} className="h-12 w-12" /><div className="min-w-0"><p className="truncate">{track.title}</p><p className="truncate text-sm font-normal text-muted">{track.artistName}</p></div></div>}>
        {view === "menu" ? (
          <div className="flex flex-col">
            <button type="button" className={sheetItem} onClick={() => (lib.signedIn ? setView("playlists") : lib.requireSignIn())}><ListPlus aria-hidden />{labels.addToPlaylist}</button>
            <Link href={`/artist/${track.artistSlug}`} className={sheetItem} onClick={close}><UserRound aria-hidden />{labels.goToArtist}</Link>
            <button type="button" className={sheetItem} onClick={share}><Share2 aria-hidden />{labels.share}</button>
            <Link href="/report" className={sheetItem} onClick={close}><Flag aria-hidden />{labels.report}</Link>
            {note && <p role="status" className="px-1 pt-2 text-sm text-lilac">{note}</p>}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); create(); }}>
              <input className="input h-11 flex-1" placeholder={labels.playlistName} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} aria-label={labels.playlistName} />
              <button className="btn btn-primary h-11" type="submit" disabled={!name.trim()}><Plus size={18} aria-hidden /><span className="sr-only">{labels.create}</span></button>
            </form>
            <ul className="flex flex-col">
              {lib.playlists.map((p) => <li key={p.id}><button type="button" className={sheetItem} onClick={() => add(p.id)}>{p.name}</button></li>)}
            </ul>
            {note && <p role="status" className="px-1 text-sm text-lilac">{note}</p>}
            <button type="button" className="mt-1 min-h-11 text-sm text-muted underline" onClick={() => { setView("menu"); setNote(null); }}>{labels.close}</button>
          </div>
        )}
      </Sheet>
    </>
  );
}
