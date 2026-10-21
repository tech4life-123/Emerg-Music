import Link from "next/link";
import { Cover } from "@/components/cover";
import { EmptyState } from "@/components/empty-state";
import { PlayAll } from "@/components/play-all";
import { TrackList } from "@/components/track-list";
import { requireUser } from "@/lib/auth";
import { tracksByIds } from "@/lib/catalog";
import { getMessages } from "@/lib/i18n";
import { mediaUrl } from "@/lib/storage";
import { createPlaylistForm } from "../library-actions";

export const metadata = { title: "Your Library" };
type Tab = "liked" | "playlists" | "following";

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ tab?: string; error?: string }> }) {
  const { t } = await getMessages();
  const sp = await searchParams;
  const { supabase, user } = await requireUser("/library");
  const tab: Tab = sp.tab === "playlists" || sp.tab === "following" ? sp.tab : "liked";
  const L = t.library;
  const tabs: { id: Tab; label: string }[] = [{ id: "liked", label: L.liked }, { id: "playlists", label: L.playlists }, { id: "following", label: L.following }];

  let body: React.ReactNode;
  if (tab === "liked") {
    const { data } = await supabase.from("favorites").select("track_id").eq("user_id", user.id).order("created_at", { ascending: false }).limit(200);
    const tracks = await tracksByIds((data ?? []).map((r) => r.track_id));
    body = tracks.length
      ? <div className="flex flex-col gap-3"><PlayAll tracks={tracks} playLabel={t.player.play} pauseLabel={t.player.pause} /><TrackList tracks={tracks} playLabel={t.player.play} pauseLabel={t.player.pause} /></div>
      : <EmptyState title={L.liked} body={L.noLiked} />;
  } else if (tab === "playlists") {
    const { data } = await supabase.from("playlists").select("id, name, playlist_tracks(count)").eq("owner_id", user.id).order("created_at", { ascending: false });
    const lists = (data ?? []) as unknown as { id: string; name: string; playlist_tracks: { count: number }[] }[];
    body = (
      <div className="flex flex-col gap-4">
        <form action={createPlaylistForm} className="flex max-w-md gap-2">
          <input className="input h-12 flex-1" name="name" required maxLength={80} placeholder={L.playlistName} aria-label={L.playlistName} />
          <button className="btn btn-primary h-12" type="submit">{L.create}</button>
        </form>
        {sp.error && <p role="alert" className="alert alert-danger text-sm">{L.failed}</p>}
        {lists.length ? (
          <ul className="card divide-y divide-border">
            {lists.map((p) => (
              <li key={p.id}><Link href={`/playlist/${p.id}`} className="flex min-h-16 items-center justify-between gap-3 p-3 hover:bg-plum">
                <span className="truncate font-semibold">{p.name}</span><span className="shrink-0 text-sm text-muted">{p.playlist_tracks?.[0]?.count ?? 0} {L.songs}</span></Link></li>
            ))}
          </ul>
        ) : <p className="text-muted">{L.noPlaylists}</p>}
      </div>
    );
  } else {
    const { data } = await supabase.from("artist_follows").select("artists(id, name, slug, image_url)").eq("user_id", user.id).order("created_at", { ascending: false });
    const artists = ((data ?? []) as unknown as { artists: { id: string; name: string; slug: string; image_url: string | null } | null }[]).map((r) => r.artists).filter(Boolean) as { id: string; name: string; slug: string; image_url: string | null }[];
    body = artists.length ? (
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {artists.map((a) => (
          <li key={a.id}><Link href={`/artist/${a.slug}`} className="flex flex-col items-center gap-2 text-center">
            <Cover url={mediaUrl(a.image_url)} seed={a.name} round className="w-full max-w-36" /><span className="w-full truncate font-semibold">{a.name}</span></Link></li>
        ))}
      </ul>
    ) : <p className="text-muted">{L.noFollowing}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">{L.title}</h1>
      <nav aria-label={L.title} className="flex gap-2 overflow-x-auto">
        {tabs.map((x) => (
          <Link key={x.id} href={`/library?tab=${x.id}`} aria-current={tab === x.id ? "page" : undefined}
            className={`inline-flex h-11 shrink-0 items-center rounded-full px-5 text-sm font-semibold ${tab === x.id ? "bg-ivory text-night" : "bg-plum text-ivory"}`}>{x.label}</Link>
        ))}
      </nav>
      {body}
    </div>
  );
}
