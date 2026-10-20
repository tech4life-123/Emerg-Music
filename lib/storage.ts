// Media URLs. Audio and artwork live in object storage (Cloudflare R2 planned).
// Until NEXT_PUBLIC_MEDIA_BASE_URL is set, no media can be resolved and the UI says so honestly.
const base = process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.replace(/\/$/, "");

export const mediaConfigured = Boolean(base);
export const mediaUrl = (path: string | null | undefined) => (base && path ? `${base}/${path.replace(/^\//, "")}` : null);
