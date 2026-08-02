import { useEffect } from 'react'
import {
  CheckCircle2,
  Coffee,
  Lightbulb,
  ListChecks,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  SkipForward,
} from 'lucide-react'
import TopBar from '../components/layout/TopBar.jsx'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Checkbox from '../components/ui/Checkbox.jsx'
import ProgressBar from '../components/ui/ProgressBar.jsx'
import RevealImage from '../components/pomodoro/RevealImage.jsx'
import SessionSetupDialog from '../components/pomodoro/SessionSetupDialog.jsx'
import { cn } from '../components/ui/cn.js'
import { activityLog, sessionTaskOptions } from '../data/mock.js'
import { useStudySession } from '../context/StudySessionContext.jsx'

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
  } = useStudySession()

  // Landing here without a session set up opens the popup straight away.
  useEffect(() => {
    if (!hasSession) openSetup()
  }, [hasSession, openSetup])

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
    <>
      <TopBar placeholder="Search tasks, notes..." />

      <main className="flex flex-1 items-start gap-6 px-8 py-8">
        {/* ------------------------------ Timer column ---------------------------- */}
        <div className="flex min-w-0 flex-1 flex-col items-center">
          <div className="flex w-full max-w-[560px] items-center justify-between gap-4">
            <span
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-bold tracking-[0.06em] uppercase',
                isBreak ? 'bg-emerald-100 text-emerald-700' : 'bg-brand-100 text-brand-700',
              )}
            >
              {isBreak ? <Coffee className="h-4 w-4" strokeWidth={2.25} /> : null}
              {config ? `Round ${Math.min(round, config.rounds)} of ${config.rounds}` : 'No session'}
            </span>

            <Button variant="outline" size="sm" icon={Settings2} onClick={openSetup}>
              New session
            </Button>
          </div>

          <RevealImage
            className="mt-8"
            src={activeImage?.src}
            alt={activeImage ? `Reveal image: ${activeImage.name}` : 'No reveal image available'}
            revealed={revealed}
          />

          <div className="mt-7 flex flex-col items-center">
            <p
              className="text-3xl font-bold tracking-tight tabular-nums text-gray-900"
              role="timer"
              aria-live="off"
            >
              {minutes}:{seconds}
            </p>
            <p
              className={cn(
                'mt-2 text-[13px] font-bold tracking-[0.12em] uppercase',
                isBreak ? 'text-emerald-600' : 'text-brand-600',
              )}
            >
              {caption}
            </p>
          </div>

          <div className="mt-8 flex items-center gap-6">
            <button
              type="button"
              onClick={reset}
              disabled={!hasSession}
              aria-label="Reset timer"
              className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw className="h-5 w-5" strokeWidth={2.25} />
            </button>

            <button
              type="button"
              onClick={onPrimary}
              disabled={!hasSession}
              aria-label={primaryLabel}
              className={cn(
                'flex h-[76px] w-[76px] cursor-pointer items-center justify-center rounded-full text-white shadow-lg transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                isBreak && !sessionComplete
                  ? 'bg-emerald-600 shadow-emerald-600/25 hover:bg-emerald-700'
                  : 'bg-brand-600 shadow-brand-600/25 hover:bg-brand-700',
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
              className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <SkipForward className="h-5 w-5" strokeWidth={2.25} />
            </button>
          </div>

          {/* Manual advance: say what the next block is rather than leaving a bare pause icon. */}
          {blockComplete ? (
            <p className="mt-4 text-[15px] font-semibold text-gray-500">
              {sessionComplete ? 'Nice work — all rounds done.' : `Ready: ${primaryLabel}`}
            </p>
          ) : null}

          {/* ---------------------------- Session checklist -------------------------- */}
          <Card className="mt-8 w-full max-w-[560px] px-5 py-4">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-[13px] font-bold tracking-[0.08em] text-gray-900 uppercase">
                <ListChecks className="h-[18px] w-[18px] text-brand-600" strokeWidth={2} />
                This session
              </p>
              {sessionTasks.length > 0 ? (
                <span className="text-[13px] text-gray-500">
                  {doneTaskIds.length}/{sessionTasks.length} done
                </span>
              ) : null}
            </div>

            {sessionTasks.length === 0 ? (
              <p className="mt-3 text-[15px] text-gray-500">
                No tasks picked for this session.{' '}
                <button
                  type="button"
                  onClick={openSetup}
                  className="cursor-pointer font-semibold text-brand-600 hover:text-brand-700"
                >
                  Choose some
                </button>
                .
              </p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {sessionTasks.map((task) => {
                  const done = doneTaskIds.includes(task.id)
                  return (
                    <li key={task.id} className="flex items-start gap-3">
                      <Checkbox
                        checked={done}
                        onChange={() => toggleTask(task.id)}
                        label={task.title}
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            'block text-[15px] font-semibold',
                            done ? 'text-gray-400 line-through' : 'text-gray-800',
                          )}
                        >
                          {task.title}
                        </span>
                        <span className="mt-0.5 block text-[13px] text-gray-500">{task.meta}</span>
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>

        {/* ------------------------------ Right column ---------------------------- */}
        <div className="w-[380px] shrink-0 space-y-5">
          <Card className="px-6 py-5">
            <p className="text-[15px] font-bold text-gray-900">Session Progress</p>
            <div className="mt-3 flex items-end justify-between gap-4">
              <p className="text-[27px] leading-tight font-extrabold tracking-tight text-brand-600">
                {config ? `Round ${Math.min(round, config.rounds)} of ${config.rounds}` : 'Not started'}
              </p>
              <p className="shrink-0 pb-1 text-[13px] text-gray-500">
                {Math.round(roundProgress)}% Completed
              </p>
            </div>
            <ProgressBar value={roundProgress} className="mt-3" />
          </Card>

          <Card className="px-6 py-5">
            <div className="flex items-center justify-between">
              <p className="text-[15px] font-bold text-gray-900">Activity Log</p>
              <span className="text-[13px] text-gray-500">Today</span>
            </div>

            <ul className="mt-5 space-y-4">
              {activityLog.map((entry) => (
                <li key={entry.id} className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-bold text-gray-900">{entry.title}</p>
                    <p className="mt-0.5 text-[13px] text-gray-500">{entry.time}</p>
                  </div>
                  <span className="shrink-0 text-[13px] text-gray-500">{entry.duration}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className="mt-5 w-full cursor-pointer text-center text-[15px] font-semibold text-brand-600 hover:text-brand-700"
            >
              View Full History
            </button>
          </Card>

          <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-5">
            <Lightbulb className="h-5 w-5 text-emerald-700" strokeWidth={2} />
            <p className="mt-3 text-[15px] font-bold text-gray-900">Study Tip</p>
            <p className="mt-2 text-[15px] leading-relaxed text-emerald-900/70">
              Hydrate during your short breaks to maintain cognitive performance throughout long
              sessions.
            </p>
          </div>
        </div>
      </main>

      <SessionSetupDialog
        open={setupOpen}
        initialConfig={config}
        canDismiss={hasSession}
        onDismiss={closeSetup}
        onStart={startSession}
      />
    </>
  )
}
