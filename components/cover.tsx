/* eslint-disable @next/next/no-img-element */
// Cover art or artist photo, with a branded fallback when none has been uploaded.
const FALLBACKS = [
  "linear-gradient(135deg,#8F50B5,#D6A6F5)", "linear-gradient(135deg,#38213F,#8F50B5)", "linear-gradient(135deg,#E8B45A,#EF7B8A)",
  "linear-gradient(135deg,#6FCF97,#38213F)", "linear-gradient(135deg,#D6A6F5,#38213F)", "linear-gradient(135deg,#EF7B8A,#8F50B5)",
];
const pick = (s: string) => FALLBACKS[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % FALLBACKS.length];

export function Cover({ url, seed, className = "", round = false }: { url: string | null; seed: string; className?: string; round?: boolean }) {
  const shape = round ? "rounded-full" : "rounded-md";
  return url
    ? <img src={url} alt="" loading="lazy" className={`${shape} aspect-square shrink-0 object-cover ${className}`} />
    : <div aria-hidden className={`${shape} grid aspect-square shrink-0 place-items-center ${className}`} style={{ background: pick(seed) }}>
        <svg viewBox="0 0 72 64" className="h-1/3 w-1/3 opacity-80" fill="#F8F2FF"><rect x="4" y="6" width="10" height="52" rx="5" /><rect x="20" y="6" width="32" height="10" rx="5" /><rect x="20" y="27" width="22" height="10" rx="5" /><rect x="20" y="48" width="48" height="10" rx="5" /></svg>
      </div>;
}
