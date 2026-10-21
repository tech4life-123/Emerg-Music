"use client";
import { useState } from "react";
import Link from "next/link";
import { MoreVertical, Share2, Flag, UserPlus, UserCheck, Ban } from "lucide-react";
import { Sheet, sheetItem } from "./sheet";
import { Cover } from "./cover";
import { useLibrary } from "./library-provider";
import { shareLink } from "./share-action";

export function ArtistMenu({ artist }: { artist: { id: string; name: string; slug: string; imageUrl: string | null } }) {
  const lib = useLibrary();
  const labels = lib.labels;
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const following = lib.following(artist.id), muted = lib.blocked(artist.id);
  const close = () => { setOpen(false); setNote(null); };
  async function share() { const r = await shareLink(`${location.origin}/artist/${artist.slug}`, artist.name); setNote(r === "copied" ? labels.copied : r === "failed" ? labels.failed : null); }
  return (
    <>
      <button type="button" aria-label={`${labels.menu}: ${artist.name}`} onClick={() => setOpen(true)} className="grid h-11 w-11 place-items-center rounded-full text-muted hover:text-ivory"><MoreVertical size={24} aria-hidden /></button>
      <Sheet open={open} onClose={close} closeLabel={labels.close}
        title={<div className="flex items-center gap-3"><Cover url={artist.imageUrl} seed={artist.name} round className="h-12 w-12" /><span className="truncate">{artist.name}</span></div>}>
        <div className="flex flex-col">
          <button type="button" className={sheetItem} onClick={share}><Share2 aria-hidden />{labels.share}</button>
          <Link href="/report" className={sheetItem} onClick={close}><Flag aria-hidden />{labels.report}</Link>
          <button type="button" className={sheetItem} onClick={() => lib.follow(artist.id)}>{following ? <UserCheck aria-hidden /> : <UserPlus aria-hidden />}{following ? labels.unfollow : labels.follow}</button>
          <button type="button" className={sheetItem} onClick={() => lib.block(artist.id)}><Ban aria-hidden />{muted ? labels.allowPlay : labels.dontPlay}</button>
          {muted && <p className="px-1 pt-1 text-sm text-muted">{labels.mutedNote}</p>}
          {note && <p role="status" className="px-1 pt-2 text-sm text-lilac">{note}</p>}
        </div>
      </Sheet>
    </>
  );
}
