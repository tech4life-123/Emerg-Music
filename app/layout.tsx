import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { getLocale, getMessages } from "@/lib/i18n";
import { PlayerProvider } from "@/components/player/player-provider";
import { PlayerBar } from "@/components/player/player-bar";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

// Self-hosted (no third-party request, smaller risk on slow networks)
const heading = localFont({
  variable: "--font-heading-loaded", display: "swap",
  src: [{ path: "./fonts/space-grotesk-latin-500-normal.woff2", weight: "500" }, { path: "./fonts/space-grotesk-latin-700-normal.woff2", weight: "700" }],
});
const body = localFont({
  variable: "--font-body-loaded", display: "swap",
  src: [{ path: "./fonts/inter-latin-400-normal.woff2", weight: "400" }, { path: "./fonts/inter-latin-600-normal.woff2", weight: "600" }],
});

export const metadata: Metadata = {
  title: { default: "Emerg Music", template: "%s · Emerg Music" },
  description: "Discover. Stream. Share. Music from Liberia and Africa.",
};
export const viewport: Viewport = { themeColor: "#130f18" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const { t } = await getMessages();
  return (
    <html lang={locale} className={`${heading.variable} ${body.variable}`}>
      <body style={{ ["--font-heading" as string]: "var(--font-heading-loaded), ui-sans-serif, system-ui", ["--font-body" as string]: "var(--font-body-loaded), ui-sans-serif, system-ui" }}>
        <PlayerProvider>
          <SiteHeader />
          <main className="mx-auto w-full max-w-5xl px-4 py-10 pb-40 sm:px-6">{children}</main>
          <PlayerBar labels={t.player} />
        </PlayerProvider>
      </body>
    </html>
  );
}
