import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { Cover } from "@/components/cover";
import { EmptyState } from "@/components/empty-state";
import { PlayAll } from "@/components/play-all";
import { ReleaseCardView } from "@/components/release-card";
import { ShareButtons } from "@/components/share-buttons";
import { TrackList } from "@/components/track-list";
import { AboutCard, CreditsCard, type CreditRow } from "@/components/artist-about";
import { ArtistMenu } from "@/components/artist-menu";
import { FollowButton } from "@/components/follow-button";
import { getArtist } from "@/lib/catalog";
import { getMessages } from "@/lib/i18n";
import { shareImage, siteUrl } from "@/lib/share";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getArtist((await params).slug);
  if (!data) return { title: "Artist" };
  const title = `${data.artist.name} · Emerg Music`;
  const description = data.artist.bio ?? "Listen on Emerg Music. Discover. Stream. Share.";
  const images = [{ url: shareImage(data.artist.imageUrl ?? data.releases[0]?.coverUrl ?? null), width: 640, height: 640 }];
  return { title: data.artist.name, description, openGraph: { title, description, images, url: `${siteUrl}/artist/${data.artist.slug}` }, twitter: { card: "summary_large_image", title, description, images: images.map((i) => i.url) } };
}

export default async function ArtistPage({ params }: Props) {
  const { slug } = await params;
  const { t } = await getMessages();
  const data = await getArtist(slug);
  if (!data) notFound();
  const { artist, tracks, releases } = data;
  // Everyone credited on this artist's published tracks, with their roles.
  const byName = new Map<string, CreditRow>();
  for (const tr of tracks) for (const c of tr.credits) {
    const row = byName.get(c.name.toLowerCase()) ?? { name: c.name, roles: [], slug: c.artistSlug };
    if (!row.roles.includes(c.role)) row.roles.push(c.role);
    row.slug = row.slug ?? c.artistSlug;
    byName.set(c.name.toLowerCase(), row);
  }
  const creditRows = [...byName.values()].filter((r) => r.name.toLowerCase() !== artist.name.toLowerCase());
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col items-center gap-5 rounded-2xl p-6 sm:flex-row sm:items-end" style={{ background: "linear-gradient(180deg,#8F50B5 0%,#38213F 70%,#130F18 100%)" }}>
        <Cover url={artist.imageUrl} seed={artist.name} round className="w-40 shadow-2xl sm:w-48" />
        <div className="w-full min-w-0 text-center sm:text-left">
          <p className="inline-flex items-center gap-1.5 text-sm"><Check size={16} aria-hidden className="rounded-full bg-[var(--success)] p-0.5 text-night" />{t.release.verified}</p>
          <h1 className="text-4xl font-bold sm:text-6xl">{artist.name}</h1>
          <p className="mt-1 text-sm text-ivory/80">{artist.followers} {artist.followers === 1 ? t.library.follower : t.library.followers}</p>
        </div>
      </section>
      <div className="flex flex-wrap items-center gap-3"><PlayAll tracks={tracks} playLabel={t.player.play} pauseLabel={t.player.pause} />
        <FollowButton artistId={artist.id} /><ArtistMenu artist={{ id: artist.id, name: artist.name, slug: artist.slug, imageUrl: artist.imageUrl }} />
        <ShareButtons url={`${siteUrl}/artist/${artist.slug}`} text={artist.name}
          labels={{ whatsapp: t.catalog.shareWhatsApp, facebook: t.catalog.shareFacebook, copy: t.catalog.copyLink, copied: t.catalog.copied }} /></div>
      {tracks.length ? (
        <section><h2 className="mb-2 text-2xl font-bold">{t.release.latestFromArtist}</h2><TrackList tracks={tracks} playLabel={t.player.play} pauseLabel={t.player.pause} /></section>
      ) : <EmptyState title={t.catalog.artistNoTracks} body={t.catalog.emptyBody} />}
      <div className="grid gap-4 md:grid-cols-2">
        <AboutCard artist={{ id: artist.id, name: artist.name, slug: artist.slug, bio: artist.bio, imageUrl: artist.imageUrl, followers: artist.followers }} />
        <CreditsCard mainArtist={{ id: artist.id, name: artist.name }} rows={creditRows} />
      </div>
      {releases.length > 0 && (
        <section><h2 className="mb-4 text-2xl font-bold">{t.release.discography}</h2>
          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">{releases.map((r) => <ReleaseCardView key={r.id} r={r} typeLabel={t.release[r.type as "album"]} />)}</div>
        </section>
      )}
    </div>
  );
}
