import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShareButtons } from "@/components/share-buttons";
import { TrackList } from "@/components/track-list";
import { getTrack } from "@/lib/catalog";
import { getMessages } from "@/lib/i18n";

type Props = { params: Promise<{ id: string }> };
const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const track = await getTrack((await params).id);
  if (!track) return { title: "Track" };
  const title = `${track.title} — ${track.artistName}`;
  return { title, openGraph: { title: `${title} · Emerg Music`, description: "Discover. Stream. Share.", images: track.coverUrl ? [track.coverUrl] : undefined } };
}

export default async function TrackPage({ params }: Props) {
  const { id } = await params;
  const { t } = await getMessages();
  const track = await getTrack(id);
  if (!track) notFound();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-4xl font-bold">{track.title}</h1>
        <p className="mt-2 text-muted">{t.catalog.by} <Link className="text-lilac underline" href={`/artist/${track.artistSlug}`}>{track.artistName}</Link> · {track.releaseTitle}</p>
      </div>
      <TrackList tracks={[track]} playLabel={t.player.play} pauseLabel={t.player.pause} />
      <ShareButtons url={`${site}/track/${track.id}`} text={`${track.title} — ${track.artistName}`}
        labels={{ whatsapp: t.catalog.shareWhatsApp, facebook: t.catalog.shareFacebook, copy: t.catalog.copyLink, copied: t.catalog.copied }} />
    </div>
  );
}
