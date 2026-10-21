import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { SearchForm } from "@/components/search-form";
import { TrackList } from "@/components/track-list";
import { listGenres, searchCatalog } from "@/lib/catalog";
import { getMessages } from "@/lib/i18n";

export const metadata = { title: "Search" };
const TILES = ["linear-gradient(135deg,#38213F,#8F50B5)", "linear-gradient(135deg,#EF7B8A,#8F50B5)", "linear-gradient(135deg,#6FCF97,#38213F)", "linear-gradient(135deg,#E8B45A,#EF7B8A)", "linear-gradient(135deg,#D6A6F5,#38213F)", "linear-gradient(135deg,#8F50B5,#D6A6F5)", "linear-gradient(135deg,#38213F,#E8B45A)"];

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { t } = await getMessages();
  const { q = "" } = await searchParams;
  const [{ tracks, artists }, genres] = await Promise.all([searchCatalog(q), listGenres()]);
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold">{t.genres.title}</h1>
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
      {!q && (
        <section aria-labelledby="all"><h2 id="all" className="mb-4 text-xl font-bold">{t.genres.browseAll}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {genres.map((c, i) => (
              <div key={c.slug} className="min-h-32 rounded-xl p-3" style={{ background: TILES[i % TILES.length] }}>
                <Link href={`/genre/${c.slug}`} className="block font-bold">{c.name}</Link>
                <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs">{c.genres.slice(0, 4).map((g) => <Link key={g.slug} href={`/genre/${g.slug}`} className="underline decoration-ivory/50">{g.name}</Link>)}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
