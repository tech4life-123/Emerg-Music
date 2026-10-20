import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { SearchForm } from "@/components/search-form";
import { TrackList } from "@/components/track-list";
import { searchCatalog } from "@/lib/catalog";
import { getMessages } from "@/lib/i18n";

export const metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { t } = await getMessages();
  const { q = "" } = await searchParams;
  const { tracks, artists } = await searchCatalog(q);
  return (
    <div className="flex flex-col gap-8">
      <SearchForm label={t.catalog.search} placeholder={t.catalog.searchPlaceholder} defaultValue={q} />
      {q && !tracks.length && !artists.length && <EmptyState title={`${t.catalog.noResults} “${q}”`} body={t.catalog.emptyBody} />}
      {artists.length > 0 && (
        <section><h2 className="mb-3 text-xl font-bold">{t.catalog.artists}</h2>
          <ul className="flex flex-wrap gap-2">{artists.map((a) => <li key={a.slug}><Link className="btn btn-secondary inline-flex items-center" href={`/artist/${a.slug}`}>{a.name}</Link></li>)}</ul>
        </section>
      )}
      {tracks.length > 0 && (
        <section><h2 className="mb-3 text-xl font-bold">{t.catalog.tracks}</h2>
          <TrackList tracks={tracks} playLabel={t.player.play} pauseLabel={t.player.pause} />
        </section>
      )}
    </div>
  );
}
