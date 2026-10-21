import Link from "next/link";
import { notFound } from "next/navigation";
import { PlayAll } from "@/components/play-all";
import { TrackList } from "@/components/track-list";
import { requireUser } from "@/lib/auth";
import { tracksByIds } from "@/lib/catalog";
import { getMessages } from "@/lib/i18n";
import { deletePlaylist, removeFromPlaylist } from "../../library-actions";

export const metadata = { title: "Playlist" };

export default async function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { t } = await getMessages();
  const { supabase, user } = await requireUser(`/playlist/${id}`);
  const { data: pl } = await supabase.from("playlists").select("id, name, owner_id").eq("id", id).maybeSingle();
  if (!pl || pl.owner_id !== user.id) notFound();
  const { data: rows } = await supabase.from("playlist_tracks").select("track_id").eq("playlist_id", id).order("position");
  const tracks = await tracksByIds((rows ?? []).map((r) => r.track_id));
  const L = t.library;
  return (
    <div className="flex flex-col gap-6">
      <Link href="/library?tab=playlists" className="inline-flex min-h-11 items-center text-sm text-lilac underline">← {L.playlists}</Link>
      <div><h1 className="text-3xl font-bold">{pl.name}</h1><p className="text-muted">{tracks.length} {L.songs}</p></div>
      {tracks.length ? (
        <>
          <PlayAll tracks={tracks} playLabel={t.player.play} pauseLabel={t.player.pause} />
          <TrackList tracks={tracks} playLabel={t.player.play} pauseLabel={t.player.pause} />
          <details className="card p-3 text-sm"><summary className="min-h-11 cursor-pointer py-2 font-semibold">{L.remove}</summary>
            <ul className="divide-y divide-border">{tracks.map((tr) => (
              <li key={tr.id} className="flex items-center justify-between gap-3 py-1"><span className="truncate">{tr.title}</span>
                <form action={removeFromPlaylist}><input type="hidden" name="playlistId" value={id} /><input type="hidden" name="trackId" value={tr.id} />
                  <button className="min-h-11 px-2 text-danger underline" type="submit">{L.remove}</button></form></li>
            ))}</ul></details>
        </>
      ) : <p className="text-muted">{L.emptyPlaylist}</p>}
      <form action={deletePlaylist}><input type="hidden" name="playlistId" value={id} /><button className="min-h-11 text-sm text-danger underline" type="submit">{L.deletePlaylist}</button></form>
    </div>
  );
}
