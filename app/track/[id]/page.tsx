import type { Metadata } from "next";
import { Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Cover } from "@/components/cover";
import { PlayAll } from "@/components/play-all";
import { ShareButtons } from "@/components/share-buttons";
import { LikeButton } from "@/components/like-button";
import { TrackMenu } from "@/components/track-menu";
import { getTrack } from "@/lib/catalog";
import { getMessages } from "@/lib/i18n";
import { shareImage, siteUrl } from "@/lib/share";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const track = await getTrack((await params).id);
  if (!track) return { title: "Track" };
  const title = `${track.title} · ${track.artistName}`;
  const description = `${track.genreName ? track.genreName + " · " : ""}Listen on Emerg Music. Discover. Stream. Share.`;
  const images = [{ url: shareImage(track.coverUrl ?? track.artistImageUrl), width: 640, height: 640 }];
  return { title, description, openGraph: { title, description, images, url: `${siteUrl}/track/${track.id}`, type: "music.song" }, twitter: { card: "summary_large_image", title, description, images: images.map((i) => i.url) } };
}

export default async function TrackPage({ params }: Props) {
  const { id } = await params;
  const { t, locale } = await getMessages();
  const track = await getTrack(id);
  if (!track) notFound();
  const row = (k: string, v: React.ReactNode) => <div className="flex justify-between gap-4 border-b border-border py-2.5 text-sm last:border-0"><span className="text-muted">{k}</span><span className="text-right">{v}</span></div>;
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <Cover url={track.coverUrl} seed={track.title} className="w-full shadow-2xl" />
      <div>
        <h1 className="text-3xl font-bold">{track.title}{track.explicit && <span className="ml-2 inline-grid h-5 w-5 place-items-center rounded-sm bg-muted/30 align-middle text-xs">E</span>}</h1>
        <p className="mt-1"><Link className="text-lg text-muted hover:underline" href={`/artist/${track.artistSlug}`}>{track.artistName}</Link></p>
      </div>
      <div className="flex flex-wrap items-center gap-3"><PlayAll tracks={[track]} playLabel={t.player.play} pauseLabel={t.player.pause} /><LikeButton trackId={track.id} size={26} /><TrackMenu track={track} />
        <ShareButtons url={`${siteUrl}/track/${track.id}`} text={`${track.title} — ${track.artistName}`}
          labels={{ whatsapp: t.catalog.shareWhatsApp, facebook: t.catalog.shareFacebook, copy: t.catalog.copyLink, copied: t.catalog.copied }} /></div>
      <section className="card p-4"><h2 className="mb-2 text-lg font-bold">{t.release.about}</h2>
        <div className="mb-2 flex flex-wrap gap-2">
          {track.genreSlug && <Link href={`/genre/${track.genreSlug}`} className="rounded-full border border-lilac px-3 py-1 text-sm text-lilac">{track.genreName}</Link>}
          {track.secondaryGenreName && <span className="rounded-full border border-border px-3 py-1 text-sm text-muted">{track.secondaryGenreName}</span>}
          {track.categoryName && track.categorySlug && <Link href={`/genre/${track.categorySlug}`} className="rounded-full border border-border px-3 py-1 text-sm text-muted">{track.categoryName}</Link>}
        </div>
        {row(t.library.mainArtist, <Link className="underline" href={`/artist/${track.artistSlug}`}>{track.artistName}</Link>)}
        {track.credits.map((c, i) => <Fragment key={i}>{row(t.library.roles[c.role as "writer"] ?? c.role, c.artistSlug ? <Link className="underline" href={`/artist/${c.artistSlug}`}>{c.name}</Link> : c.name)}</Fragment>)}
        {row(t.release.from, <Link className="underline" href={`/release/${track.releaseId}`}>{track.releaseTitle}</Link>)}
        {row(t.release.released, new Date(track.releasedAt).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-GB", { day: "numeric", month: "short", year: "numeric" }))}
        {row(t.release.rightsLabel, t.release.rightsValue)}
        <p className="mt-2 text-sm"><Link href="/report" className="text-lilac underline">{t.catalog.report}</Link></p>
      </section>
    </div>
  );
}
