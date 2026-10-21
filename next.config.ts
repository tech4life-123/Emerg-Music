import type { NextConfig } from "next";

// Lets Next resize cover art from the media bucket, so shared-link images stay small enough for chat apps.
const media = process.env.NEXT_PUBLIC_MEDIA_BASE_URL;
const remotePatterns = media ? [{ protocol: "https" as const, hostname: new URL(media).hostname }] : [];

const nextConfig: NextConfig = {
  images: { remotePatterns },
  // The audio processing route runs the bundled ffmpeg binary, so make sure it ships with the function.
  serverExternalPackages: ["ffmpeg-static"],
  outputFileTracingIncludes: { "/api/audio/process": ["./node_modules/ffmpeg-static/ffmpeg"] },
};
export default nextConfig;
