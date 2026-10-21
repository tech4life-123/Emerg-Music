"use client";
import { Heart } from "lucide-react";
import { useLibrary } from "./library-provider";

export function LikeButton({ trackId, size = 22 }: { trackId: string; size?: number }) {
  const lib = useLibrary();
  const on = lib.liked(trackId);
  return (
    <button type="button" aria-pressed={on} aria-label={on ? lib.labels.unlike : lib.labels.like} onClick={() => lib.like(trackId)}
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${on ? "text-lilac" : "text-muted hover:text-ivory"}`}>
      <Heart size={size} aria-hidden fill={on ? "currentColor" : "none"} />
    </button>
  );
}
