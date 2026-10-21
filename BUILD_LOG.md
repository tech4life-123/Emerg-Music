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

## Milestone 4 — Phase 4: Artist Studio and administration (2026-10-20)
- **Artist Studio** (`/studio`): apply as artist (with consent), see application status/reason, create releases, add track metadata, rights declaration (versioned, EN/FR text, stored with user and time), submit for review, real play count (no estimates), monetization explainer ("no payment per stream promised").
- **Admin** (`/admin`, admin role checked on the server and in the database): approve/reject applications (reason required), publish/remove releases (reason required to remove), handle copyright reports, audit log of admin actions.
- **Public** `/report`: anyone can file a copyright report; linked in the footer.
- **Audio upload is NOT built**: it needs audio storage credentials. The UI says so; no fake upload.
- Checks: `tsc` and `next build` pass. Workflow tested in the database (rolled back): consent required; artist cannot approve themselves, self-publish, or submit without a rights declaration; admin approve/publish writes audit rows; removal needs a reason.
- **OPEN SECURITY ISSUE**: test showed an artist can attach a track to another artist's release. Fix is `supabase/migrations/0004_tracks_match_release_artist.sql` (NOT applied; the Supabase tool asked for confirmation). Apply it before real artists use the Studio.

## Milestone 5 — Audio storage + artist upload
- Cloudflare R2 bucket `emerg-audio` created (private bucket, public r2.dev read URL set as NEXT_PUBLIC_MEDIA_BASE_URL).
- Artist uploads: server action validates ownership/draft/type/size, returns 10-min signed PUT URL; browser uploads direct to R2; second action records audio_path.
- Release submit now requires audio on every track.
- Migration 0005 (NOT applied): audio_path must be under audio/<artist>/<track>/.
- Needs: R2 CORS (PUT/GET/HEAD), R2_* env vars in Vercel, 0004 + 0005 run in Supabase.
- Not tested end-to-end: sandbox cannot reach R2/Supabase.

## Milestone 6 — Genres, new pages, guest limit, link previews
- Migration 0006 applied: genre_categories (7), genres (25), tracks.genre_id (required for new/changed tracks), secondary genre, cover/artist-photo folder checks.
- Studio: genre picker (grouped by category), cover art upload, artist photo upload (signed uploads, 5 MB images).
- Pages: Home (signed-in greeting, new releases, genres, artists, latest tracks), Search + genre grid, /genre/[slug], /release/[id], artist and track redesign, mobile bottom nav.
- Studio/Admin links only for artists/admins; listeners get "Apply as an artist" in Profile.
- Guest limit: 5 plays (30 s each) counted in a cookie; sign-up/sign-in sheet after that. Cookie-based, so clearing cookies resets it.
- Link previews: Open Graph/Twitter metadata; cover or artist photo resized to 640 px via Next image; branded fallback card at /opengraph-image.
- Open: track "Fake Life" (Ivyson) predates genres and has none; editing it needs a genre (SQL provided to owner).

## Milestone 7: release wizard, audio optimization, follow and library (migration 0007)
- Artist release flow in three steps (release + artwork, tracks + audio + credits, review + rights). Drafts autosave; upload progress bar; submit moves Draft -> In review (rights declaration v2, three confirmations).
- New DB: releases.language/genre_id, tracks.explicit/processing_status/audio_low_path/audio_std_path, track_credits, artist_follows, artist_blocks, artist_follower_count(), set_track_audio_variants(), profile avatar folder check.
- /api/audio/process: ffmpeg makes 128 kbps and 64 kbps AAC versions and reads the real duration. Player uses the low version on Data Saver / 2G / 3G and falls back to the original file if a processed one fails.
- Likes, follows, "don't play this artist", playlists, Library tab, profile page, edit profile with photo, artist About + Credits card, track credits.
- Verified with rolled-back SQL tests: artists cannot write processing fields, publish, or submit without rights; strangers cannot edit credits, variants or other users' follows/playlists; anon sees credits only for published tracks.

## Milestone 8: admin review and notifications (migration 0008)
- /admin/releases/[id]: listen to each track, see credits, audio versions, rights declaration; Approve and publish, Send back for changes (artist sees the note), or Remove.
- In-app notifications (bell in header, /notifications): release published / removed / needs changes, application approved / rejected. Created only by database triggers.
- Not yet exercised end to end with a real admin action; verify by approving a test release.

## Milestone 9 — Public playlists
- Owners can make a playlist public (shareable by link) or private again; only the owner sees edit controls.
- Public playlist pages are viewable without an account, show only published songs, and carry WhatsApp/Facebook/copy-link sharing with an artwork preview (first track's cover).
- Private playlists are not indexed. No new migration: uses existing `is_public` + RLS.
- Not yet browser-tested while signed in; to check: make a playlist public, open the link in a private window.
