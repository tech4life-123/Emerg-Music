# Emerg Music build log

## Milestone 1 — Phase 1: brand and design foundation (2026-10-20)
- Logo concept chosen: **A, sound-bar E** (spine + three bars of different lengths). Rejected B (rising waveform: generic audio look) and C (ring + E: unreadable at app-icon size).
- Assets in `public/brand/` (SVG, wordmark converted to outlines from Space Grotesk Bold): primary, horizontal (dark, light, two mono), symbol (two mono), app icon, maskable icon, favicon, concept comparison.
- Tokens and component rules: `design/tokens.css` (Tailwind v4 bridge included). Contrast checked: all text pairs meet WCAG AA.
- Preview: `design/brand-guide.html`. Generator: `design/build_brand.py`.
- Not done yet: app scaffold (Next.js), database schema, auth. Those start Phase 2.
