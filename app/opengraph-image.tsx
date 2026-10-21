import { ImageResponse } from "next/og";

export const alt = "Emerg Music";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Branded fallback card used when a track, album or artist has no uploaded art.
export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 56, background: "linear-gradient(135deg,#38213F,#130F18)", color: "#F8F2FF" }}>
        <svg width="270" height="240" viewBox="0 0 72 64">
          <rect x="4" y="6" width="10" height="52" rx="5" fill="#F8F2FF" /><rect x="20" y="6" width="32" height="10" rx="5" fill="#D6A6F5" />
          <rect x="20" y="27" width="22" height="10" rx="5" fill="#8F50B5" /><rect x="20" y="48" width="48" height="10" rx="5" fill="#D6A6F5" />
        </svg>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 108, fontWeight: 700 }}>Emerg Music</div>
          <div style={{ fontSize: 40, color: "#D6A6F5", marginTop: 8 }}>Discover. Stream. Share.</div>
        </div>
      </div>
    ),
    size,
  );
}
