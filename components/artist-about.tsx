"use client";
import { useState } from "react";
import Link from "next/link";
import { Cover } from "./cover";
import { FollowButton } from "./follow-button";
import { useLibrary } from "./library-provider";

type Artist = { id: string; name: string; slug: string; bio: string | null; imageUrl: string | null; followers: number };
export type CreditRow = { name: string; roles: string[]; slug: string | null };

export function AboutCard({ artist }: { artist: Artist }) {
  const { labels } = useLibrary();
  const [more, setMore] = useState(false);
  const long = (artist.bio?.length ?? 0) > 180;
  return (
    <section className="card overflow-hidden">
      <div className="relative h-48 sm:h-56" style={{ background: "linear-gradient(135deg,#38213F,#8F50B5 60%,#D6A6F5)" }}>
        {artist.imageUrl && /* eslint-disable-next-line @next/next/no-img-element */ <img src={artist.imageUrl} alt="" className="h-full w-full object-cover" />}
        <h2 className="absolute left-4 top-3 text-xl font-bold drop-shadow">{labels.aboutArtist}</h2>
      </div>
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0"><p className="truncate text-2xl font-bold">{artist.name}</p>
            <p className="text-sm text-muted">{artist.followers} {artist.followers === 1 ? labels.follower : labels.followers}</p></div>
          <FollowButton artistId={artist.id} />
        </div>
        {artist.bio
          ? <p className={`whitespace-pre-line text-sm leading-relaxed text-muted ${more || !long ? "" : "line-clamp-3"}`}>{artist.bio}</p>
          : <p className="text-sm text-muted">{labels.noBio}</p>}
        {long && <button type="button" onClick={() => setMore(!more)} className="min-h-11 w-fit text-sm font-semibold">{more ? labels.showLess : labels.showAll}</button>}
      </div>
    </section>
  );
}

export function CreditsCard({ mainArtist, rows }: { mainArtist: { id: string; name: string }; rows: CreditRow[] }) {
  const { labels } = useLibrary();
  const [all, setAll] = useState(false);
  const shown = all ? rows : rows.slice(0, 4);
  return (
    <section className="card p-4">
      <div className="flex items-center justify-between"><h2 className="text-lg font-bold">{labels.credits}</h2>
        {rows.length > 4 && <button type="button" onClick={() => setAll(!all)} className="min-h-11 text-sm font-semibold text-lilac">{all ? labels.showLess : labels.showAll}</button>}</div>
      <ul className="mt-1 flex flex-col">
        <li className="flex min-h-14 items-center justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold">{mainArtist.name}</p><p className="text-sm text-muted">{labels.mainArtist}</p></div><FollowButton artistId={mainArtist.id} /></li>
        {shown.map((r) => (
          <li key={r.name} className="flex min-h-14 flex-col justify-center">
            {r.slug ? <Link href={`/artist/${r.slug}`} className="truncate font-semibold hover:underline">{r.name}</Link> : <p className="truncate font-semibold">{r.name}</p>}
            <p className="text-sm text-muted">{r.roles.map((role) => labels.roles[role] ?? role).join(", ")}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
