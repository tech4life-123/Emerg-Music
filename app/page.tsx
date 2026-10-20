import { EmptyState } from "@/components/empty-state";
import { SearchForm } from "@/components/search-form";
import { TrackList } from "@/components/track-list";
import { latestTracks } from "@/lib/catalog";
import { getMessages } from "@/lib/i18n";

export default async function Home() {
  const { t } = await getMessages();
  const tracks = await latestTracks();
  return (
    <div className="flex flex-col gap-10">
      <section className="py-6 sm:py-12">
        <p className="mb-4 text-sm tracking-widest text-lilac uppercase">{t.brand.tagline}</p>
        <h1 className="max-w-3xl text-4xl font-bold sm:text-6xl">{t.home.title}</h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">{t.home.body}</p>
        <div className="mt-8"><SearchForm label={t.catalog.search} placeholder={t.catalog.searchPlaceholder} /></div>
      </section>
      <section aria-labelledby="latest">
        <h2 id="latest" className="mb-4 text-2xl font-bold">{t.catalog.latest}</h2>
        {tracks.length ? <TrackList tracks={tracks} playLabel={t.player.play} pauseLabel={t.player.pause} />
          : <EmptyState title={t.catalog.emptyTitle} body={t.catalog.emptyBody} />}
      </section>
    </div>
  );
}
