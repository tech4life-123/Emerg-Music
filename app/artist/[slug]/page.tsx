import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { ShareButtons } from "@/components/share-buttons";
import { TrackList } from "@/components/track-list";
import { getArtist } from "@/lib/catalog";
import { getMessages } from "@/lib/i18n";

type Props = { params: Promise<{ slug: string }> };
const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getArtist((await params).slug);
  if (!data) return { title: "Artist" };
  return { title: data.artist.name, description: data.artist.bio ?? undefined,
    openGraph: { title: `${data.artist.name} · Emerg Music`, description: data.artist.bio ?? "Discover. Stream. Share.", images: data.artist.imageUrl ? [data.artist.imageUrl] : undefined } };
}

export default async function ArtistPage({ params }: Props) {
  const { slug } = await params;
  const { t } = await getMessages();
  const data = await getArtist(slug);
  if (!data) notFound();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-4xl font-bold">{data.artist.name}</h1>
      {data.artist.bio && <p className="max-w-2xl text-muted">{data.artist.bio}</p>}
      <ShareButtons url={`${site}/artist/${data.artist.slug}`} text={data.artist.name}
        labels={{ whatsapp: t.catalog.shareWhatsApp, facebook: t.catalog.shareFacebook, copy: t.catalog.copyLink, copied: t.catalog.copied }} />
      {data.tracks.length ? <TrackList tracks={data.tracks} playLabel={t.player.play} pauseLabel={t.player.pause} />
        : <EmptyState title={t.catalog.artistNoTracks} body={t.catalog.emptyBody} />}
    </div>
  );
}
