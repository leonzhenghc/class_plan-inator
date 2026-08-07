import { useEffect, useRef, useState } from 'react'
import { ImagePlus } from 'lucide-react'
import { cn } from '../ui/cn.js'

/** Edge length of one revealed block, in CSS pixels. Smaller = finer grain. */
const CELL = 22
/**
 * How much a block's turn is nudged away from its true distance, in cell widths.
 * Zero would pop each ring in all at once, which reads mechanical; a little
 * scatter makes the edge crumble outward instead.
 */
const JITTER = 2.6

/**
 * Reveals the image block by block, spreading outward from the centre.
 *
 * Done on a canvas rather than with a CSS mask because the order matters: each
 * block is sorted by its distance from the middle and drawn when the timer
 * reaches its share of the block. Blocks are only ever drawn once — a tick
 * paints the handful that just came due rather than repainting the whole frame.
 */
export default function RevealImage({ src, alt, revealed = 0, className }) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  /** Everything the draw loop needs that must survive re-renders without causing them. */
  const sceneRef = useRef({ cells: [], drawn: 0, source: null, ratio: 1 })
  const [ready, setReady] = useState(false)

  // Build the offscreen copy and the block order. Re-runs on resize or image swap.
  useEffect(() => {
    if (!src) return undefined

    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return undefined

    let cancelled = false
    const image = new Image()
    image.decoding = 'async'

    const build = () => {
      if (cancelled) return
      const { clientWidth: width, clientHeight: height } = container
      if (!width || !height || !image.naturalWidth) return

      const ratio = window.devicePixelRatio || 1
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      // Pre-render the image at cover size once, so each block is a cheap copy.
      const source = document.createElement('canvas')
      source.width = canvas.width
      source.height = canvas.height
      const sourceCtx = source.getContext('2d')
      const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
      const drawWidth = image.naturalWidth * scale * ratio
      const drawHeight = image.naturalHeight * scale * ratio
      sourceCtx.drawImage(
        image,
        (canvas.width - drawWidth) / 2,
        (canvas.height - drawHeight) / 2,
        drawWidth,
        drawHeight,
      )

      const cols = Math.ceil(width / CELL)
      const rows = Math.ceil(height / CELL)
      const centreX = (cols - 1) / 2
      const centreY = (rows - 1) / 2

      const cells = []
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const dx = col - centreX
          const dy = row - centreY
          cells.push({
            x: col * CELL,
            y: row * CELL,
            order: Math.hypot(dx, dy) + Math.random() * JITTER,
          })
        }
      }
      cells.sort((a, b) => a.order - b.order)

      sceneRef.current = { cells, drawn: 0, source, ratio }
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
      setReady(true)
    }

    image.onload = build
    image.src = src

    const observer = new ResizeObserver(build)
    observer.observe(container)

    return () => {
      cancelled = true
      observer.disconnect()
      setReady(false)
    }
  }, [src])

  // Paint whatever has come due since the last tick.
  useEffect(() => {
    if (!ready) return
    const canvas = canvasRef.current
    const scene = sceneRef.current
    if (!canvas || !scene.source) return

    const ctx = canvas.getContext('2d')
    const { cells, source, ratio } = scene
    const target = Math.round(Math.min(1, Math.max(0, revealed)) * cells.length)

    // Going backwards means the block restarted, so wipe and repaint from scratch.
    if (target < scene.drawn) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      scene.drawn = 0
    }

    for (let index = scene.drawn; index < target; index += 1) {
      const { x, y } = cells[index]
      const sx = x * ratio
      const sy = y * ratio
      const size = CELL * ratio
      ctx.drawImage(source, sx, sy, size, size, sx, sy, size, size)
    }
    scene.drawn = target

    // Rounding can leave hairlines at 100%; lay the finished image over the top.
    if (target === cells.length) ctx.drawImage(source, 0, 0)
  }, [revealed, ready])

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
    <div
      ref={containerRef}
      role="img"
      aria-label={alt}
      className={cn('overflow-hidden bg-gray-900', className)}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  )
}
