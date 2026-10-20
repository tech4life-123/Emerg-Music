# Emerg Music build log

## Milestone 1 — Phase 1: brand and design foundation (2026-10-20)
- Logo concept chosen: **A, sound-bar E** (spine + three bars of different lengths). Rejected B (rising waveform: generic audio look) and C (ring + E: unreadable at app-icon size).
- Assets in `public/brand/` (SVG, wordmark converted to outlines from Space Grotesk Bold): primary, horizontal (dark, light, two mono), symbol (two mono), app icon, maskable icon, favicon, concept comparison.
- Tokens and component rules: `design/tokens.css` (Tailwind v4 bridge included). Contrast checked: all text pairs meet WCAG AA.
- Preview: `design/brand-guide.html`. Generator: `design/build_brand.py`.
- Not done yet: app scaffold (Next.js), database schema, auth. Those start Phase 2.

## Milestone 2 — Phase 2: core product (2026-10-20)
- **Supabase project "Emerg Music"** (eu-west-1, free plan). Migrations in `supabase/migrations/` (0001 schema, 0002 function lockdown), applied to the project.
- **12 tables, all with Row Level Security**: profiles, artist_applications, artists, releases, tracks, rights_declarations, playlists, playlist_tracks, favorites, play_events, copyright_reports, audit_log.
- Rules enforced in the database: users cannot change their own role; artists can only submit a release (draft -> in_review) after a rights declaration; only admins publish or remove; admin actions (approve/reject artist, moderate release) are audited.
- **App**: Next.js 16 (App Router) + TypeScript + Tailwind v4 + Supabase SSR auth. Pages: home, sign up, sign in, sign out, profile (name + language). English and French strings in `messages/`. Fonts self-hosted.
- **Checks run**: `tsc` clean; `next build` passes; routes return 200, `/profile` redirects to sign-in when logged out; access tests against the live database (rolled-back transactions) behaved as intended; Supabase security advisor re-checked after lockdown.
- **First admin**: sign up in the app, then run in the Supabase SQL editor: `update public.profiles set role='admin' where id = (select id from auth.users where email = 'YOUR_EMAIL');`
- Not done: Vercel environment variables, email confirmation settings, catalog/player (Phase 3), audio storage choice.

## Milestone 3 — Phase 3a: listening experience (2026-10-20)
- Catalog reads (RLS-filtered to published music), search (tracks + artists), track and artist pages with WhatsApp/Facebook/copy-link sharing and Open Graph tags, empty states, English/French strings.
- Persistent player (one `<audio>` element in the root layout, so playback continues across navigation): play/pause, seek, next/previous, volume, queue, Media Session (lock-screen controls), reduced-motion aware. A play is recorded after 30 s for signed-in users.
- `lib/storage.ts` resolves media from `NEXT_PUBLIC_MEDIA_BASE_URL`. Until it is set, tracks show "no audio available yet" instead of pretending to play.
- Migration 0003: least-privilege grants (anon can read only the public catalog; no truncate/delete rights anywhere).
- Checks: `tsc` and `next build` pass; catalog visibility rules and grants tested in the database. NOT tested: playback in a browser (no audio storage yet), favorites/playlists UI, the app against live data from this workspace (it cannot reach Supabase).
- Audio storage decision: Cloudflare R2 (free egress, 10 GB free; docs checked 2026-10-20) over Supabase Storage (free plan: 1 GB storage, 5 GB egress, 50 MB files).
