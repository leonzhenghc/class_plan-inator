import { ImagePlus } from 'lucide-react'
import { cn } from '../ui/cn.js'

/** Heaviest blur, in px, applied at the very start of a session. */
const MAX_BLUR = 26
/** How far the image is scaled up, so blurred edges bleed past the circular crop. */
const OVERSCAN = 'scale-110'

/**
 * Easing for the two filters. Both take `revealed` (0 = session start, 1 = complete).
 *
 * Exponents below 1 hold the effect high through the middle of the session, so the image
 * resolves late rather than becoming legible in the first few minutes. Grayscale lifts a
 * little sooner than blur, letting colour hint at the subject before the detail lands.
 */
const blurFor = (revealed) => MAX_BLUR * (1 - revealed) ** 0.75
const grayscaleFor = (revealed) => 100 * (1 - revealed) ** 1.2

export default function RevealImage({ src, alt, revealed = 0, className }) {
  if (!src) {
    return (
      <div
        className={cn(
          'flex h-[340px] w-[340px] flex-col items-center justify-center gap-3 rounded-full border-2 border-dashed border-gray-300 bg-white px-12 text-center',
          className,
        )}
      >
        <ImagePlus className="h-8 w-8 text-gray-400" strokeWidth={1.75} />
        <p className="text-[15px] font-semibold text-gray-600">No reveal images yet</p>
        <p className="text-[13px] leading-relaxed text-gray-400">
          Drop images into <span className="font-medium text-gray-500">src/assets/reveal/</span> to
          see them resolve as the timer runs.
        </p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative h-[340px] w-[340px] overflow-hidden rounded-full bg-gray-100 shadow-sm ring-1 ring-gray-200',
        className,
      )}
    >
      <img
        src={src}
        alt={alt}
        className={cn(
          'h-full w-full object-cover blur-[var(--reveal-blur)] grayscale-[var(--reveal-grayscale)]',
          'transition-[filter] duration-1000 ease-linear will-change-[filter]',
          OVERSCAN,
        )}
        style={{
          '--reveal-blur': `${blurFor(revealed).toFixed(2)}px`,
          '--reveal-grayscale': `${grayscaleFor(revealed).toFixed(2)}%`,
        }}
      />
      {/* Keeps the crop edge crisp against light images. */}
      <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-black/5 ring-inset" />
    </div>
  )
}
