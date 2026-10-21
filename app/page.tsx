import Link from "next/link";
import { Cover } from "@/components/cover";
import { EmptyState } from "@/components/empty-state";
import { ReleaseCardView } from "@/components/release-card";
import { SearchForm } from "@/components/search-form";
import { TrackList } from "@/components/track-list";
import { featuredArtists, latestReleases, latestTracks, listGenres } from "@/lib/catalog";
import { getMessages } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

const TILES = ["linear-gradient(135deg,#38213F,#8F50B5)", "linear-gradient(135deg,#EF7B8A,#8F50B5)", "linear-gradient(135deg,#6FCF97,#38213F)", "linear-gradient(135deg,#E8B45A,#EF7B8A)", "linear-gradient(135deg,#D6A6F5,#38213F)", "linear-gradient(135deg,#8F50B5,#D6A6F5)", "linear-gradient(135deg,#38213F,#E8B45A)"];

export default async function Home() {
  const { t } = await getMessages();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const name = user ? (await supabase.from("profiles").select("display_name").eq("id", user.id).single()).data?.display_name : null;
  const [tracks, releases, artists, genres] = await Promise.all([latestTracks(12), latestReleases(12), featuredArtists(12), listGenres()]);
  const empty = !tracks.length;
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        {user ? <><h1 className="text-3xl font-bold sm:text-4xl">{name ? t.home.greetingName.replace("{name}", name) : t.home.greeting}</h1><p className="text-muted">{t.home.sub}</p></>
          : <><p className="text-sm tracking-widest text-lilac uppercase">{t.brand.tagline}</p><h1 className="max-w-3xl text-4xl font-bold sm:text-5xl">{t.home.title}</h1><p className="max-w-2xl text-lg text-muted">{t.home.sub}</p></>}
        <SearchForm label={t.catalog.search} placeholder={t.catalog.searchPlaceholder} />
      </section>

      {empty ? <EmptyState title={t.catalog.emptyTitle} body={t.catalog.emptyBody} /> : (
        <>
          {releases.length > 0 && (
            <section aria-labelledby="rel"><h2 id="rel" className="mb-4 text-2xl font-bold">{t.home.newReleases}</h2>
              <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">{releases.map((r) => <ReleaseCardView key={r.id} r={r} typeLabel={t.release[r.type as "album"]} />)}</div>
            </section>
          )}
          <section aria-labelledby="gen"><h2 id="gen" className="mb-4 text-2xl font-bold">{t.home.browseGenres}</h2>
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
              {genres.map((c, i) => <Link key={c.slug} href={`/genre/${c.slug}`} className="h-20 w-36 shrink-0 rounded-xl p-3 font-bold sm:w-44" style={{ background: TILES[i % TILES.length] }}>{c.name}</Link>)}
            </div>
          </section>
          {artists.length > 0 && (
            <section aria-labelledby="art"><h2 id="art" className="mb-4 text-2xl font-bold">{t.home.artists}</h2>
              <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
                {artists.map((a) => <Link key={a.slug} href={`/artist/${a.slug}`} className="w-24 shrink-0 text-center sm:w-28"><Cover url={a.imageUrl} seed={a.name} round className="w-full" /><span className="mt-2 block truncate text-sm">{a.name}</span></Link>)}
              </div>
            </section>
          )}
          <section aria-labelledby="latest"><h2 id="latest" className="mb-2 text-2xl font-bold">{t.home.latestTracks}</h2>
            <TrackList tracks={tracks} playLabel={t.player.play} pauseLabel={t.player.pause} />
          </section>
        </>
      )}
    </div>
  );
}
