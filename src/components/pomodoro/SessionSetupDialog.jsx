import { useEffect, useRef, useState } from 'react'
import { ImageOff, Play, Shuffle, X } from 'lucide-react'
import Button from '../ui/Button.jsx'
import Checkbox from '../ui/Checkbox.jsx'
import Stepper from '../ui/Stepper.jsx'
import { cn } from '../ui/cn.js'
import { revealImages } from '../../data/revealImages.js'
import { sessionTaskOptions } from '../../data/mock.js'
import { DEFAULT_CONFIG } from '../../context/StudySessionContext.jsx'

export default function SessionSetupDialog({
  open,
  initialConfig,
  hasExistingSession,
  onDismiss,
  onStart,
}) {
  const [focusMinutes, setFocusMinutes] = useState(DEFAULT_CONFIG.focusMinutes)
  const [breakMinutes, setBreakMinutes] = useState(DEFAULT_CONFIG.breakMinutes)
  const [rounds, setRounds] = useState(DEFAULT_CONFIG.rounds)
  const [image, setImage] = useState(DEFAULT_CONFIG.image)
  const [taskIds, setTaskIds] = useState(DEFAULT_CONFIG.taskIds)
  const dialogRef = useRef(null)

  // Re-seed from the last session each time the dialog opens.
  useEffect(() => {
    if (!open) return
    const base = initialConfig ?? DEFAULT_CONFIG
    setFocusMinutes(base.focusMinutes)
    setBreakMinutes(base.breakMinutes)
    setRounds(base.rounds)
    setImage(base.image)
    setTaskIds(base.taskIds)
    dialogRef.current?.focus()
  }, [open, initialConfig])

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onDismiss()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onDismiss])

  if (!open) return null

  const toggleTask = (id) =>
    setTaskIds((ids) => (ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]))

  const totalMinutes = focusMinutes * rounds + breakMinutes * Math.max(0, rounds - 1)

  const submit = (event) => {
    event.preventDefault()
    onStart({ focusMinutes, breakMinutes, rounds, image, taskIds })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
      <button
        type="button"
        aria-label="Close session setup"
        tabIndex={-1}
        onClick={onDismiss}
        className="absolute inset-0 cursor-pointer bg-gray-900/40 backdrop-blur-sm"
      />

      <form
        ref={dialogRef}
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-setup-title"
        tabIndex={-1}
        className="relative flex max-h-[88vh] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl focus:outline-none"
      >
        <div className="px-7 pt-5 pb-5">
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close"
            className="-ml-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-[18px] w-[18px]" strokeWidth={2.25} />
          </button>

          <h2 id="session-setup-title" className="mt-3 text-2xl font-extrabold tracking-tight">
            Set up your session
          </h2>
          <p className="mt-1 text-[15px] text-gray-500">
            About {totalMinutes} min in total, including breaks.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-7 pb-2">
          {/* ------------------------------- Durations ------------------------------ */}
          <div className="grid grid-cols-3 gap-3">
            <Stepper
              label="Focus"
              unit="min"
              value={focusMinutes}
              onChange={setFocusMinutes}
              min={5}
              max={90}
              step={5}
            />
            <Stepper
              label="Break"
              unit="min"
              value={breakMinutes}
              onChange={setBreakMinutes}
              min={1}
              max={30}
              step={1}
            />
            <Stepper label="Rounds" value={rounds} onChange={setRounds} min={1} max={8} />
          </div>

          {/* --------------------------------- Tasks -------------------------------- */}
          <div className="mt-7">
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <h3 className="text-[15px] font-semibold text-gray-800">What are you working on?</h3>
              <span className="text-[13px] text-gray-400">
                {taskIds.length} selected · optional
              </span>
            </div>

            <ul className="max-h-[184px] space-y-2 overflow-y-auto pr-1">
              {sessionTaskOptions.map((task) => {
                const checked = taskIds.includes(task.id)
                return (
                  <li key={task.id}>
                    <label
                      className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors',
                        checked
                          ? 'border-brand-300 bg-brand-50/60'
                          : 'border-gray-200 hover:bg-gray-50',
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onChange={() => toggleTask(task.id)}
                        label={task.title}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-semibold text-gray-800">
                          {task.title}
                        </span>
                        <span
                          className={cn(
                            'mt-0.5 block text-[13px]',
                            task.urgent ? 'text-red-500' : 'text-gray-500',
                          )}
                        >
                          {task.meta}
                        </span>
                      </span>
                      <span className="shrink-0 pt-0.5 text-[11px] font-bold tracking-[0.06em] text-gray-400 uppercase">
                        {task.source}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* --------------------------------- Image -------------------------------- */}
          <div className="mt-7">
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <h3 className="text-[15px] font-semibold text-gray-800">Reveal image</h3>
              <span className="text-[13px] text-gray-400">Unblurs as you focus</span>
            </div>

            {revealImages.length === 0 ? (
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-300 px-4 py-4">
                <ImageOff className="h-5 w-5 shrink-0 text-gray-400" strokeWidth={1.75} />
                <p className="text-[13px] leading-relaxed text-gray-500">
                  No images yet — drop some into{' '}
                  <span className="font-medium text-gray-700">src/assets/reveal/</span> and they
                  will show up here.
                </p>
              </div>
            ) : (
              <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pt-1 pb-3">
                <ImageTile
                  selected={image === 'auto'}
                  onSelect={() => setImage('auto')}
                  label="Auto"
                >
                  <span className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-brand-50 text-brand-600">
                    <Shuffle className="h-5 w-5" strokeWidth={2} />
                    <span className="text-[11px] font-bold tracking-wide uppercase">Rotate</span>
                  </span>
                </ImageTile>

                {revealImages.map((item, index) => (
                  <ImageTile
                    key={item.src}
                    selected={image === index}
                    onSelect={() => setImage(index)}
                    label={item.name}
                  >
                    <img src={item.src} alt={item.name} className="h-full w-full object-cover" />
                  </ImageTile>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-7 py-5">
          {hasExistingSession ? (
            <Button type="button" variant="outline" onClick={onDismiss}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" icon={Play}>
            Start session
          </Button>
        </div>
      </form>
    </div>
  )
}

function ImageTile({ selected, onSelect, label, children }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      title={label}
      className={cn(
        'h-[84px] w-[84px] shrink-0 snap-start cursor-pointer overflow-hidden rounded-xl ring-2 transition',
        selected
          ? 'ring-brand-600 ring-offset-2'
          : 'ring-gray-200 hover:ring-gray-300 ring-offset-0',
      )}
    >
      {children}
    </button>
  )
}
