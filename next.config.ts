import type { NextConfig } from "next";

// Lets Next resize cover art from the media bucket, so shared-link images stay small enough for chat apps.
const media = process.env.NEXT_PUBLIC_MEDIA_BASE_URL;
const remotePatterns = media ? [{ protocol: "https" as const, hostname: new URL(media).hostname }] : [];

const nextConfig: NextConfig = { images: { remotePatterns } };
export default nextConfig;
