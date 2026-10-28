# PunArn prototype — design plan

Subject: shared cloud library service for Thai secondary schools. Audience: non-librarian teachers (busy, Google-Form level skills) and students 12–18 on phones. Primary job: teachers finish daily library work without library jargon; students want to open it on their own.

## Tokens
- ink #16302E · ink-2 #4A6360 · paper #F4F7F6 (cool, not cream) · white
- teal #0D6E68 (primary, white text 6.1:1) · teal-50 #E3F2EF
- coral #F26B4F (student accent; ink text only, never white) · coral-ink #B23A22 · coral-50 #FDECE7
- line #D5E0DE · amber #94600A (borrowed) · red #B42318 (overdue)
- Type: IBM Plex Sans Thai 500/600 (UI, headings, numbers) + IBM Plex Sans Thai Looped 400/500 (body, book titles). Scale 13/15/17/21/28/40. No letterspacing on Thai.

## Layout
- Student: one column, max 460px, bottom nav (4). Desktop shows the same column centred.
- Teacher: 232px sidebar + main, left aligned, max 1100px. Tables, not card grids.
- Kiosk: full bleed split — left welcome/clock, right keypad.
- Executive: filter row → one stat strip (4 cells, hairline dividers) → charts 2-up.

## Signature (spend boldness here only)
1. Real covers standing on a shelf rail (student home).
2. The spine label — a white sticker with a teal top band and the call number stacked — used as the "where is it" answer, the print label, and the mini badge on results.

## Review against generic defaults (what changed)
- Teacher "Today" was going to be 4 stat cards (SaaS kit). Changed to one plain Thai sentence with the numbers in bold, then big tool buttons and plain tables. Reason: teachers asked for "what happened today", not a dashboard.
- Student hero was going to be a big headline + gradient. Changed to the search box sitting directly on the first shelf of covers: the books are the hero.
- Removed: eyebrow labels, middle-dot meta strings, arrows in buttons, monospace data labels, shadowed cards. Radius by hierarchy: covers 3px, inputs/buttons 10px, panels 14px, chips pill.
- Motion: only the kiosk welcome moment and the borrow-saved confirmation. prefers-reduced-motion respected.
