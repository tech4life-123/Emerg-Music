// Open Graph helpers: the image in a shared link (WhatsApp, Facebook, X). Chat apps need an absolute URL and skip very large images,
// so uploaded art goes through Next's image resizer (640 px wide) and falls back to the branded card.
const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const siteUrl = site;
export function shareImage(mediaUrl: string | null) {
  return mediaUrl ? `${site}/_next/image?url=${encodeURIComponent(mediaUrl)}&w=640&q=75` : `${site}/opengraph-image`;
}
