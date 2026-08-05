import { ImagePlus } from 'lucide-react'
import { cn } from '../ui/cn.js'

/** Heaviest blur, in px, applied at the very start of a block. */
const MAX_BLUR = 32
/** Scale-up so the blur's soft edge bleeds past the frame instead of showing a halo. */
const OVERSCAN = 'scale-110'

/**
 * Easing for the two filters. Both take `revealed` (0 = block start, 1 = complete).
 *
 * Exponents below 1 hold the effect high through the middle of the block, so the image
 * resolves late rather than becoming legible in the first few minutes. Grayscale lifts a
 * little sooner than blur, letting colour hint at the subject before the detail lands.
 */
const blurFor = (revealed) => MAX_BLUR * (1 - revealed) ** 0.75
const grayscaleFor = (revealed) => 100 * (1 - revealed) ** 1.2

/** Fills whatever it is given — the stage sizes it, so it works full-bleed. */
export default function RevealImage({ src, alt, revealed = 0, className }) {
  if (!src) {
    return (
      <div className={cn('flex items-center justify-center bg-gray-900', className)}>
        <div className="flex max-w-sm flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-white/20 px-10 py-10 text-center">
          <ImagePlus className="h-8 w-8 text-white/40" strokeWidth={1.75} />
          <p className="text-[15px] font-semibold text-white/80">No reveal images yet</p>
          <p className="text-[13px] leading-relaxed text-white/40">
            Drop images into <span className="font-medium text-white/60">src/assets/reveal/</span>{' '}
            to see them resolve as the timer runs.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('overflow-hidden bg-gray-900', className)}>
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
    </div>
  )
}
