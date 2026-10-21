import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Cover } from "@/components/cover";
import { PlayAll } from "@/components/play-all";
import { ShareButtons } from "@/components/share-buttons";
import { TrackList } from "@/components/track-list";
import { getRelease } from "@/lib/catalog";
import { getMessages } from "@/lib/i18n";
import { shareImage, siteUrl } from "@/lib/share";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = await getRelease((await params).id);
  if (!d) return { title: "Release" };
  const title = `${d.release.title} · ${d.release.artistName}`;
  const description = `${d.release.genreName ? d.release.genreName + " · " : ""}Listen on Emerg Music. Discover. Stream. Share.`;
  const images = [{ url: shareImage(d.release.coverUrl), width: 640, height: 640 }];
  return { title, description, openGraph: { title, description, images, url: `${siteUrl}/release/${d.release.id}` }, twitter: { card: "summary_large_image", title, description, images: images.map((i) => i.url) } };
}

export default async function ReleasePage({ params }: Props) {
  const { id } = await params;
  const { t } = await getMessages();
  const d = await getRelease(id);
  if (!d) notFound();
  const { release, tracks } = d;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-end">
        <Cover url={release.coverUrl} seed={release.title} className="w-56 shadow-2xl sm:w-60" />
        <div className="w-full min-w-0">
          <p className="text-sm text-muted">{t.release[release.type as "album"]} · {release.year}</p>
          <h1 className="text-3xl font-bold sm:text-5xl">{release.title}</h1>
          <p className="mt-2"><Link href={`/artist/${release.artistSlug}`} className="font-semibold hover:underline">{release.artistName}</Link>
            <span className="text-muted"> · {tracks.length} {t.release.tracksCount}{release.genreName ? ` · ${release.genreName}` : ""}</span></p>
        </div>
      </div>
      <div className="flex items-center gap-4"><PlayAll tracks={tracks} playLabel={t.player.play} pauseLabel={t.player.pause} />
        <ShareButtons url={`${siteUrl}/release/${release.id}`} text={`${release.title} — ${release.artistName}`}
          labels={{ whatsapp: t.catalog.shareWhatsApp, facebook: t.catalog.shareFacebook, copy: t.catalog.copyLink, copied: t.catalog.copied }} /></div>
      <TrackList tracks={tracks} playLabel={t.player.play} pauseLabel={t.player.pause} showCover={false} numbered />
      <p className="text-xs text-muted">{t.release.rights} <Link href="/report" className="text-lilac underline">{t.catalog.report}</Link></p>
    </div>
  );
}
