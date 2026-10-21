/* eslint-disable @next/next/no-img-element */
// Profile photo, or the first letter of the name on a brand-colored circle.
export function Avatar({ url, name, className = "h-24 w-24 text-4xl" }: { url: string | null; name: string; className?: string }) {
  return url
    ? <img src={url} alt="" className={`shrink-0 rounded-full object-cover ${className}`} />
    : <div aria-hidden className={`grid shrink-0 place-items-center rounded-full bg-violet font-bold ${className}`} style={{ fontFamily: "var(--font-heading)" }}>{(name.trim()[0] ?? "?").toUpperCase()}</div>;
}
