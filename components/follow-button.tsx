"use client";
import { useLibrary } from "./library-provider";

export function FollowButton({ artistId, className = "" }: { artistId: string; className?: string }) {
  const lib = useLibrary();
  const on = lib.following(artistId);
  return (
    <button type="button" aria-pressed={on} onClick={() => lib.follow(artistId)}
      className={`h-10 shrink-0 rounded-full border px-5 text-sm font-semibold ${on ? "border-lilac text-lilac" : "border-muted hover:border-ivory"} ${className}`}>
      {on ? lib.labels.unfollow : lib.labels.follow}
    </button>
  );
}
