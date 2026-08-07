# Reveal images

Drop image files in this folder — `.png`, `.jpg`, `.jpeg`, `.webp`, `.avif`, `.gif` or `.svg`.

They are collected automatically by `src/data/revealImages.js` (via `import.meta.glob`), sorted by
filename, and cycled one per completed Pomodoro session. There is no list to maintain: adding a file
here is the whole step.

Notes:

- **Sizing** — images are cropped to a circle with `object-cover`, so square-ish crops with the
  subject near the centre work best. Roughly 800×800 or larger keeps it sharp.
- **Order** — filenames sort naturally, so `01-…`, `02-…` gives you explicit control.
- **Empty folder** — the timer falls back to a placeholder that points back at this folder, so the
  app still runs before you add anything.
