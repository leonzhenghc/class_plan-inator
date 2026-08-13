import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  Coffee,
  Menu,
  PanelRightOpen,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  SkipForward,
} from 'lucide-react'
import Sidebar from '../components/layout/Sidebar.jsx'
import RevealImage from '../components/pomodoro/RevealImage.jsx'
import SessionDrawer from '../components/pomodoro/SessionDrawer.jsx'
import SessionSetupDialog from '../components/pomodoro/SessionSetupDialog.jsx'
import { cn } from '../components/ui/cn.js'
import { useSessionTaskOptions } from '../hooks/useSessionTaskOptions.js'
import { useStudySession } from '../context/StudySessionContext.jsx'

/** Frosted control styling reused by every button floating over the image. */
const GLASS =
  'bg-white/15 text-white backdrop-blur-md ring-1 ring-white/25 hover:bg-white/25 transition-colors'

export default function Pomodoro() {
  const {
    config,
    hasSession,
    setupOpen,
    openSetup,
    closeSetup,
    startSession,
    phase,
    round,
    secondsLeft,
    blockSeconds,
    running,
    blockComplete,
    sessionComplete,
    activeImage,
    doneTaskIds,
    toggleTask,
    toggle,
    reset,
    skip,
    logError,
  } = useStudySession()

  const sessionTaskOptions = useSessionTaskOptions()
  const [navOpen, setNavOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Landing here without a session set up opens the popup straight away.
  useEffect(() => {
    if (!hasSession) openSetup()
  }, [hasSession, openSetup])

  useEffect(() => {
    if (!navOpen) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setNavOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navOpen])

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const seconds = String(secondsLeft % 60).padStart(2, '0')
  const revealed = blockSeconds > 0 ? 1 - secondsLeft / blockSeconds : 0

  const isBreak = phase === 'break'
  const caption = sessionComplete ? 'Session complete' : isBreak ? 'On a break' : 'Focusing'

  const sessionTasks = sessionTaskOptions.filter((task) => config?.taskIds.includes(task.id))
  // A round counts as done once its focus block is finished, so a break already counts for it.
  const completedRounds = isBreak ? round : round - 1
  const roundProgress = !config
    ? 0
    : sessionComplete
      ? 100
      : (completedRounds / config.rounds) * 100

  let primaryLabel = running ? 'Pause timer' : 'Start timer'
  if (sessionComplete) primaryLabel = 'Start a new session'
  else if (blockComplete) primaryLabel = isBreak ? `Start round ${round + 1}` : 'Start break'

  const onPrimary = () => (sessionComplete ? openSetup() : toggle())

  return (
    <div className="fixed inset-0 z-30 overflow-hidden bg-gray-900">
      <RevealImage
        className="absolute inset-0 h-full w-full"
        src={activeImage?.src}
        alt={activeImage ? `Reveal image: ${activeImage.name}` : 'No reveal image available'}
        revealed={revealed}
      />

      {/* Scrims: keep the overlaid chrome legible over any photo. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />

      {/* --------------------------------- Top bar -------------------------------- */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-4 px-6 py-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="Open navigation"
            className={cn('flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl', GLASS)}
          >
            <Menu className="h-5 w-5" strokeWidth={2.25} />
          </button>

          <span
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-bold tracking-[0.06em] uppercase',
              GLASS,
            )}
          >
            {isBreak ? <Coffee className="h-4 w-4" strokeWidth={2.25} /> : null}
            {config ? `Round ${Math.min(round, config.rounds)} of ${config.rounds}` : 'No session'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openSetup}
            className={cn(
              'inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl px-4 text-[15px] font-semibold',
              GLASS,
            )}
          >
            <Settings2 className="h-[18px] w-[18px]" strokeWidth={2.25} />
            New session
          </button>

          <button
            type="button"
            onClick={() => setDrawerOpen((value) => !value)}
            aria-label="Toggle session details"
            aria-expanded={drawerOpen}
            className={cn('flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl', GLASS)}
          >
            <PanelRightOpen className="h-5 w-5" strokeWidth={2.25} />
          </button>
        </div>
      </div>

      {/* ------------------------------ Bottom controls ---------------------------- */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center px-6 pb-10">
        <p
          className="text-6xl font-extrabold tracking-tight tabular-nums text-white drop-shadow-lg"
          role="timer"
          aria-live="off"
        >
          {minutes}:{seconds}
        </p>
        <p
          className={cn(
            'mt-2 text-[13px] font-bold tracking-[0.14em] uppercase drop-shadow',
            isBreak ? 'text-emerald-300' : 'text-white/75',
          )}
        >
          {caption}
        </p>

        <div className="mt-6 flex items-center gap-5">
          <button
            type="button"
            onClick={reset}
            disabled={!hasSession}
            aria-label="Reset timer"
            className={cn(
              'flex h-14 w-14 cursor-pointer items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-40',
              GLASS,
            )}
          >
            <RotateCcw className="h-5 w-5" strokeWidth={2.25} />
          </button>

          <button
            type="button"
            onClick={onPrimary}
            disabled={!hasSession}
            aria-label={primaryLabel}
            className={cn(
              'flex h-[76px] w-[76px] cursor-pointer items-center justify-center rounded-full text-white shadow-xl transition-colors disabled:cursor-not-allowed disabled:opacity-40',
              isBreak && !sessionComplete
                ? 'bg-emerald-600 shadow-emerald-900/40 hover:bg-emerald-700'
                : 'bg-brand-600 shadow-brand-900/40 hover:bg-brand-700',
            )}
          >
            {sessionComplete ? (
              <CheckCircle2 className="h-8 w-8" strokeWidth={2.25} />
            ) : running ? (
              <Pause className="h-8 w-8" strokeWidth={2.25} />
            ) : (
              <Play className="h-8 w-8 translate-x-0.5" strokeWidth={2.25} />
            )}
          </button>

          <button
            type="button"
            onClick={skip}
            disabled={!hasSession || blockComplete}
            aria-label="Skip session"
            className={cn(
              'flex h-14 w-14 cursor-pointer items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-40',
              GLASS,
            )}
          >
            <SkipForward className="h-5 w-5" strokeWidth={2.25} />
          </button>
        </div>

        {/* Manual advance: name the next block rather than leaving a bare play icon. */}
        <p className="mt-4 h-6 text-[15px] font-semibold text-white/80 drop-shadow">
          {blockComplete
            ? sessionComplete
              ? 'Nice work — all rounds done.'
              : `Ready: ${primaryLabel}`
            : ''}
        </p>
        {logError ? (
          <p
            role="alert"
            className="mt-2 text-[13px] font-medium text-amber-300 drop-shadow"
          >
            {logError}
          </p>
        ) : null}
      </div>

      <SessionDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        config={config}
        round={round}
        roundProgress={roundProgress}
        tasks={sessionTasks}
        doneTaskIds={doneTaskIds}
        onToggleTask={toggleTask}
        onOpenSetup={openSetup}
      />

      {/* ------------------------------ Slide-in nav ------------------------------ */}
      {navOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
          className="absolute inset-0 z-40 cursor-pointer bg-gray-900/40"
        />
      ) : null}
      <Sidebar
        className={cn(
          'z-50 transition-transform duration-300 ease-out',
          navOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
        )}
        onNavigate={() => setNavOpen(false)}
      />

      <SessionSetupDialog
        open={setupOpen}
        initialConfig={config}
        hasExistingSession={hasSession}
        onDismiss={closeSetup}
        onStart={startSession}
      />
    </div>
  )
}
