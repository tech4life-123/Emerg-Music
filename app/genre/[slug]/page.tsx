import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { TrackList } from "@/components/track-list";
import { tracksByGenreOrCategory } from "@/lib/catalog";
import { getMessages } from "@/lib/i18n";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await tracksByGenreOrCategory((await params).slug);
  return { title: data?.title ?? "Genre" };
}

export default async function GenrePage({ params }: Props) {
  const { slug } = await params;
  const { t } = await getMessages();
  const data = await tracksByGenreOrCategory(slug);
  if (!data) notFound();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-4xl font-bold">{data.title}</h1>
      {data.tracks.length ? <TrackList tracks={data.tracks} playLabel={t.player.play} pauseLabel={t.player.pause} /> : <EmptyState title={t.genres.noTracks} body={t.catalog.emptyBody} />}
    </div>
  );
}
