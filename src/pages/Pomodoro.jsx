import { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, Lightbulb, Pause, Pencil, Play, RotateCcw, SkipForward } from 'lucide-react'
import TopBar from '../components/layout/TopBar.jsx'
import Card from '../components/ui/Card.jsx'
import ProgressBar from '../components/ui/ProgressBar.jsx'
import SegmentedControl from '../components/ui/SegmentedControl.jsx'
import { activityLog } from '../data/mock.js'

const MODES = [
  { value: 'focus', label: 'Focus', minutes: 25, caption: 'Focusing' },
  { value: 'short', label: 'Short Break', minutes: 5, caption: 'Short Break' },
  { value: 'long', label: 'Long Break', minutes: 15, caption: 'Long Break' },
]

const RADIUS = 150
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function Pomodoro() {
  const [mode, setMode] = useState('focus')
  const [running, setRunning] = useState(false)
  const intervalRef = useRef(null)

  const activeMode = useMemo(() => MODES.find((m) => m.value === mode), [mode])
  const totalSeconds = activeMode.minutes * 60
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds)

  useEffect(() => {
    setSecondsLeft(activeMode.minutes * 60)
    setRunning(false)
  }, [activeMode])

  useEffect(() => {
    if (!running) return undefined
    intervalRef.current = setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) {
          setRunning(false)
          return 0
        }
        return value - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [running])

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const seconds = String(secondsLeft % 60).padStart(2, '0')
  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 0

  const reset = () => {
    setRunning(false)
    setSecondsLeft(totalSeconds)
  }

  const skip = () => {
    setRunning(false)
    setSecondsLeft(0)
  }

  return (
    <>
      <TopBar placeholder="Search tasks, notes..." />

      <main className="flex flex-1 items-start gap-6 px-8 py-8">
        {/* ------------------------------ Timer column ---------------------------- */}
        <div className="flex min-w-0 flex-1 flex-col items-center">
          <SegmentedControl
            options={MODES.map(({ value, label }) => ({ value, label }))}
            value={mode}
            onChange={setMode}
          />

          <div className="relative mt-10 h-[340px] w-[340px]">
            <svg viewBox="0 0 340 340" className="h-full w-full -rotate-90">
              <circle
                cx="170"
                cy="170"
                r={RADIUS}
                fill="none"
                stroke="currentColor"
                strokeWidth="14"
                className="text-gray-200"
              />
              <circle
                cx="170"
                cy="170"
                r={RADIUS}
                fill="none"
                stroke="currentColor"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
                className="text-brand-600 transition-[stroke-dashoffset] duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-[76px] leading-none font-extrabold tracking-tight tabular-nums text-gray-900">
                {minutes}:{seconds}
              </p>
              <p className="mt-4 text-[15px] font-bold tracking-[0.12em] text-brand-600 uppercase">
                {activeMode.caption}
              </p>
            </div>
          </div>

          <div className="mt-10 flex items-center gap-6">
            <button
              type="button"
              onClick={reset}
              aria-label="Reset timer"
              className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50"
            >
              <RotateCcw className="h-5 w-5" strokeWidth={2.25} />
            </button>

            <button
              type="button"
              onClick={() => setRunning((value) => !value)}
              aria-label={running ? 'Pause timer' : 'Start timer'}
              className="flex h-[76px] w-[76px] cursor-pointer items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/25 transition-colors hover:bg-brand-700"
            >
              {running ? (
                <Pause className="h-8 w-8" strokeWidth={2.25} />
              ) : (
                <Play className="h-8 w-8 translate-x-0.5" strokeWidth={2.25} />
              )}
            </button>

            <button
              type="button"
              onClick={skip}
              aria-label="Skip session"
              className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50"
            >
              <SkipForward className="h-5 w-5" strokeWidth={2.25} />
            </button>
          </div>

          <Card className="mt-10 flex w-full max-w-[560px] items-center gap-4 px-5 py-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100">
              <BookOpen className="h-5 w-5 text-brand-600" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] text-gray-500">Active Task</p>
              <p className="truncate text-[17px] font-bold text-gray-900">
                Calculus III: Chapter 4 Exercises
              </p>
            </div>
            <button
              type="button"
              aria-label="Edit active task"
              className="cursor-pointer rounded-lg p-2 text-brand-600 transition-colors hover:bg-brand-50"
            >
              <Pencil className="h-5 w-5" strokeWidth={2} />
            </button>
          </Card>
        </div>

        {/* ------------------------------ Right column ---------------------------- */}
        <div className="w-[380px] shrink-0 space-y-5">
          <Card className="px-6 py-5">
            <p className="text-[15px] font-bold text-gray-900">Daily Progress</p>
            <div className="mt-3 flex items-end justify-between gap-4">
              <p className="text-[27px] leading-tight font-extrabold tracking-tight text-brand-600">
                Session 2 of 4
              </p>
              <p className="shrink-0 pb-1 text-[13px] text-gray-500">50% Completed</p>
            </div>
            <ProgressBar value={50} className="mt-3" />
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
    </>
  )
}
