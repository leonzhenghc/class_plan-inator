/**
 * Reveal images for the Pomodoro timer.
 *
 * Drop your image files into `src/assets/reveal/` — they are picked up
 * automatically, sorted by filename, and cycled one per completed session.
 * No import statements to maintain: add a file, it shows up.
 */
const modules = import.meta.glob('../assets/reveal/*.{png,jpg,jpeg,webp,avif,gif,svg}', {
  eager: true,
  import: 'default',
})

export const revealImages = Object.entries(modules)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([path, src]) => ({
    src,
    name: path.split('/').pop().replace(/\.[^.]+$/, ''),
  }))
