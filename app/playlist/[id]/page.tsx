import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Cover } from "@/components/cover";
import { PlayAll } from "@/components/play-all";
import { ShareButtons } from "@/components/share-buttons";
import { TrackList } from "@/components/track-list";
import { tracksByIds } from "@/lib/catalog";
import { getMessages } from "@/lib/i18n";
import { shareImage, siteUrl } from "@/lib/share";
import { createClient } from "@/lib/supabase/server";
import { deletePlaylist, removeFromPlaylist, setPlaylistPublic } from "../../library-actions";

type Props = { params: Promise<{ id: string }> };
const UUID = /^[0-9a-f-]{36}$/i;

// Row-level security decides who can see a playlist: the owner, or anyone if it is public.
async function load(id: string) {
  if (!UUID.test(id)) return null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: pl } = await supabase.from("playlists").select("id, name, owner_id, is_public").eq("id", id).maybeSingle();
  if (!pl) return null;
  const { data: rows } = await supabase.from("playlist_tracks").select("track_id").eq("playlist_id", id).order("position");
  const tracks = await tracksByIds((rows ?? []).map((r) => r.track_id));
  return { pl, tracks, isOwner: !!user && pl.owner_id === user.id };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = await load((await params).id);
  if (!d) return { title: "Playlist" };
  if (!d.pl.is_public) return { title: d.pl.name, robots: { index: false } };
  const title = `${d.pl.name} · Playlist`;
  const description = `${d.tracks.length} songs · Listen on Emerg Music. Discover. Stream. Share.`;
  const images = [{ url: shareImage(d.tracks[0]?.coverUrl ?? null), width: 640, height: 640 }];
  return { title, description, openGraph: { title, description, images, url: `${siteUrl}/playlist/${d.pl.id}` }, twitter: { card: "summary_large_image", title, description, images: images.map((i) => i.url) } };
}

export default async function PlaylistPage({ params }: Props) {
  const { id } = await params;
  const { t } = await getMessages();
  const d = await load(id);
  if (!d) notFound();
  const { pl, tracks, isOwner } = d;
  const L = t.library;
  return (
    <div className="flex flex-col gap-6">
      {isOwner && <Link href="/library?tab=playlists" className="inline-flex min-h-11 items-center text-sm text-lilac underline">← {L.playlists}</Link>}
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-end">
        <Cover url={tracks[0]?.coverUrl ?? null} seed={pl.name} className="w-48 shadow-2xl sm:w-56" />
        <div className="w-full min-w-0">
          <p className="text-sm text-muted">{pl.is_public ? L.publicBadge : L.privateBadge}</p>
          <h1 className="text-3xl font-bold sm:text-5xl">{pl.name}</h1>
          <p className="mt-1 text-muted">{tracks.length} {L.songs}</p>
        </div>
      </div>
      {tracks.length > 0 && (
        <div className="flex flex-wrap items-center gap-4">
          <PlayAll tracks={tracks} playLabel={t.player.play} pauseLabel={t.player.pause} />
          {pl.is_public && (
            <ShareButtons url={`${siteUrl}/playlist/${pl.id}`} text={`${pl.name} — Emerg Music`}
              labels={{ whatsapp: t.catalog.shareWhatsApp, facebook: t.catalog.shareFacebook, copy: t.catalog.copyLink, copied: t.catalog.copied }} />
          )}
        </div>
      )}
      {tracks.length ? <TrackList tracks={tracks} playLabel={t.player.play} pauseLabel={t.player.pause} /> : <p className="text-muted">{L.emptyPlaylist}</p>}
      {isOwner && (
        <>
          <form action={setPlaylistPublic} className="card flex flex-col gap-3 p-4">
            <input type="hidden" name="playlistId" value={id} /><input type="hidden" name="public" value={pl.is_public ? "0" : "1"} />
            <p className="text-sm text-muted">{pl.is_public ? L.publicNote : L.privateNote}</p>
            <button className="btn btn-secondary self-start" type="submit">{pl.is_public ? L.makePrivate : L.makePublic}</button>
          </form>
          {tracks.length > 0 && (
            <details className="card p-3 text-sm"><summary className="min-h-11 cursor-pointer py-2 font-semibold">{L.remove}</summary>
              <ul className="divide-y divide-border">{tracks.map((tr) => (
                <li key={tr.id} className="flex items-center justify-between gap-3 py-1"><span className="truncate">{tr.title}</span>
                  <form action={removeFromPlaylist}><input type="hidden" name="playlistId" value={id} /><input type="hidden" name="trackId" value={tr.id} />
                    <button className="min-h-11 px-2 text-danger underline" type="submit">{L.remove}</button></form></li>
              ))}</ul></details>
          )}
          <form action={deletePlaylist}><input type="hidden" name="playlistId" value={id} /><button className="min-h-11 text-sm text-danger underline" type="submit">{L.deletePlaylist}</button></form>
        </>
      )}
    </div>
  );
}
