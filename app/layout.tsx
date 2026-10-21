import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { getLocale, getMessages } from "@/lib/i18n";
import { PlayerProvider } from "@/components/player/player-provider";
import { PlayerBar } from "@/components/player/player-bar";
import { SiteHeader } from "@/components/site-header";
import { BottomNav } from "@/components/bottom-nav";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
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

const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const metadata: Metadata = {
  metadataBase: new URL(site),
  openGraph: { siteName: "Emerg Music", type: "website" },
  title: { default: "Emerg Music", template: "%s · Emerg Music" },
  description: "Discover. Stream. Share. Music from Liberia and Africa.",
};
export const viewport: Viewport = { themeColor: "#130f18" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const { t } = await getMessages();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <html lang={locale} className={`${heading.variable} ${body.variable}`}>
      <body style={{ ["--font-heading" as string]: "var(--font-heading-loaded), ui-sans-serif, system-ui", ["--font-body" as string]: "var(--font-body-loaded), ui-sans-serif, system-ui" }}>
        <PlayerProvider guestLabels={t.guest}>
          <SiteHeader />
          <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">{children}</main>
          <footer className="mx-auto max-w-5xl px-4 pb-40 text-sm text-muted sm:px-6"><Link className="underline" href="/report">{t.report.title}</Link></footer>
          <PlayerBar labels={t.player} guestCounter={t.guest.counter} />
          <BottomNav signedIn={Boolean(user)} labels={{ home: t.nav.home, search: t.nav.search, profile: t.nav.profile, signIn: t.nav.signIn }} />
        </PlayerProvider>
      </body>
    </html>
  );
}
