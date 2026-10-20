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
